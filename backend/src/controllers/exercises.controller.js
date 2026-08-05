const pool = require('../config/db');

// GET /api/exercises?search=&muscle=&page=1&limit=10
async function list(req, res) {
  const { search = '', muscle = '', page = 1, limit = 10 } = req.query;
  const conditions = [];
  const params = [];

  if (search) {
    params.push(`%${search}%`);
    conditions.push(`name LIKE $${params.length}`);
  }
  if (muscle) {
    params.push(muscle);
    conditions.push(`target_muscle = $${params.length}`);
  }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const offset = (Number(page) - 1) * Number(limit);
  params.push(Number(limit), offset);

  try {
    const data = await pool.query(
      `SELECT * FROM exercises ${where} ORDER BY created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );
    const count = await pool.query(`SELECT COUNT(*) AS total FROM exercises ${where}`, params.slice(0, params.length - 2));
    res.json({ data: data.rows, pagination: { total: count.rows[0].total, page: Number(page), limit: Number(limit) } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch exercises' });
  }
}

async function create(req, res) {
  const { name, targetMuscle, description, mediaUrl, difficulty } = req.body;
  try {
    const insertResult = await pool.query(
      `INSERT INTO exercises (name, target_muscle, description, media_url, difficulty, created_by)
       VALUES ($1, $2, $3, $4, COALESCE($5, 'beginner'), $6)`,
      [name, targetMuscle, description || null, mediaUrl || null, difficulty, req.user.id]
    );
    const created = await pool.query('SELECT * FROM exercises WHERE id = $1', [insertResult.insertId]);
    res.status(201).json(created.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create exercise' });
  }
}

async function update(req, res) {
  const { name, targetMuscle, description, mediaUrl, difficulty } = req.body;
  try {
    await pool.query(
      `UPDATE exercises SET
         name = COALESCE($1, name),
         target_muscle = COALESCE($2, target_muscle),
         description = COALESCE($3, description),
         media_url = COALESCE($4, media_url),
         difficulty = COALESCE($5, difficulty)
       WHERE id = $6`,
      [name, targetMuscle, description, mediaUrl, difficulty, req.params.id]
    );
    const updated = await pool.query('SELECT * FROM exercises WHERE id = $1', [req.params.id]);
    if (!updated.rows.length) return res.status(404).json({ error: 'Exercise not found' });
    res.json(updated.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update exercise' });
  }
}

async function remove(req, res) {
  try {
    const result = await pool.query('DELETE FROM exercises WHERE id = $1', [req.params.id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Exercise not found' });
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete exercise' });
  }
}

module.exports = { list, create, update, remove };
