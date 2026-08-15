const pool = require('../config/db');
const { requireMemberAccess } = require('../services/memberAccess');
const logActivity = require('../utils/logActivity');

async function list(req, res) {
  const params = []; let where = '';
  if (req.user.role === 'member') { params.push(req.user.id); where = `WHERE i.member_id=$${params.length}`; }
  else if (req.query.memberId) { params.push(req.query.memberId); where = `WHERE i.member_id=$${params.length}`; }
  if (req.user.role === 'trainer') { params.push(req.user.id); where = `WHERE i.member_id IN (SELECT member_id FROM trainer_assignments WHERE trainer_id=$${params.length} AND status='active')`; }
  try {
    const result = await pool.query(`SELECT i.*, u.full_name AS member_name, mp.name AS membership_name FROM invoices i JOIN users u ON u.id=i.member_id LEFT JOIN memberships m ON m.id=i.membership_id LEFT JOIN membership_plans mp ON mp.id=m.membership_plan_id ${where} ORDER BY i.created_at DESC`, params);
    res.json({ data: result.rows });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to fetch invoices' }); }
}

async function create(req, res) {
  const { memberId, membershipId, amount, dueDate, notes } = req.body;
  try {
    const member = await pool.query(`SELECT id FROM users WHERE id=$1 AND role='member'`, [memberId]);
    if (!member.rows.length) return res.status(404).json({ error: 'Member not found' });
    const invoiceNumber = `INV-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(Date.now()).slice(-6)}`;
    const insert = await pool.query(`INSERT INTO invoices (invoice_number, member_id, membership_id, amount, due_date, notes) VALUES ($1,$2,$3,$4,$5,$6)`, [invoiceNumber, memberId, membershipId || null, amount, dueDate || null, notes || null]);
    const created = await pool.query('SELECT * FROM invoices WHERE id=$1', [insert.insertId]);
    await logActivity({ userId: req.user.id, action: 'INVOICE_CREATED', details: { invoiceId: insert.insertId } });
    res.status(201).json(created.rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to create invoice' }); }
}

async function updateStatus(req, res) {
  const { status } = req.body;
  try {
    const invoice = await pool.query('SELECT * FROM invoices WHERE id=$1', [req.params.id]);
    if (!invoice.rows.length) return res.status(404).json({ error: 'Invoice not found' });
    if (!(await requireMemberAccess(req, res, invoice.rows[0].member_id))) return;
    await pool.query(`UPDATE invoices SET status=$1, paid_at=CASE WHEN $1='paid' THEN NOW() ELSE paid_at END WHERE id=$2`, [status, req.params.id]);
    res.json((await pool.query('SELECT * FROM invoices WHERE id=$1', [req.params.id])).rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to update invoice' }); }
}
module.exports = { list, create, updateStatus };
