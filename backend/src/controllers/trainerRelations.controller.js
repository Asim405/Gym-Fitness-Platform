const pool = require('../config/db');
const { canTrainerAccessMember } = require('../services/memberAccess');
const logActivity = require('../utils/logActivity');

async function listTrainers(req, res) {
  try {
    const result = await pool.query(
      `SELECT u.id, u.full_name, u.email, u.phone, u.profile_image, u.is_active,
              tp.specialization, tp.experience_years, tp.bio, tp.availability_note,
              tp.personal_training_cost, tp.max_members, tp.is_available,
              COUNT(ta.id) AS assigned_members
       FROM users u
       LEFT JOIN trainer_profiles tp ON tp.trainer_id = u.id
       LEFT JOIN trainer_assignments ta ON ta.trainer_id = u.id AND ta.status = 'active'
       WHERE u.role = 'trainer' AND u.is_active = TRUE
       GROUP BY u.id, u.full_name, u.email, u.phone, u.profile_image, u.is_active,
                tp.specialization, tp.experience_years, tp.bio, tp.availability_note,
                tp.personal_training_cost, tp.max_members, tp.is_available
       ORDER BY u.full_name ASC`
    );
    res.json({ data: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch trainers' });
  }
}

async function upsertProfile(req, res) {
  const trainerId = req.user.role === 'trainer' ? req.user.id : Number(req.params.trainerId);
  const { specialization, experienceYears, bio, availabilityNote, personalTrainingCost, maxMembers, isAvailable } = req.body;
  if (!trainerId) return res.status(400).json({ error: 'trainerId is required' });
  try {
    const user = await pool.query(`SELECT id FROM users WHERE id = $1 AND role = 'trainer'`, [trainerId]);
    if (!user.rows.length) return res.status(404).json({ error: 'Trainer not found' });
    if (pool.dbType === 'mysql') {
      await pool.query(
        `INSERT INTO trainer_profiles (trainer_id, specialization, experience_years, bio, availability_note, personal_training_cost, max_members, is_available)
         VALUES ($1,$2,$3,$4,$5,$6,COALESCE($7,20),COALESCE($8,TRUE))
         ON DUPLICATE KEY UPDATE specialization=COALESCE($2,specialization), experience_years=COALESCE($3,experience_years), bio=COALESCE($4,bio), availability_note=COALESCE($5,availability_note), personal_training_cost=COALESCE($6,personal_training_cost), max_members=COALESCE($7,max_members), is_available=COALESCE($8,is_available)`,
        [trainerId, specialization || null, experienceYears ?? null, bio || null, availabilityNote || null, personalTrainingCost ?? null, maxMembers ?? null, isAvailable ?? null]
      );
    } else {
      await pool.query(
        `INSERT INTO trainer_profiles (trainer_id, specialization, experience_years, bio, availability_note, personal_training_cost, max_members, is_available)
         VALUES ($1,$2,$3,$4,$5,$6,COALESCE($7,20),COALESCE($8,TRUE))
         ON CONFLICT (trainer_id) DO UPDATE SET specialization=COALESCE(EXCLUDED.specialization, trainer_profiles.specialization), experience_years=COALESCE(EXCLUDED.experience_years, trainer_profiles.experience_years), bio=COALESCE(EXCLUDED.bio, trainer_profiles.bio), availability_note=COALESCE(EXCLUDED.availability_note, trainer_profiles.availability_note), personal_training_cost=COALESCE(EXCLUDED.personal_training_cost, trainer_profiles.personal_training_cost), max_members=COALESCE(EXCLUDED.max_members, trainer_profiles.max_members), is_available=COALESCE(EXCLUDED.is_available, trainer_profiles.is_available), updated_at=NOW()`,
        [trainerId, specialization || null, experienceYears ?? null, bio || null, availabilityNote || null, personalTrainingCost ?? null, maxMembers ?? null, isAvailable ?? null]
      );
    }
    const profile = await pool.query('SELECT * FROM trainer_profiles WHERE trainer_id = $1', [trainerId]);
    res.json(profile.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save trainer profile' });
  }
}

async function requestTrainer(req, res) {
  const { trainerId, note } = req.body;
  try {
    const trainer = await pool.query(
      `SELECT u.id, u.is_active, COALESCE(tp.is_available, TRUE) AS is_available,
              COALESCE(tp.max_members, 20) AS max_members
       FROM users u LEFT JOIN trainer_profiles tp ON tp.trainer_id = u.id
       WHERE u.id = $1 AND u.role = 'trainer'`, [trainerId]
    );
    if (!trainer.rows.length || !trainer.rows[0].is_active || !trainer.rows[0].is_available) {
      return res.status(400).json({ error: 'This trainer is not available for requests' });
    }
    const capacity = await pool.query(
      `SELECT COUNT(*) AS assigned_count FROM trainer_assignments WHERE trainer_id=$1 AND status='active'`,
      [trainerId]
    );
    if (Number(capacity.rows[0].assigned_count) >= Number(trainer.rows[0].max_members || 20)) {
      return res.status(409).json({ error: 'This trainer is currently at capacity' });
    }
    const activeAssignment = await pool.query(
      `SELECT id FROM trainer_assignments WHERE member_id=$1 AND status='active'`, [req.user.id]
    );
    if (activeAssignment.rows.length) return res.status(409).json({ error: 'You already have an active trainer assignment' });
    const existing = await pool.query(
      `SELECT id FROM trainer_requests WHERE member_id=$1 AND trainer_id=$2 AND status='pending'`, [req.user.id, trainerId]
    );
    if (existing.rows.length) return res.status(409).json({ error: 'A request for this trainer is already pending' });
    const created = await pool.query(
      pool.dbType === 'mysql'
        ? `INSERT INTO trainer_requests (member_id, trainer_id, note) VALUES ($1,$2,$3)`
        : `INSERT INTO trainer_requests (member_id, trainer_id, note) VALUES ($1,$2,$3) RETURNING *`,
      [req.user.id, trainerId, note || null]
    );
    const request = created.rows[0] || (await pool.query('SELECT * FROM trainer_requests WHERE id = $1', [created.insertId])).rows[0];
    await logActivity({ userId: req.user.id, action: 'TRAINER_REQUESTED', details: { trainerId } });
    res.status(201).json(request);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to request trainer' });
  }
}

async function listRequests(req, res) {
  const params = [];
  let where = '';
  if (req.user.role === 'member') { params.push(req.user.id); where = `WHERE tr.member_id = $${params.length}`; }
  if (req.user.role === 'trainer') { params.push(req.user.id); where = `WHERE tr.trainer_id = $${params.length}`; }
  try {
    const result = await pool.query(
      `SELECT tr.*, m.full_name AS member_name, t.full_name AS trainer_name
       FROM trainer_requests tr JOIN users m ON m.id=tr.member_id JOIN users t ON t.id=tr.trainer_id
       ${where} ORDER BY tr.created_at DESC`, params
    );
    res.json({ data: result.rows });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to fetch trainer requests' }); }
}

async function approveRequest(req, res) {
  const request = await pool.query('SELECT * FROM trainer_requests WHERE id = $1', [req.params.id]);
  if (!request.rows.length) return res.status(404).json({ error: 'Trainer request not found' });
  const item = request.rows[0];
  if (req.user.role === 'trainer' && item.trainer_id !== req.user.id) return res.status(403).json({ error: 'You can only review your own requests' });
  if (item.status !== 'pending') return res.status(409).json({ error: 'Only pending requests can be approved' });
  try {
    const trainer = await pool.query(
      `SELECT u.is_active, COALESCE(tp.is_available, TRUE) AS is_available, COALESCE(tp.max_members,20) AS max_members,
              (SELECT COUNT(*) FROM trainer_assignments WHERE trainer_id=$1 AND status='active') AS assigned_count
       FROM users u LEFT JOIN trainer_profiles tp ON tp.trainer_id=u.id WHERE u.id=$1 AND u.role='trainer'`, [item.trainer_id]
    );
    const details = trainer.rows[0];
    if (!details?.is_active || !details.is_available || Number(details.assigned_count) >= Number(details.max_members)) return res.status(409).json({ error: 'Trainer is unavailable or at capacity' });
    const active = await pool.query(`SELECT id FROM trainer_assignments WHERE member_id=$1 AND status='active'`, [item.member_id]);
    if (active.rows.length) return res.status(409).json({ error: 'Member already has an active trainer assignment' });
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(`INSERT INTO trainer_assignments (member_id, trainer_id, assigned_by) VALUES ($1,$2,$3)`, [item.member_id, item.trainer_id, req.user.id]);
      await client.query(`UPDATE trainer_requests SET status='approved', reviewed_by=$1, reviewed_at=NOW(), updated_at=NOW() WHERE id=$2`, [req.user.id, item.id]);
      await client.query('COMMIT');
    } catch (err) { await client.query('ROLLBACK'); throw err; } finally { client.release(); }
    const updated = await pool.query('SELECT * FROM trainer_requests WHERE id = $1', [item.id]);
    await logActivity({ userId: req.user.id, action: 'TRAINER_REQUEST_APPROVED', details: { requestId: item.id } });
    res.json(updated.rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to approve trainer request' }); }
}

// Admins can create an assignment directly when onboarding a member or resolving a request offline.
// The same availability and capacity checks used by request approval apply here.
async function createAssignment(req, res) {
  const { memberId, trainerId } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const member = await client.query(`SELECT id FROM users WHERE id=$1 AND role='member' AND is_active=TRUE`, [memberId]);
    if (!member.rows.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Active member not found' });
    }
    const trainer = await client.query(
      `SELECT u.id, u.is_active, COALESCE(tp.is_available, TRUE) AS is_available,
              COALESCE(tp.max_members, 20) AS max_members
       FROM users u LEFT JOIN trainer_profiles tp ON tp.trainer_id=u.id
       WHERE u.id=$1 AND u.role='trainer' FOR UPDATE`, [trainerId]
    );
    if (!trainer.rows.length || !trainer.rows[0].is_active || !trainer.rows[0].is_available) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'Trainer is unavailable' });
    }
    const active = await client.query(`SELECT id FROM trainer_assignments WHERE member_id=$1 AND status='active'`, [memberId]);
    if (active.rows.length) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'Member already has an active trainer assignment' });
    }
    const workload = await client.query(`SELECT COUNT(*) AS assigned_count FROM trainer_assignments WHERE trainer_id=$1 AND status='active'`, [trainerId]);
    if (Number(workload.rows[0].assigned_count) >= Number(trainer.rows[0].max_members)) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'Trainer is at capacity' });
    }
    const inserted = await client.query(
      `INSERT INTO trainer_assignments (member_id, trainer_id, assigned_by) VALUES ($1,$2,$3)`,
      [memberId, trainerId, req.user.id]
    );
    await client.query('COMMIT');
    const assignment = await pool.query('SELECT * FROM trainer_assignments WHERE id=$1', [inserted.insertId]);
    await logActivity({ userId: req.user.id, action: 'TRAINER_ASSIGNED', details: { memberId, trainerId } });
    res.status(201).json(assignment.rows[0]);
  } catch (err) {
    try { await client.query('ROLLBACK'); } catch (_) { /* transaction already closed */ }
    console.error(err);
    res.status(500).json({ error: 'Failed to create trainer assignment' });
  } finally {
    client.release();
  }
}

