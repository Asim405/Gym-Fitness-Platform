// const bcrypt = require('bcrypt');
// const pool = require('../config/db');
// const logActivity = require('../utils/logActivity');
// const { canTrainerAccessMember } = require('../services/memberAccess');

// const SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS) || 10;

// // GET /api/users?role=member&search=asim&page=1&limit=10&sort=created_at&order=desc
// async function list(req, res) {
//   const { role, search = '', page = 1, limit = 10, sort = 'created_at', order = 'desc' } = req.query;

//   const allowedSort = ['created_at', 'full_name', 'email', 'role'];
//   const sortCol = allowedSort.includes(sort) ? sort : 'created_at';
//   const sortOrder = order.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

//   const conditions = [];
//   const params = [];

//   if (role) {
//     params.push(role);
//     conditions.push(`role = $${params.length}`);
//   }
//   if (req.user.role === 'trainer') {
//     params.push(req.user.id);
//     conditions.push(`role = 'member' AND id IN (SELECT member_id FROM trainer_assignments WHERE trainer_id = $${params.length} AND status = 'active')`);
//   }
//   if (search) {
//     params.push(`%${search}%`);
//     conditions.push(`(LOWER(full_name) LIKE LOWER($${params.length}) OR LOWER(email) LIKE LOWER($${params.length}))`);
//   }
//   const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

//   const offset = (Number(page) - 1) * Number(limit);
//   params.push(Number(limit), offset);

//   try {
//     const dataQuery = `
//       SELECT id, full_name, email, role, phone, is_active, created_at
//       FROM users ${where}
//       ORDER BY ${sortCol} ${sortOrder}
//       LIMIT $${params.length - 1} OFFSET $${params.length}`;
//     const countQuery = `SELECT COUNT(*) AS total FROM users ${where}`;

//     const [dataResult, countResult] = await Promise.all([
//       pool.query(dataQuery, params),
//       pool.query(countQuery, params.slice(0, params.length - 2)),
//     ]);

//     res.json({
//       data: dataResult.rows,
//       pagination: {
//         total: countResult.rows[0].total,
//         page: Number(page),
//         limit: Number(limit),
//         totalPages: Math.ceil(countResult.rows[0].total / Number(limit)),
//       },
//     });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: 'Failed to fetch users' });
//   }
// }

// // GET /api/users/:id
// async function getById(req, res) {
//   try {
//     if (req.user.role === 'member' && req.user.id !== Number(req.params.id)) {
//       return res.status(403).json({ error: 'Members may only view their own profile' });
//     }
//     if (req.user.role === 'trainer' && req.user.id !== Number(req.params.id) && !(await canTrainerAccessMember(req.user.id, Number(req.params.id)))) {
//       return res.status(403).json({ error: 'You are not authorized to access this member' });
//     }
//     const result = await pool.query(
//       `SELECT id, full_name, email, role, phone, date_of_birth, gender, height_cm, is_active, created_at
//        FROM users WHERE id = $1`,
//       [req.params.id]
//     );
//     if (!result.rows.length) return res.status(404).json({ error: 'User not found' });
//     res.json(result.rows[0]);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: 'Failed to fetch user' });
//   }
// }

// // POST /api/users  (Admin creates trainer/member/admin accounts directly)
// async function create(req, res) {
//   const { fullName, email, password, role, phone } = req.body;
//   try {
//     const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
//     if (existing.rows.length) return res.status(409).json({ error: 'Email already registered' });

//     const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
//     const insertResult = await pool.query(
//       `INSERT INTO users (full_name, email, password_hash, role, phone)
//        VALUES ($1, $2, $3, $4, $5)`,
//       [fullName, email, passwordHash, role, phone || null]
//     );
//     const created = await pool.query('SELECT id, full_name, email, role, phone, created_at FROM users WHERE id = $1', [insertResult.insertId]);

//     await logActivity({ userId: req.user.id, action: 'USER_CREATED', details: { targetUserId: created.rows[0].id, role } });
//     res.status(201).json(created.rows[0]);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: 'Failed to create user' });
//   }
// }

