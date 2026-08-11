const pool = require('../config/db');
const logActivity = require('../utils/logActivity');

async function list(req, res) {
  const { memberId, page = 1, limit = 20 } = req.query;
  const conditions = [];
  const params = [];

  if (req.user.role === 'member') {
    params.push(req.user.id);
    conditions.push(`member_id = $${params.length}`);
  } else if (memberId) {
    params.push(memberId);
    conditions.push(`member_id = $${params.length}`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const offset = (Number(page) - 1) * Number(limit);
  params.push(Number(limit), offset);

  try {
    const result = await pool.query(
      `SELECT * FROM payments ${where} ORDER BY created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );
    const count = await pool.query(`SELECT COUNT(*) AS total FROM payments ${where}`, params.slice(0, params.length - 2));
    res.json({ data: result.rows, pagination: { total: count.rows[0].total, page: Number(page), limit: Number(limit) } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
}

async function getById(req, res) {
  try {
    const result = await pool.query('SELECT * FROM payments WHERE id = $1', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Payment not found' });
    const payment = result.rows[0];
    if (req.user.role === 'member' && payment.member_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    res.json(payment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch payment' });
  }
}

async function create(req, res) {
  const { memberId, amount, paymentMethod, reference, notes } = req.body;
  try {
    const insertResult = await pool.query(
      `INSERT INTO payments (member_id, amount, payment_method, reference, notes)
       VALUES ($1, $2, $3, $4, $5)`,
      [memberId, amount, paymentMethod, reference || null, notes || null]
    );
    const created = await pool.query('SELECT * FROM payments WHERE id = $1', [insertResult.insertId]);
    await logActivity({ userId: req.user.id, action: 'PAYMENT_CREATED', details: { paymentId: insertResult.insertId } });
    res.status(201).json(created.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create payment' });
  }
}

module.exports = { list, getById, create };