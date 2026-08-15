const pool = require('../config/db');
const { requireMemberAccess } = require('../services/memberAccess');

// GET /api/workout-plans?memberId=&trainerId=&page=1&limit=10
async function list(req, res) {
  const { memberId, trainerId, page = 1, limit = 10 } = req.query;
  const conditions = [];
  const params = [];

  if (memberId) { params.push(memberId); conditions.push(`wp.member_id = $${params.length}`); }
  if (trainerId) { params.push(trainerId); conditions.push(`wp.trainer_id = $${params.length}`); }

  // Members can only see their own plans
  if (req.user.role === 'member') {
    params.push(req.user.id);
    conditions.push(`wp.member_id = $${params.length}`);
  }
  if (req.user.role === 'trainer') {
    params.push(req.user.id);
    conditions.push(`wp.member_id IN (SELECT member_id FROM trainer_assignments WHERE trainer_id = $${params.length} AND status = 'active')`);
    conditions.push(`wp.trainer_id = $${params.length}`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const offset = (Number(page) - 1) * Number(limit);
  params.push(Number(limit), offset);

  try {
    const data = await pool.query(
      `SELECT wp.*, t.full_name AS trainer_name, m.full_name AS member_name
       FROM workout_plans wp
       JOIN users t ON t.id = wp.trainer_id
       LEFT JOIN users m ON m.id = wp.member_id
       ${where}
       ORDER BY wp.created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );
    res.json({ data: data.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch workout plans' });
  }
}

// GET /api/workout-plans/:id  (with exercises)
async function getById(req, res) {
  try {
    const plan = await pool.query('SELECT * FROM workout_plans WHERE id = $1', [req.params.id]);
    if (!plan.rows.length) return res.status(404).json({ error: 'Plan not found' });
    if (plan.rows[0].member_id && !(await requireMemberAccess(req, res, plan.rows[0].member_id))) return;
    if (req.user.role === 'trainer' && plan.rows[0].trainer_id !== req.user.id) return res.status(403).json({ error: 'You can only access your own plans' });

    const exercises = await pool.query(
      `SELECT wpe.id, wpe.sets, wpe.reps, wpe.duration_secs, wpe.order_index,
              e.id AS exercise_id, e.name, e.target_muscle, e.media_url
       FROM workout_plan_exercises wpe
       JOIN exercises e ON e.id = wpe.exercise_id
       WHERE wpe.workout_plan_id = $1
       ORDER BY wpe.order_index ASC`,
      [req.params.id]
    );

    res.json({ ...plan.rows[0], exercises: exercises.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch plan' });
  }
}

// POST /api/workout-plans  { title, description, memberId, startDate, endDate, exercises: [{exerciseId, sets, reps, durationSecs, orderIndex}] }
async function create(req, res) {
  const { title, description, memberId, startDate, endDate, exercises = [] } = req.body;
  if (req.user.role === 'trainer' && (!memberId || !(await requireMemberAccess(req, res, memberId)))) return;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const planResult = await client.query(
      `INSERT INTO workout_plans (title, description, trainer_id, member_id, start_date, end_date)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [title, description || null, req.user.id, memberId || null, startDate || null, endDate || null]
    );
    const planResultRows = await client.query('SELECT * FROM workout_plans WHERE id = $1', [planResult.insertId]);
    const plan = planResultRows.rows[0];

    for (const ex of exercises) {
      await client.query(
        `INSERT INTO workout_plan_exercises (workout_plan_id, exercise_id, sets, reps, duration_secs, order_index)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [plan.id, ex.exerciseId, ex.sets || 3, ex.reps || 10, ex.durationSecs || null, ex.orderIndex || 0]
      );
    }

    await client.query('COMMIT');
    res.status(201).json(plan);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Failed to create workout plan' });
  } finally {
    client.release();
  }
}

async function remove(req, res) {
  try {
    const plan = await pool.query('SELECT * FROM workout_plans WHERE id=$1', [req.params.id]);
    if (!plan.rows.length) return res.status(404).json({ error: 'Plan not found' });
    if (req.user.role === 'trainer' && plan.rows[0].trainer_id !== req.user.id) return res.status(403).json({ error: 'You can only delete your own plans' });
    const result = await pool.query('DELETE FROM workout_plans WHERE id = $1', [req.params.id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Plan not found' });
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete plan' });
  }
}

module.exports = { list, getById, create, remove };
