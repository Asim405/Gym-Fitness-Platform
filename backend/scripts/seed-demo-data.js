const bcrypt = require('bcrypt');
const pool = require('../src/config/db');

const SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS) || 10;

async function ensureUser(email, fullName, role, password) {
  const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
  if (existing.rows.length) return existing.rows[0].id;

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const inserted = await pool.query(
    'INSERT INTO users (full_name, email, password_hash, role, phone) VALUES ($1, $2, $3, $4, $5)',
    [fullName, email, passwordHash, role, role === 'trainer' ? '+1-555-0101' : '+1-555-0102']
  );

  return inserted.insertId || (await pool.query('SELECT id FROM users WHERE email = $1', [email])).rows[0].id;
}

async function ensureMembershipPlan() {
  const plan = await pool.query('SELECT id FROM membership_plans WHERE name = $1', ['Premium']);
  if (plan.rows.length) return plan.rows[0].id;

  const inserted = await pool.query(
    'INSERT INTO membership_plans (name, description, price, duration_days, status, features) VALUES ($1, $2, $3, $4, $5, $6)',
    ['Premium', 'Gym access + group classes', 49.99, 30, 'active', JSON.stringify(['Gym access', 'Group classes'])]
  );

  return inserted.insertId || (await pool.query('SELECT id FROM membership_plans WHERE name = $1', ['Premium'])).rows[0].id;
}