// // PUT /api/users/:id
// async function update(req, res) {
//   const { fullName, phone, dateOfBirth, gender, heightCm, isActive } = req.body;
//   try {
//     const targetId = Number(req.params.id);
//     if (req.user.role !== 'admin' && req.user.id !== targetId) {
//       return res.status(403).json({ error: 'You may only update your own profile' });
//     }

//     await pool.query(
//       `UPDATE users SET
//          full_name = COALESCE($1, full_name),
//          phone = COALESCE($2, phone),
//          date_of_birth = COALESCE($3, date_of_birth),
//          gender = COALESCE($4, gender),
//          height_cm = COALESCE($5, height_cm),
//          is_active = CASE WHEN $8 = 'admin' THEN COALESCE($6, is_active) ELSE is_active END,
//          updated_at = NOW()
//        WHERE id = $7`,
//       [fullName, phone, dateOfBirth, gender, heightCm, isActive, req.params.id, req.user.role]
//     );
//     const result = await pool.query(
//       `SELECT id, full_name, email, role, phone, date_of_birth, gender, height_cm, is_active
//        FROM users WHERE id = $1`,
//       [req.params.id]
//     );
//     if (!result.rows.length) return res.status(404).json({ error: 'User not found' });

//     await logActivity({ userId: req.user.id, action: 'USER_UPDATED', details: { targetUserId: req.params.id } });
//     res.json(result.rows[0]);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: 'Failed to update user' });
//   }
// }

// // DELETE /api/users/:id  (soft delete via is_active = false)
// async function remove(req, res) {
//   try {
//     await pool.query(
//       `UPDATE users SET is_active = FALSE, updated_at = NOW() WHERE id = $1`,
//       [req.params.id]
//     );
//     const result = await pool.query('SELECT id FROM users WHERE id = $1', [req.params.id]);
//     if (!result.rows.length) return res.status(404).json({ error: 'User not found' });

//     await logActivity({ userId: req.user.id, action: 'USER_DEACTIVATED', details: { targetUserId: req.params.id } });
//     res.status(204).send();
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: 'Failed to deactivate user' });
//   }
// }

// module.exports = { list, getById, create, update, remove };



const bcrypt = require('bcrypt');
const pool = require('../config/db');
const logActivity = require('../utils/logActivity');
const { canTrainerAccessMember } = require('../services/memberAccess');

const SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS) || 10;

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

async function dbQuery(sql, params = []) {
  const { sql: adaptedSql, params: adaptedParams } = adaptSql(sql, params);
  return pool.query(adaptedSql, adaptedParams);
}