async function updateRequestStatus(req, res) {
  const { status } = req.body;
  const found = await pool.query('SELECT * FROM trainer_requests WHERE id=$1', [req.params.id]);
  if (!found.rows.length) return res.status(404).json({ error: 'Trainer request not found' });
  const item = found.rows[0];
  const allowed = (req.user.role === 'member' && item.member_id === req.user.id && status === 'cancelled') || req.user.role === 'admin' || (req.user.role === 'trainer' && item.trainer_id === req.user.id && status === 'rejected');
  if (!allowed || item.status !== 'pending') return res.status(403).json({ error: 'This status change is not allowed' });
  await pool.query(`UPDATE trainer_requests SET status=$1, reviewed_by=$2, reviewed_at=NOW(), updated_at=NOW() WHERE id=$3`, [status, req.user.id, item.id]);
  res.json((await pool.query('SELECT * FROM trainer_requests WHERE id=$1', [item.id])).rows[0]);
}

async function myAssignment(req, res) {
  try {
    const result = await pool.query(
      `SELECT ta.*, u.full_name, u.email, u.phone, u.profile_image, tp.specialization, tp.experience_years, tp.bio, tp.availability_note
       FROM trainer_assignments ta JOIN users u ON u.id=ta.trainer_id LEFT JOIN trainer_profiles tp ON tp.trainer_id=u.id
       WHERE ta.member_id=$1 AND ta.status='active'`, [req.user.id]
    );
    res.json(result.rows[0] || null);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to fetch trainer assignment' }); }
}

async function endAssignment(req, res) {
  const assignment = await pool.query('SELECT * FROM trainer_assignments WHERE id=$1', [req.params.id]);
  if (!assignment.rows.length) return res.status(404).json({ error: 'Trainer assignment not found' });
  const item = assignment.rows[0];
  if (req.user.role === 'trainer' && item.trainer_id !== req.user.id) return res.status(403).json({ error: 'You can only manage your own assignments' });
  if (req.user.role === 'member' && item.member_id !== req.user.id) return res.status(403).json({ error: 'Access denied' });
  await pool.query(`UPDATE trainer_assignments SET status='ended', ended_at=NOW() WHERE id=$1 AND status='active'`, [item.id]);
  res.status(204).send();
}

module.exports = { listTrainers, upsertProfile, requestTrainer, listRequests, approveRequest, updateRequestStatus, createAssignment, myAssignment, endAssignment };
