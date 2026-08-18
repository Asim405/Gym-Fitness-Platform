const pool = require('../config/db');

// GET /api/classes?from=&to=&trainerId=&page=1&limit=10
async function list(req, res) {
  const { from, to, trainerId, page = 1, limit = 10 } = req.query;
  const conditions = [];
  const params = [];

  if (from) { params.push(from); conditions.push(`start_time >= $${params.length}`); }
  if (to) { params.push(to); conditions.push(`start_time <= $${params.length}`); }
  if (trainerId) { params.push(trainerId); conditions.push(`trainer_id = $${params.length}`); }
  if (req.user.role === 'member') conditions.push(`status = 'scheduled'`);
  if (req.user.role === 'trainer') { params.push(req.user.id); conditions.push(`trainer_id = $${params.length}`); }

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
  const { title, description, startTime, endTime, capacity, location, status, trainerId } = req.body;
  try {
    const assignedTrainerId = req.user.role === 'admin' && trainerId ? Number(trainerId) : req.user.id;
    const trainer = await pool.query(`SELECT id FROM users WHERE id=$1 AND role='trainer' AND is_active=TRUE`, [assignedTrainerId]);
    if (!trainer.rows.length) return res.status(422).json({ error: 'An active trainer must be assigned to the class' });
    const insertResult = await pool.query(
      `INSERT INTO class_schedules (title, description, trainer_id, start_time, end_time, capacity, location, status)
       VALUES ($1, $2, $3, $4, $5, COALESCE($6, 20), $7, COALESCE($8, 'scheduled'))`,
      [title, description || null, assignedTrainerId, startTime, endTime, capacity, location || null, status || null]
    );
    const classResult = await pool.query('SELECT * FROM class_schedules WHERE id = $1', [insertResult.insertId]);
    res.status(201).json(classResult.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create class' });
  }
}

async function update(req, res) {
  const { title, description, startTime, endTime, capacity, location, status, trainerId } = req.body;
  try {
    const existing = await pool.query('SELECT trainer_id FROM class_schedules WHERE id=$1', [req.params.id]);
    if (!existing.rows.length) return res.status(404).json({ error: 'Class not found' });
    if (req.user.role === 'trainer' && existing.rows[0].trainer_id !== req.user.id) return res.status(403).json({ error: 'You can only update your own classes' });
    if (req.user.role === 'trainer' && trainerId && Number(trainerId) !== req.user.id) return res.status(403).json({ error: 'Trainers cannot reassign classes' });
    if (req.user.role === 'admin' && trainerId) {
      const trainer = await pool.query(`SELECT id FROM users WHERE id=$1 AND role='trainer' AND is_active=TRUE`, [trainerId]);
      if (!trainer.rows.length) return res.status(422).json({ error: 'An active trainer must be assigned to the class' });
    }
    await pool.query(
      `UPDATE class_schedules SET
         title = COALESCE($1, title), description = COALESCE($2, description),
         start_time = COALESCE($3, start_time), end_time = COALESCE($4, end_time),
         capacity = COALESCE($5, capacity), location = COALESCE($6, location), status = COALESCE($7, status),
         trainer_id = COALESCE($8, trainer_id)
       WHERE id = $9`,
      [title, description, startTime, endTime, capacity, location, status, req.user.role === 'admin' ? trainerId || null : null, req.params.id]
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
    const existing = await pool.query('SELECT trainer_id FROM class_schedules WHERE id=$1', [req.params.id]);
    if (!existing.rows.length) return res.status(404).json({ error: 'Class not found' });
    if (req.user.role === 'trainer' && existing.rows[0].trainer_id !== req.user.id) return res.status(403).json({ error: 'You can only delete your own classes' });
    const result = await pool.query('DELETE FROM class_schedules WHERE id = $1', [req.params.id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Class not found' });
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete class' });
  }
}

module.exports = { list, create, update, remove };
