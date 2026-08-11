const pool = require('../config/db');
const logActivity = require('../utils/logActivity');

async function list(req, res) {
  const { search = '', page = 1, limit = 20 } = req.query;
  const conditions = [];
  const params = [];

  if (search) {
    params.push(`%${search}%`);
    conditions.push(`name LIKE $${params.length}`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const offset = (Number(page) - 1) * Number(limit);
  params.push(Number(limit), offset);

  try {
    const items = await pool.query(
      `SELECT * FROM inventory_items ${where} ORDER BY updated_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );
    const count = await pool.query(`SELECT COUNT(*) AS total FROM inventory_items ${where}`, params.slice(0, params.length - 2));
    res.json({ data: items.rows, pagination: { total: count.rows[0].total, page: Number(page), limit: Number(limit) } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load inventory' });
  }
}

async function getById(req, res) {
  try {
    const item = await pool.query('SELECT * FROM inventory_items WHERE id = $1', [req.params.id]);
    if (!item.rows.length) return res.status(404).json({ error: 'Inventory item not found' });
    res.json(item.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch inventory item' });
  }
}

async function create(req, res) {
  const { name, category, quantity, status, notes, lastMaintenance } = req.body;
  try {
    const insertResult = await pool.query(
      `INSERT INTO inventory_items (name, category, quantity, status, notes, last_maintenance)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [name, category || null, quantity || 0, status || 'available', notes || null, lastMaintenance || null]
    );
    const created = await pool.query('SELECT * FROM inventory_items WHERE id = $1', [insertResult.insertId]);
    await logActivity({ userId: req.user.id, action: 'INVENTORY_CREATED', details: { itemId: created.rows[0].id } });
    res.status(201).json(created.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create inventory item' });
  }
}

async function update(req, res) {
  const { name, category, quantity, status, notes, lastMaintenance } = req.body;
  try {
    await pool.query(
      `UPDATE inventory_items SET
         name = COALESCE($1, name),
         category = COALESCE($2, category),
         quantity = COALESCE($3, quantity),
         status = COALESCE($4, status),
         notes = COALESCE($5, notes),
         last_maintenance = COALESCE($6, last_maintenance),
         updated_at = NOW()
       WHERE id = $7`,
      [name, category, quantity, status, notes, lastMaintenance, req.params.id]
    );
    const updated = await pool.query('SELECT * FROM inventory_items WHERE id = $1', [req.params.id]);
    if (!updated.rows.length) return res.status(404).json({ error: 'Inventory item not found' });
    await logActivity({ userId: req.user.id, action: 'INVENTORY_UPDATED', details: { itemId: req.params.id } });
    res.json(updated.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update inventory item' });
  }
}

async function remove(req, res) {
  try {
    const result = await pool.query('DELETE FROM inventory_items WHERE id = $1', [req.params.id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Inventory item not found' });
    await logActivity({ userId: req.user.id, action: 'INVENTORY_REMOVED', details: { itemId: req.params.id } });
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete inventory item' });
  }
}

module.exports = { list, getById, create, update, remove };