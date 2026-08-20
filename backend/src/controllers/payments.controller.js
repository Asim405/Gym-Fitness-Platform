const pool = require('../config/db');
const logActivity = require('../utils/logActivity');
const { requireMemberAccess } = require('../services/memberAccess');

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
  if (req.user.role === 'trainer') {
    params.push(req.user.id);
    conditions.push(`member_id IN (SELECT member_id FROM trainer_assignments WHERE trainer_id = $${params.length} AND status = 'active')`);
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
    if (!(await requireMemberAccess(req, res, payment.member_id))) return;
    res.json(payment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch payment' });
  }
}

async function create(req, res) {
  const { memberId, invoiceId, amount, paymentMethod, reference, notes } = req.body;
  const client = await pool.connect();
  try {
    if (!(await requireMemberAccess(req, res, memberId))) return;
    await client.query('BEGIN');
    if (invoiceId) {
      const invoice = await client.query(`SELECT id, member_id, amount, status FROM invoices WHERE id=$1 FOR UPDATE`, [invoiceId]);
      if (!invoice.rows.length || Number(invoice.rows[0].member_id) !== Number(memberId)) {
        await client.query('ROLLBACK');
        return res.status(422).json({ error: 'Invoice does not belong to this member' });
      }
      if (['paid', 'cancelled'].includes(invoice.rows[0].status)) {
        await client.query('ROLLBACK');
        return res.status(409).json({ error: 'This invoice cannot accept a payment' });
      }
    }
    const insertResult = await client.query(
      `INSERT INTO payments (member_id, invoice_id, amount, payment_method, reference, notes)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [memberId, invoiceId || null, amount, paymentMethod, reference || null, notes || null]
    );
    if (invoiceId) {
      const totals = await client.query(`SELECT COALESCE(SUM(amount), 0) AS paid_total FROM payments WHERE invoice_id=$1`, [invoiceId]);
      const invoice = await client.query(`SELECT amount FROM invoices WHERE id=$1`, [invoiceId]);
      if (Number(totals.rows[0].paid_total) >= Number(invoice.rows[0].amount)) {
        await client.query(`UPDATE invoices SET status='paid', paid_at=NOW() WHERE id=$1`, [invoiceId]);
      }
    }
    await client.query('COMMIT');
    const created = await pool.query('SELECT * FROM payments WHERE id = $1', [insertResult.insertId]);
    await logActivity({ userId: req.user.id, action: 'PAYMENT_CREATED', details: { paymentId: insertResult.insertId } });
    res.status(201).json(created.rows[0]);
  } catch (err) {
    try { await client.query('ROLLBACK'); } catch (_) { /* transaction already closed */ }
    console.error(err);
    res.status(500).json({ error: 'Failed to create payment' });
  } finally {
    client.release();
  }
}

module.exports = { list, getById, create };