async function ensureDemoData() {
  try {
    const totalUsers = await pool.query('SELECT COUNT(*) AS total FROM users');
    if (Number(totalUsers.rows[0].total || 0) > 5) {
      console.log('✅ Demo data already present; skipping seed.');
      return;
    }

    const adminId = await ensureUser('admin@pulsefit.com', 'Super Admin', 'admin', 'Admin@1234');
    const trainerId = await ensureUser('trainer@pulsefit.com', 'Ava Brooks', 'trainer', 'Trainer@1234');
    const memberId = await ensureUser('member@pulsefit.com', 'Noah Carter', 'member', 'Member@1234');

    const trainerProfileExists = await pool.query('SELECT trainer_id FROM trainer_profiles WHERE trainer_id = $1', [trainerId]);
    if (!trainerProfileExists.rows.length) {
      await pool.query(
        'INSERT INTO trainer_profiles (trainer_id, specialization, experience_years, bio, availability_note, personal_training_cost, max_members, is_available) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
        [trainerId, 'Strength & Conditioning', 7, 'Supports strength, conditioning, and sustainable fat-loss programs.', 'Mon/Wed/Fri 6:00-8:00 PM', 40, 20, true]
      );
    }

    const planId = await ensureMembershipPlan();
    const membershipExists = await pool.query('SELECT id FROM memberships WHERE member_id = $1 ORDER BY created_at DESC LIMIT 1', [memberId]);
    if (!membershipExists.rows.length) {
      const start = new Date();
      const end = new Date(start); end.setDate(end.getDate() + 30);
      await pool.query(
        'INSERT INTO memberships (member_id, membership_plan_id, start_date, end_date, status, amount_paid) VALUES ($1, $2, $3, $4, $5, $6)',
        [memberId, planId, start, end, 'active', 49.99]
      );
    }

    const assignmentExists = await pool.query('SELECT id FROM trainer_assignments WHERE member_id = $1 AND trainer_id = $2 AND status = $3', [memberId, trainerId, 'active']);
    if (!assignmentExists.rows.length) {
      await pool.query(
        'INSERT INTO trainer_assignments (member_id, trainer_id, assigned_by, status) VALUES ($1, $2, $3, $4)',
        [memberId, trainerId, adminId, 'active']
      );
    }

    const classExists = await pool.query('SELECT id FROM class_schedules WHERE trainer_id = $1 LIMIT 1', [trainerId]);
    if (!classExists.rows.length) {
      const start = new Date(Date.now() + 2 * 60 * 60 * 1000);
      const end = new Date(start.getTime() + 60 * 60 * 1000);
      const classResult = await pool.query(
        'INSERT INTO class_schedules (title, trainer_id, start_time, end_time, capacity, location) VALUES ($1, $2, $3, $4, $5, $6)',
        ['HIIT Burn', trainerId, start, end, 12, 'Main Studio']
      );
      const createdClassId = classResult.insertId || (await pool.query('SELECT id FROM class_schedules WHERE trainer_id = $1 ORDER BY created_at DESC LIMIT 1', [trainerId])).rows[0].id;
      const booking = await pool.query('SELECT id FROM attendance WHERE class_schedule_id = $1 AND member_id = $2', [createdClassId, memberId]);
      if (!booking.rows.length) {
        await pool.query('INSERT INTO attendance (class_schedule_id, member_id, status) VALUES ($1, $2, $3)', [createdClassId, memberId, 'booked']);
      }
    }

    const workoutExists = await pool.query('SELECT id FROM workout_plans WHERE member_id = $1 LIMIT 1', [memberId]);
    if (!workoutExists.rows.length) {
      const workoutResult = await pool.query(
        'INSERT INTO workout_plans (title, description, trainer_id, member_id, start_date, end_date) VALUES ($1, $2, $3, $4, $5, $6)',
        ['Strength Foundation', 'Full-body plan focused on form, power, and recovery.', trainerId, memberId, new Date(), new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)]
      );
      const workoutId = workoutResult.insertId || (await pool.query('SELECT id FROM workout_plans WHERE member_id = $1 ORDER BY created_at DESC LIMIT 1', [memberId])).rows[0].id;

      let exerciseId = (await pool.query('SELECT id FROM exercises WHERE name = $1', ['Barbell Squat'])).rows[0]?.id;
      if (!exerciseId) {
        const exerciseResult = await pool.query(
          'INSERT INTO exercises (name, target_muscle, description, difficulty, created_by) VALUES ($1, $2, $3, $4, $5)',
          ['Barbell Squat', 'Legs', 'Compound lower-body movement for power and strength.', 'intermediate', trainerId]
        );
        exerciseId = exerciseResult.insertId || (await pool.query('SELECT id FROM exercises WHERE name = $1', ['Barbell Squat'])).rows[0].id;
      }

      const exerciseLink = await pool.query('SELECT id FROM workout_plan_exercises WHERE workout_plan_id = $1 AND exercise_id = $2', [workoutId, exerciseId]);
      if (!exerciseLink.rows.length) {
        await pool.query(
          'INSERT INTO workout_plan_exercises (workout_plan_id, exercise_id, sets, reps, order_index) VALUES ($1, $2, $3, $4, $5)',
          [workoutId, exerciseId, 4, 8, 1]
        );
      }
    }

    const progressExists = await pool.query('SELECT id FROM progress_metrics WHERE member_id = $1 LIMIT 1', [memberId]);
    if (!progressExists.rows.length) {
      await pool.query(
        'INSERT INTO progress_metrics (member_id, weight_kg, body_fat_pct, bmi, goal_note, recorded_at) VALUES ($1, $2, $3, $4, $5, $6)',
        [memberId, 74.8, 18.6, 24.1, 'Build lean muscle and improve conditioning.', new Date()]
      );
    }

    const dietExists = await pool.query('SELECT id FROM diet_plans WHERE member_id = $1 LIMIT 1', [memberId]);
    if (!dietExists.rows.length) {
      const dietResult = await pool.query(
        'INSERT INTO diet_plans (member_id, title, notes, calories, protein, carbs, fats) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [memberId, 'Lean Muscle Nutrition', 'Balanced plan with higher protein and smart carbs to support training.', 2200, 160, 220, 65]
      );
      const dietPlanId = dietResult.insertId || (await pool.query('SELECT id FROM diet_plans WHERE member_id = $1 ORDER BY created_at DESC LIMIT 1', [memberId])).rows[0].id;
      await pool.query(
        'INSERT INTO diet_plan_entries (diet_plan_id, meal_time, name, description, calories, protein, carbs, fats) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
        [dietPlanId, 'Breakfast', 'Oatmeal Bowl', 'Oats, berries, whey, chia seeds', 500, 35, 55, 18]
      );
    }

    const invoiceExists = await pool.query('SELECT id FROM invoices WHERE member_id = $1 LIMIT 1', [memberId]);
    if (!invoiceExists.rows.length) {
      const membershipId = (await pool.query('SELECT id FROM memberships WHERE member_id = $1 ORDER BY created_at DESC LIMIT 1', [memberId])).rows[0].id;
      await pool.query(
        'INSERT INTO invoices (invoice_number, member_id, membership_id, amount, due_date, status, notes) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [`INV-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(Date.now()).slice(-6)}`, memberId, membershipId, 49.99, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 'pending', 'Monthly premium membership invoice']
      );
    }

    console.log('✅ Demo data initialized for admin, trainer, and member dashboard.');
  } catch (error) {
    console.error('❌ Seed demo data failed:', error.message);
    process.exitCode = 1;
  } finally {
    if (pool.end) await pool.end();
  }
}

ensureDemoData();
