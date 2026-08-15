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
  const { name, category, quantity, minimumStock, supplier, purchasePrice, sellingPrice, status, notes, lastMaintenance } = req.body;
  try {
    const insertResult = await pool.query(
      `INSERT INTO inventory_items (name, category, quantity, minimum_stock, supplier, purchase_price, selling_price, status, notes, last_maintenance)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [name, category || null, quantity || 0, minimumStock || 0, supplier || null, purchasePrice ?? null, sellingPrice ?? null, status || 'available', notes || null, lastMaintenance || null]
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
  const { name, category, quantity, minimumStock, supplier, purchasePrice, sellingPrice, status, notes, lastMaintenance } = req.body;
  try {
    await pool.query(
      `UPDATE inventory_items SET
         name = COALESCE($1, name),
         category = COALESCE($2, category),
         quantity = COALESCE($3, quantity),
         minimum_stock = COALESCE($4, minimum_stock), supplier = COALESCE($5, supplier),
         purchase_price = COALESCE($6, purchase_price), selling_price = COALESCE($7, selling_price),
         status = COALESCE($8, status), notes = COALESCE($9, notes), last_maintenance = COALESCE($10, last_maintenance),
         updated_at = NOW()
       WHERE id = $11`,
      [name, category, quantity, minimumStock, supplier, purchasePrice, sellingPrice, status, notes, lastMaintenance, req.params.id]
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

async function adjustStock(req, res) {
  const { quantityChange, reason } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const itemResult = await client.query('SELECT quantity FROM inventory_items WHERE id=$1', [req.params.id]);
    if (!itemResult.rows.length) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Inventory item not found' }); }
    const quantityAfter = Number(itemResult.rows[0].quantity) + Number(quantityChange);
    if (quantityAfter < 0) { await client.query('ROLLBACK'); return res.status(422).json({ error: 'Stock adjustment cannot make quantity negative' }); }
    await client.query('UPDATE inventory_items SET quantity=$1, updated_at=NOW() WHERE id=$2', [quantityAfter, req.params.id]);
    await client.query('INSERT INTO inventory_stock_history (inventory_item_id, quantity_change, quantity_after, reason, created_by) VALUES ($1,$2,$3,$4,$5)', [req.params.id, quantityChange, quantityAfter, reason || null, req.user.id]);
    await client.query('COMMIT');
    const item = await pool.query('SELECT * FROM inventory_items WHERE id=$1', [req.params.id]);
    await logActivity({ userId: req.user.id, action: 'INVENTORY_STOCK_ADJUSTED', details: { itemId: req.params.id, quantityChange } });
    res.json(item.rows[0]);
  } catch (err) { await client.query('ROLLBACK'); console.error(err); res.status(500).json({ error: 'Failed to adjust stock' }); } finally { client.release(); }
}

async function stockHistory(req, res) {
  try {
    const history = await pool.query(`SELECT h.*, u.full_name AS created_by_name FROM inventory_stock_history h LEFT JOIN users u ON u.id=h.created_by WHERE h.inventory_item_id=$1 ORDER BY h.created_at DESC`, [req.params.id]);
    res.json({ data: history.rows });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to fetch stock history' }); }
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

module.exports = { list, getById, create, update, remove, adjustStock, stockHistory };
