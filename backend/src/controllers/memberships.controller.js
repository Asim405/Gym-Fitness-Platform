const pool = require('../config/db');

// ---- Membership Plans (admin-defined tiers) ----

async function listPlans(req, res) {
  try {
    const result = await pool.query('SELECT * FROM membership_plans ORDER BY price ASC');
    res.json({ data: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch plans' });
  }
}

async function createPlan(req, res) {
  const { name, description, price, durationDays } = req.body;
  try {
    const insertResult = await pool.query(
      `INSERT INTO membership_plans (name, description, price, duration_days) VALUES ($1, $2, $3, $4)`,
      [name, description || null, price, durationDays]
    );
    const created = await pool.query('SELECT * FROM membership_plans WHERE id = $1', [insertResult.insertId]);
    res.status(201).json(created.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create plan' });
  }
}

// ---- Memberships (a member's subscription) ----

// POST /api/memberships/assign  { memberId, membershipPlanId, startDate, amountPaid }
async function assign(req, res) {
  const { memberId, membershipPlanId, startDate, amountPaid } = req.body;
  try {
    const plan = await pool.query('SELECT duration_days FROM membership_plans WHERE id = $1', [membershipPlanId]);
    if (!plan.rows.length) return res.status(404).json({ error: 'Plan not found' });

    const start = startDate ? new Date(startDate) : new Date();
    const end = new Date(start);
    end.setDate(end.getDate() + plan.rows[0].duration_days);

    const insertResult = await pool.query(
      `INSERT INTO memberships (member_id, membership_plan_id, start_date, end_date, status, amount_paid)
       VALUES ($1, $2, $3, $4, 'active', $5)`,
      [memberId, membershipPlanId, start, end, amountPaid || 0]
    );
    const created = await pool.query('SELECT * FROM memberships WHERE id = $1', [insertResult.insertId]);
    res.status(201).json(created.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to assign membership' });
  }
}

// GET /api/memberships?memberId=&status=
async function list(req, res) {
  const { memberId, status } = req.query;
  const conditions = [];
  const params = [];
  if (req.user.role === 'member') {
    params.push(req.user.id);
    conditions.push(`m.member_id = $${params.length}`);
  } else if (memberId) {
    params.push(memberId);
    conditions.push(`m.member_id = $${params.length}`);
  }
  if (status) { params.push(status); conditions.push(`m.status = $${params.length}`); }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  try {
    const result = await pool.query(
      `SELECT m.*, u.full_name AS member_name, mp.name AS plan_name
       FROM memberships m
       JOIN users u ON u.id = m.member_id
       JOIN membership_plans mp ON mp.id = m.membership_plan_id
       ${where} ORDER BY m.created_at DESC`,
      params
    );
    res.json({ data: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch memberships' });
  }
}

// PATCH /api/memberships/:id/status  { status }
async function updateStatus(req, res) {
  const { status } = req.body;
  try {
    await pool.query(
      `UPDATE memberships SET status = $1 WHERE id = $2`,
      [status, req.params.id]
    );
    const result = await pool.query('SELECT * FROM memberships WHERE id = $1', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Membership not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update membership status' });
  }
}

module.exports = { listPlans, createPlan, assign, list, updateStatus };
