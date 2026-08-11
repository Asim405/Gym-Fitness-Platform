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
      `SELECT * FROM diet_plans ${where} ORDER BY created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );
    const count = await pool.query(`SELECT COUNT(*) AS total FROM diet_plans ${where}`, params.slice(0, params.length - 2));

    res.json({ data: result.rows, pagination: { total: count.rows[0].total, page: Number(page), limit: Number(limit) } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch diet plans' });
  }
}

async function getById(req, res) {
  try {
    const result = await pool.query('SELECT * FROM diet_plans WHERE id = $1', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Diet plan not found' });

    const dietPlan = result.rows[0];
    if (req.user.role === 'member' && dietPlan.member_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(dietPlan);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch diet plan' });
  }
}

async function create(req, res) {
  const { memberId, title, notes, calories, protein, carbs, fats, entries } = req.body;
  try {
    const insertResult = await pool.query(
      `INSERT INTO diet_plans (member_id, title, notes, calories, protein, carbs, fats)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [memberId, title, notes || null, calories || null, protein || null, carbs || null, fats || null]
    );
    const created = await pool.query('SELECT * FROM diet_plans WHERE id = $1', [insertResult.insertId]);

    if (Array.isArray(entries) && entries.length) {
      for (const entry of entries) {
        await pool.query(
          `INSERT INTO diet_plan_entries (diet_plan_id, meal_time, name, description, calories, protein, carbs, fats)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [insertResult.insertId, entry.mealTime, entry.name, entry.description || null, entry.calories || null, entry.protein || null, entry.carbs || null, entry.fats || null]
        );
      }
    }

    await logActivity({ userId: req.user.id, action: 'DIET_PLAN_CREATED', details: { dietPlanId: insertResult.insertId } });
    res.status(201).json(created.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create diet plan' });
  }
}

async function update(req, res) {
  const { title, notes, calories, protein, carbs, fats } = req.body;
  try {
    const existing = await pool.query('SELECT * FROM diet_plans WHERE id = $1', [req.params.id]);
    if (!existing.rows.length) return res.status(404).json({ error: 'Diet plan not found' });
    const dietPlan = existing.rows[0];
    if (req.user.role === 'trainer' || req.user.role === 'admin') {
      // allowed
    } else if (req.user.role === 'member' && dietPlan.member_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await pool.query(
      `UPDATE diet_plans SET
         title = COALESCE($1, title),
         notes = COALESCE($2, notes),
         calories = COALESCE($3, calories),
         protein = COALESCE($4, protein),
         carbs = COALESCE($5, carbs),
         fats = COALESCE($6, fats),
         updated_at = NOW()
       WHERE id = $7`,
      [title, notes, calories, protein, carbs, fats, req.params.id]
    );

    const updated = await pool.query('SELECT * FROM diet_plans WHERE id = $1', [req.params.id]);
    await logActivity({ userId: req.user.id, action: 'DIET_PLAN_UPDATED', details: { dietPlanId: req.params.id } });
    res.json(updated.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update diet plan' });
  }
}

async function remove(req, res) {
  try {
    const result = await pool.query('DELETE FROM diet_plans WHERE id = $1', [req.params.id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Diet plan not found' });
    await logActivity({ userId: req.user.id, action: 'DIET_PLAN_DELETED', details: { dietPlanId: req.params.id } });
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete diet plan' });
  }
}

module.exports = { list, getById, create, update, remove };