// GET /api/users?role=member&search=asim&page=1&limit=10&sort=created_at&order=desc
async function list(req, res) {
  const { role, search = '', page = 1, limit = 10, sort = 'created_at', order = 'desc' } = req.query;

  const allowedSort = ['created_at', 'full_name', 'email', 'role'];
  const sortCol = allowedSort.includes(sort) ? sort : 'created_at';
  const sortOrder = order.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

  const conditions = [];
  const params = [];

  if (role) {
    params.push(role);
    conditions.push(`role = $${params.length}`);
  }
  if (req.user.role === 'trainer') {
    params.push(req.user.id);
    conditions.push(`role = 'member' AND id IN (SELECT member_id FROM trainer_assignments WHERE trainer_id = $${params.length} AND status = 'active')`);
  }
  if (search) {
    params.push(`%${search}%`);
    conditions.push(`(LOWER(full_name) LIKE LOWER($${params.length}) OR LOWER(email) LIKE LOWER($${params.length}))`);
  }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const offset = (Number(page) - 1) * Number(limit);
  params.push(Number(limit), offset);

  try {
    const dataQuery = `
      SELECT id, full_name, email, role, phone, is_active, created_at
      FROM users ${where}
      ORDER BY ${sortCol} ${sortOrder}
      LIMIT $${params.length - 1} OFFSET $${params.length}`;
    const countQuery = `SELECT COUNT(*) AS total FROM users ${where}`;

    const [dataResult, countResult] = await Promise.all([
      dbQuery(dataQuery, params),
      dbQuery(countQuery, params.slice(0, params.length - 2)),
    ]);

    const dataRows = dataResult.rows || dataResult[0] || [];
    const countRows = countResult.rows || countResult[0] || [];
    const totalCount = Number(countRows[0]?.total || 0);

    res.json({
      data: dataRows,
      pagination: {
        total: totalCount,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(totalCount / Number(limit)),
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
}

// GET /api/users/:id
async function getById(req, res) {
  try {
    if (req.user.role === 'member' && req.user.id !== Number(req.params.id)) {
      return res.status(403).json({ error: 'Members may only view their own profile' });
    }
    if (req.user.role === 'trainer' && req.user.id !== Number(req.params.id) && !(await canTrainerAccessMember(req.user.id, Number(req.params.id)))) {
      return res.status(403).json({ error: 'You are not authorized to access this member' });
    }
    const result = await dbQuery(
      `SELECT id, full_name, email, role, phone, date_of_birth, gender, height_cm, is_active, created_at
       FROM users WHERE id = $1`,
      [req.params.id]
    );
    const rows = result.rows || result[0] || [];
    if (!rows.length) return res.status(404).json({ error: 'User not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
}

// POST /api/users (Admin creates trainer/member/admin accounts directly)
async function create(req, res) {
  const { fullName, email, password, role, phone } = req.body;
  try {
    const existing = await dbQuery('SELECT id FROM users WHERE email = $1', [email]);
    const existingRows = existing.rows || existing[0] || [];
    if (existingRows.length) return res.status(409).json({ error: 'Email already registered' });

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const insertResult = await dbQuery(
      `INSERT INTO users (full_name, email, password_hash, role, phone)
       VALUES ($1, $2, $3, $4, $5)`,
      [fullName, email, passwordHash, role, phone || null]
    );

    const insertedId = pool.dbType === 'mysql' 
      ? (insertResult.insertId || insertResult[0]?.insertId)
      : (insertResult.rows || insertResult[0])[0]?.id;

    const created = await dbQuery('SELECT id, full_name, email, role, phone, created_at FROM users WHERE id = $1', [insertedId]);
    const createdRows = created.rows || created[0] || [];

    await logActivity({ userId: req.user.id, action: 'USER_CREATED', details: { targetUserId: createdRows[0].id, role } });
    res.status(201).json(createdRows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create user' });
  }
}

// PUT /api/users/:id
async function update(req, res) {
  const { fullName, phone, dateOfBirth, gender, heightCm, isActive } = req.body;
  try {
    const targetId = Number(req.params.id);
    if (req.user.role !== 'admin' && req.user.id !== targetId) {
      return res.status(403).json({ error: 'You may only update your own profile' });
    }

    await dbQuery(
      `UPDATE users SET
         full_name = COALESCE($1, full_name),
         phone = COALESCE($2, phone),
         date_of_birth = COALESCE($3, date_of_birth),
         gender = COALESCE($4, gender),
         height_cm = COALESCE($5, height_cm),
         is_active = CASE WHEN $8 = 'admin' THEN COALESCE($6, is_active) ELSE is_active END,
         updated_at = NOW()
       WHERE id = $7`,
      [fullName, phone, dateOfBirth, gender, heightCm, isActive, req.params.id, req.user.role]
    );
    const result = await dbQuery(
      `SELECT id, full_name, email, role, phone, date_of_birth, gender, height_cm, is_active
       FROM users WHERE id = $1`,
      [req.params.id]
    );
    const rows = result.rows || result[0] || [];
    if (!rows.length) return res.status(404).json({ error: 'User not found' });

    await logActivity({ userId: req.user.id, action: 'USER_UPDATED', details: { targetUserId: req.params.id } });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update user' });
  }
}

// DELETE /api/users/:id (soft delete via is_active = false)
async function remove(req, res) {
  try {
    await dbQuery(
      `UPDATE users SET is_active = FALSE, updated_at = NOW() WHERE id = $1`,
      [req.params.id]
    );
    const result = await dbQuery('SELECT id FROM users WHERE id = $1', [req.params.id]);
    const rows = result.rows || result[0] || [];
    if (!rows.length) return res.status(404).json({ error: 'User not found' });

    await logActivity({ userId: req.user.id, action: 'USER_DEACTIVATED', details: { targetUserId: req.params.id } });
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to deactivate user' });
  }
}

module.exports = { list, getById, create, update, remove };