const pool = require('../config/db');
const logActivity = require('../utils/logActivity');
const { requireMemberAccess } = require('../services/memberAccess');

// Helper: adapt PostgreSQL placeholders ($1, $2) to MySQL (?)
function adaptSql(sql, params) {
  if (pool.dbType !== 'mysql') return { sql, params };
  const newParams = [];
  const newSql = sql.replace(/\$(\d+)/g, (match, p1) => {
    const idx = parseInt(p1, 10) - 1;
    newParams.push(params[idx]);
    return '?';
  });
  return {
    sql: newSql,
    params: newParams.length ? newParams : params,
  };
}

// Safe query wrapper
async function dbQuery(sql, params = []) {
  const { sql: adaptedSql, params: adaptedParams } = adaptSql(sql, params);
  return pool.query(adaptedSql, adaptedParams);
}

// Helper: Extract rows safely regardless of database driver (MySQL/PG)
function getRows(result) {
  if (!result) return [];
  if (Array.isArray(result.rows)) return result.rows;
  if (Array.isArray(result)) return result[0] && Array.isArray(result[0]) ? result[0] : result;
  return [];
}

async function list(req, res) {
  const { memberId, memberName, page = 1, limit = 20 } = req.query;
  const conditions = [];
  const params = [];

  let targetMemberId = memberId;

  // Search member by name if memberName is sent instead of memberId
  if (!targetMemberId && memberName) {
    const memberRes = await dbQuery(
      `SELECT id FROM users WHERE LOWER(full_name) = LOWER($1) AND role = 'member'`,
      [memberName.trim()]
    );
    const memberRows = getRows(memberRes);
    if (memberRows.length) {
      targetMemberId = memberRows[0].id;
    }
  }

  if (req.user.role === 'member') {
    params.push(req.user.id);
    conditions.push(`member_id = $${params.length}`);
  } else if (targetMemberId) {
    params.push(targetMemberId);
    conditions.push(`member_id = $${params.length}`);
  }

  if (req.user.role === 'trainer') {
    params.push(req.user.id);
    conditions.push(
      `member_id IN (SELECT member_id FROM trainer_assignments WHERE trainer_id = $${params.length} AND status = 'active')`
    );
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const offset = (Number(page) - 1) * Number(limit);
  params.push(Number(limit), offset);

  try {
    const result = await dbQuery(
      `SELECT * FROM diet_plans ${where} ORDER BY created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );
    const count = await dbQuery(
      `SELECT COUNT(*) AS total FROM diet_plans ${where}`,
      params.slice(0, params.length - 2)
    );

    const rows = getRows(result);
    const countRows = getRows(count);
    const totalCount = Number(countRows[0]?.total || 0);

    res.json({
      data: rows,
      pagination: { total: totalCount, page: Number(page), limit: Number(limit) },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch diet plans' });
  }
}

async function getById(req, res) {
  try {
    const result = await dbQuery('SELECT * FROM diet_plans WHERE id = $1', [req.params.id]);
    const rows = getRows(result);
    if (!rows.length) return res.status(404).json({ error: 'Diet plan not found' });

    const dietPlan = rows[0];
    if (!(await requireMemberAccess(req, res, dietPlan.member_id))) return;

    res.json(dietPlan);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch diet plan' });
  }
}

async function create(req, res) {
  const { memberId, memberName, title, notes, calories, protein, carbs, fats, entries } = req.body;
  
  try {
    let resolvedMemberId = memberId;

    // 1. Resolve Member ID by Name if memberId isn't provided
    if (!resolvedMemberId && memberName) {
      const memberRes = await dbQuery(
        `SELECT id FROM users WHERE LOWER(full_name) = LOWER($1) AND role = 'member'`,
        [memberName.trim()]
      );
      const memberRows = getRows(memberRes);
      if (memberRows.length) {
        resolvedMemberId = memberRows[0].id;
      } else {
        return res.status(404).json({ error: `Member '${memberName}' not found` });
      }
    }

    if (!resolvedMemberId) {
      return res.status(400).json({ error: 'Member ID or Member Name is required' });
    }

    // 2. Check Trainer-Member Access Authority
    if (!(await requireMemberAccess(req, res, resolvedMemberId))) return;

    // 3. Insert Diet Plan
    const insertResult = await dbQuery(
      `INSERT INTO diet_plans (member_id, title, notes, calories, protein, carbs, fats)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [resolvedMemberId, title, notes || null, calories || null, protein || null, carbs || null, fats || null]
    );

    const insertedId = pool.dbType === 'mysql'
      ? (insertResult.insertId || insertResult[0]?.insertId)
      : (getRows(insertResult)[0]?.id);

    const created = await dbQuery('SELECT * FROM diet_plans WHERE id = $1', [insertedId]);
    const createdRows = getRows(created);

    // 4. Insert Entries (if provided)
    if (Array.isArray(entries) && entries.length) {
      for (const entry of entries) {
        await dbQuery(
          `INSERT INTO diet_plan_entries (diet_plan_id, meal_time, name, description, calories, protein, carbs, fats)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            insertedId,
            entry.mealTime,
            entry.name,
            entry.description || null,
            entry.calories || null,
            entry.protein || null,
            entry.carbs || null,
            entry.fats || null,
          ]
        );
      }
    }

    await logActivity({
      userId: req.user.id,
      action: 'DIET_PLAN_CREATED',
      details: { dietPlanId: insertedId, memberId: resolvedMemberId },
    });

    res.status(201).json(createdRows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create diet plan' });
  }
}

async function update(req, res) {
  const { title, notes, calories, protein, carbs, fats } = req.body;
  try {
    const existing = await dbQuery('SELECT * FROM diet_plans WHERE id = $1', [req.params.id]);
    const rows = getRows(existing);
    if (!rows.length) return res.status(404).json({ error: 'Diet plan not found' });
    
    const dietPlan = rows[0];
    if (!(await requireMemberAccess(req, res, dietPlan.member_id))) return;

    await dbQuery(
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

    const updated = await dbQuery('SELECT * FROM diet_plans WHERE id = $1', [req.params.id]);
    const updatedRows = getRows(updated);

    await logActivity({ userId: req.user.id, action: 'DIET_PLAN_UPDATED', details: { dietPlanId: req.params.id } });
    res.json(updatedRows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update diet plan' });
  }
}

async function remove(req, res) {
  try {
    const existing = await dbQuery('SELECT member_id FROM diet_plans WHERE id = $1', [req.params.id]);
    const rows = getRows(existing);
    if (!rows.length) return res.status(404).json({ error: 'Diet plan not found' });

    if (!(await requireMemberAccess(req, res, rows[0].member_id))) return;

    await dbQuery('DELETE FROM diet_plans WHERE id = $1', [req.params.id]);
    await logActivity({ userId: req.user.id, action: 'DIET_PLAN_DELETED', details: { dietPlanId: req.params.id } });
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete diet plan' });
  }
}

module.exports = { list, getById, create, update, remove };