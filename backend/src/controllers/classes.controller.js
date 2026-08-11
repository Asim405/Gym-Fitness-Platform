const pool = require('../config/db');

// GET /api/classes?from=&to=&trainerId=&page=1&limit=10
async function list(req, res) {
  const { from, to, trainerId, page = 1, limit = 10 } = req.query;
  const conditions = [];
  const params = [];

  if (from) { params.push(from); conditions.push(`start_time >= $${params.length}`); }
  if (to) { params.push(to); conditions.push(`start_time <= $${params.length}`); }
  if (trainerId) { params.push(trainerId); conditions.push(`trainer_id = $${params.length}`); }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const offset = (Number(page) - 1) * Number(limit);
  params.push(Number(limit), offset);

  try {
    const data = await pool.query(
      `SELECT cs.*, u.full_name AS trainer_name,
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

async function create(req, res) {
  const { title, startTime, endTime, capacity, location } = req.body;
  try {
    const insertResult = await pool.query(
      `INSERT INTO class_schedules (title, trainer_id, start_time, end_time, capacity, location)
       VALUES ($1, $2, $3, $4, COALESCE($5, 20), $6)`,
      [title, req.user.id, startTime, endTime, capacity, location || null]
    );
    const classResult = await pool.query('SELECT * FROM class_schedules WHERE id = $1', [insertResult.insertId]);
    res.status(201).json(classResult.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create class' });
  }
}

async function update(req, res) {
  const { title, startTime, endTime, capacity, location } = req.body;
  try {
    await pool.query(
      `UPDATE class_schedules SET
         title = COALESCE($1, title), start_time = COALESCE($2, start_time),
         end_time = COALESCE($3, end_time), capacity = COALESCE($4, capacity), location = COALESCE($5, location)
       WHERE id = $6`,
      [title, startTime, endTime, capacity, location, req.params.id]
    );
    const result = await pool.query('SELECT * FROM class_schedules WHERE id = $1', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Class not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update class' });
  }
}

async function remove(req, res) {
  try {
    const result = await pool.query('DELETE FROM class_schedules WHERE id = $1', [req.params.id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Class not found' });
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete class' });
  }
}

module.exports = { list, create, update, remove };
