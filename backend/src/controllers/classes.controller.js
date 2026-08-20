const pool = require('../config/db');

// Helper: convert ISO string to MySQL datetime format
function toMySQLDateTime(isoString) {
  if (!isoString) return null;
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 19).replace('T', ' '); // '2026-08-16 05:29:00'
}

// Helper: adapt PostgreSQL placeholders to MySQL
function adaptSql(sql, params) {
  if (pool.dbType !== 'mysql') return { sql, params };
  const newParams = [];
  const newSql = sql.replace(/\$(\d+)/g, (match, p1) => {
    const idx = parseInt(p1, 10) - 1;
    newParams.push(params[idx]);
    return '?';
  });
  return { sql: newSql, params: newParams.length ? newParams : params };
}

async function dbQuery(sql, params = []) {
  const { sql: adaptedSql, params: adaptedParams } = adaptSql(sql, params);
  return pool.query(adaptedSql, adaptedParams);
}

// ---- List classes ----
async function list(req, res) {
  const { from, to, trainerId, page = 1, limit = 10 } = req.query;
  const conditions = [];
  const params = [];

  if (from) { params.push(toMySQLDateTime(from)); conditions.push(`cs.start_time >= $${params.length}`); }
  if (to) { params.push(toMySQLDateTime(to)); conditions.push(`cs.start_time <= $${params.length}`); }
  if (trainerId) { params.push(Number(trainerId)); conditions.push(`cs.trainer_id = $${params.length}`); }
  if (req.user.role === 'trainer') { params.push(req.user.id); conditions.push(`cs.trainer_id = $${params.length}`); }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const offset = (Number(page) - 1) * Number(limit);
  params.push(Number(limit), offset);

  try {
    const data = await dbQuery(
      `SELECT cs.id, cs.title, cs.trainer_id, cs.start_time, cs.end_time, cs.capacity, cs.location,
              cs.created_at,
              u.full_name AS trainer_name,
              (SELECT COUNT(*) FROM attendance a WHERE a.class_schedule_id = cs.id AND a.status != 'cancelled') AS booked_count
       FROM class_schedules cs
       JOIN users u ON u.id = cs.trainer_id
       ${where}
       ORDER BY cs.start_time ASC LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );
    res.json({ data: data.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch classes' });
  }
}

// ---- Create class ----
async function create(req, res) {
  const { title, startTime, endTime, capacity, location, trainerId } = req.body;
  try {
    const assignedTrainerId = req.user.role === 'admin' && trainerId ? Number(trainerId) : req.user.id;
    const trainer = await dbQuery(
      `SELECT id FROM users WHERE id=$1 AND role='trainer' AND is_active=TRUE`,
      [assignedTrainerId]
    );
    if (!trainer.rows.length) return res.status(422).json({ error: 'An active trainer must be assigned to the class' });

    const start = toMySQLDateTime(startTime);
    const end = toMySQLDateTime(endTime);
    if (!start || !end) {
      return res.status(400).json({ error: 'Invalid date format' });
    }

    const insertResult = await dbQuery(
      `INSERT INTO class_schedules (title, trainer_id, start_time, end_time, capacity, location)
       VALUES ($1, $2, $3, $4, COALESCE($5, 20), $6)`,
      [title, assignedTrainerId, start, end, capacity, location || null]
    );
    const classResult = await dbQuery(
      `SELECT id, title, trainer_id, start_time, end_time, capacity, location, created_at
       FROM class_schedules WHERE id = $1`,
      [pool.dbType === 'mysql' ? insertResult.insertId : insertResult.rows[0].id]
    );
    res.status(201).json(classResult.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create class' });
  }
}

// ---- Update class ----
async function update(req, res) {
  const { title, startTime, endTime, capacity, location, trainerId } = req.body;
  try {
    const existing = await dbQuery('SELECT trainer_id FROM class_schedules WHERE id=$1', [req.params.id]);
    if (!existing.rows.length) return res.status(404).json({ error: 'Class not found' });
    if (req.user.role === 'trainer' && existing.rows[0].trainer_id !== req.user.id)
      return res.status(403).json({ error: 'You can only update your own classes' });
    if (req.user.role === 'trainer' && trainerId && Number(trainerId) !== req.user.id)
      return res.status(403).json({ error: 'Trainers cannot reassign classes' });
    if (req.user.role === 'admin' && trainerId) {
      const trainer = await dbQuery(
        `SELECT id FROM users WHERE id=$1 AND role='trainer' AND is_active=TRUE`,
        [Number(trainerId)]
      );
      if (!trainer.rows.length) return res.status(422).json({ error: 'An active trainer must be assigned to the class' });
    }

    const updates = [];
    const params = [];
    let paramIndex = 1;

    if (title !== undefined) { updates.push(`title = $${paramIndex++}`); params.push(title); }
    if (startTime !== undefined) {
      const start = toMySQLDateTime(startTime);
      if (!start) return res.status(400).json({ error: 'Invalid start time' });
      updates.push(`start_time = $${paramIndex++}`);
      params.push(start);
    }
    if (endTime !== undefined) {
      const end = toMySQLDateTime(endTime);
      if (!end) return res.status(400).json({ error: 'Invalid end time' });
      updates.push(`end_time = $${paramIndex++}`);
      params.push(end);
    }
    if (capacity !== undefined) { updates.push(`capacity = $${paramIndex++}`); params.push(Number(capacity)); }
    if (location !== undefined) { updates.push(`location = $${paramIndex++}`); params.push(location); }
    if (req.user.role === 'admin' && trainerId !== undefined) {
      updates.push(`trainer_id = $${paramIndex++}`);
      params.push(Number(trainerId));
    }

    if (!updates.length) return res.status(400).json({ error: 'No fields to update' });

    params.push(req.params.id);
    const sql = `UPDATE class_schedules SET ${updates.join(', ')} WHERE id = $${paramIndex}`;
    await dbQuery(sql, params);

    const result = await dbQuery(
      `SELECT id, title, trainer_id, start_time, end_time, capacity, location, created_at
       FROM class_schedules WHERE id = $1`,
      [req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update class' });
  }
}

// ---- Delete class ----
async function remove(req, res) {
  try {
    const existing = await dbQuery('SELECT trainer_id FROM class_schedules WHERE id=$1', [req.params.id]);
    if (!existing.rows.length) return res.status(404).json({ error: 'Class not found' });
    if (req.user.role === 'trainer' && existing.rows[0].trainer_id !== req.user.id)
      return res.status(403).json({ error: 'You can only delete your own classes' });
    await dbQuery('DELETE FROM class_schedules WHERE id = $1', [req.params.id]);
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete class' });
  }
}

module.exports = { list, create, update, remove };