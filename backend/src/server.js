require('dotenv').config();
const bcrypt = require('bcrypt');
const app = require('./app');
const pool = require('./config/db');

const PORT = process.env.PORT || 5000;
const SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS) || 10;
const DEFAULT_ADMIN_EMAIL = process.env.DEFAULT_ADMIN_EMAIL || 'admin@pulsefit.com';
const DEFAULT_ADMIN_PASSWORD = process.env.DEFAULT_ADMIN_PASSWORD || 'Admin@1234';
const DEFAULT_ADMIN_NAME = process.env.DEFAULT_ADMIN_NAME || 'Super Admin';

async function ensureBaseSchema() {
  try {
    const tables = await pool.query('SHOW TABLES');
    const names = (tables.rows || []).map((row) => {
      const key = Object.keys(row)[0];
      return String(row[key]).toLowerCase();
    });
    const required = ['users', 'membership_plans', 'memberships', 'trainer_profiles', 'trainer_assignments', 'class_schedules', 'attendance', 'workout_plans', 'progress_metrics', 'diet_plans', 'invoices'];
    const missing = required.filter((table) => !names.includes(table));

    if (missing.length === 0) {
      return;
    }

    const fs = require('fs');
    const path = require('path');
    const schemaPath = path.join(__dirname, '..', 'database', pool.dbType === 'mysql' ? 'schema_mysql.sql' : 'schema.sql');
    const sql = fs.readFileSync(schemaPath, 'utf8');
    const statements = sql.split(';').map((statement) => statement.trim()).filter(Boolean);
    for (const statement of statements) {
      await pool.query(statement);
    }
    console.log('✅ Imported missing database schema tables:', missing.join(', '));
  } catch (err) {
    console.warn('⚠️ Could not ensure base schema:', err.message);
  }
}

async function ensureDefaultAdmin() {
  try {
    const result = await pool.query("SELECT id FROM users WHERE role = 'admin' LIMIT 1");
    if (result.rows.length) {
      return;
    }

    const passwordHash = await bcrypt.hash(DEFAULT_ADMIN_PASSWORD, SALT_ROUNDS);
    await pool.query(
      'INSERT INTO users (full_name, email, password_hash, role) VALUES ($1, $2, $3, $4)',
      [DEFAULT_ADMIN_NAME, DEFAULT_ADMIN_EMAIL, passwordHash, 'admin']
    );

    console.log('✅ Created default admin account:');
    console.log(`   Email: ${DEFAULT_ADMIN_EMAIL}`);
    console.log(`   Password: ${DEFAULT_ADMIN_PASSWORD}`);
  } catch (err) {
    console.warn('⚠️ Could not ensure default admin user:', err.message);
  }
}

async function ensureDemoData() {
  try {
    const demoUserCount = await pool.query("SELECT COUNT(*) AS total FROM users");
    if (Number(demoUserCount.rows[0].total || 0) > 5) {
      return;
    }

    const passwordHash = await bcrypt.hash('Member@1234', SALT_ROUNDS);
    const trainerPassword = await bcrypt.hash('Trainer@1234', SALT_ROUNDS);
    const adminPassword = await bcrypt.hash(DEFAULT_ADMIN_PASSWORD, SALT_ROUNDS);

    const admin = await pool.query('SELECT id FROM users WHERE email = $1', [DEFAULT_ADMIN_EMAIL]);
    if (!admin.rows.length) {
      await pool.query('INSERT INTO users (full_name, email, password_hash, role) VALUES ($1, $2, $3, $4)', [DEFAULT_ADMIN_NAME, DEFAULT_ADMIN_EMAIL, adminPassword, 'admin']);
    }

    const trainer = await pool.query('SELECT id FROM users WHERE email = $1', ['trainer@pulsefit.com']);
    if (!trainer.rows.length) {
      await pool.query('INSERT INTO users (full_name, email, password_hash, role, phone) VALUES ($1, $2, $3, $4, $5)', ['Ava Brooks', 'trainer@pulsefit.com', trainerPassword, 'trainer', '+1-555-0101']);
    }

    const member = await pool.query('SELECT id FROM users WHERE email = $1', ['member@pulsefit.com']);
    if (!member.rows.length) {
      await pool.query('INSERT INTO users (full_name, email, password_hash, role, phone) VALUES ($1, $2, $3, $4, $5)', ['Noah Carter', 'member@pulsefit.com', passwordHash, 'member', '+1-555-0102']);
    }

    const trainerId = (await pool.query('SELECT id FROM users WHERE email = $1', ['trainer@pulsefit.com'])).rows[0].id;
    const memberId = (await pool.query('SELECT id FROM users WHERE email = $1', ['member@pulsefit.com'])).rows[0].id;

    const planCheck = await pool.query('SELECT id FROM membership_plans WHERE name = $1', ['Premium']);
    let planId = planCheck.rows[0]?.id;
    if (!planId) {
      const planResult = await pool.query(
        'INSERT INTO membership_plans (name, description, price, duration_days, status, features) VALUES ($1, $2, $3, $4, $5, $6)',
        ['Premium', 'Gym access + group classes', 49.99, 30, 'active', JSON.stringify(['Gym access', 'Group classes'])]
      );
      planId = planResult.insertId || (await pool.query('SELECT id FROM membership_plans WHERE name = $1', ['Premium'])).rows[0].id;
    }

    const membershipCheck = await pool.query('SELECT id FROM memberships WHERE member_id = $1 ORDER BY created_at DESC LIMIT 1', [memberId]);
    if (!membershipCheck.rows.length) {
      const start = new Date();
      const end = new Date(start); end.setDate(end.getDate() + 30);
      await pool.query(
        'INSERT INTO memberships (member_id, membership_plan_id, start_date, end_date, status, amount_paid) VALUES ($1, $2, $3, $4, $5, $6)',
        [memberId, planId, start, end, 'active', 49.99]
      );
    }

    const assignmentCheck = await pool.query('SELECT id FROM trainer_assignments WHERE member_id = $1 AND trainer_id = $2 AND status = $3', [memberId, trainerId, 'active']);
    if (!assignmentCheck.rows.length) {
      await pool.query('INSERT INTO trainer_assignments (member_id, trainer_id, assigned_by, status) VALUES ($1, $2, $3, $4)', [memberId, trainerId, admin.rows[0]?.id || trainerId, 'active']);
    }

    const profileCheck = await pool.query('SELECT trainer_id FROM trainer_profiles WHERE trainer_id = $1', [trainerId]);
    if (!profileCheck.rows.length) {
      await pool.query(
        'INSERT INTO trainer_profiles (trainer_id, specialization, experience_years, bio, availability_note, personal_training_cost, max_members, is_available) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
        [trainerId, 'Strength & Conditioning', 7, 'Helps members build strength, conditioning, and sustainable routines.', 'Mon/Wed/Fri 6:00-8:00 PM', 40, 20, true]
      );
    }

    const classCheck = await pool.query('SELECT id FROM class_schedules WHERE trainer_id = $1 LIMIT 1', [trainerId]);
    if (!classCheck.rows.length) {
      const start = new Date(Date.now() + 2 * 60 * 60 * 1000);
      const end = new Date(start.getTime() + 60 * 60 * 1000);
      const classResult = await pool.query(
        'INSERT INTO class_schedules (title, trainer_id, start_time, end_time, capacity, location) VALUES ($1, $2, $3, $4, $5, $6)',
        ['HIIT Burn', trainerId, start, end, 12, 'Main Studio']
      );
      const createdClass = classResult.insertId || (await pool.query('SELECT id FROM class_schedules WHERE trainer_id = $1 ORDER BY created_at DESC LIMIT 1', [trainerId])).rows[0].id;
      const attendanceCheck = await pool.query('SELECT id FROM attendance WHERE class_schedule_id = $1 AND member_id = $2', [createdClass, memberId]);
      if (!attendanceCheck.rows.length) {
        await pool.query('INSERT INTO attendance (class_schedule_id, member_id, status) VALUES ($1, $2, $3)', [createdClass, memberId, 'booked']);
      }
    }

    const workoutCheck = await pool.query('SELECT id FROM workout_plans WHERE member_id = $1 LIMIT 1', [memberId]);
    if (!workoutCheck.rows.length) {
      const workoutResult = await pool.query(
        'INSERT INTO workout_plans (title, description, trainer_id, member_id, start_date, end_date) VALUES ($1, $2, $3, $4, $5, $6)',
        ['Strength Foundation', 'Full-body plan focused on form, power, and recovery.', trainerId, memberId, new Date(), new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)]
      );
      const workoutId = workoutResult.insertId || (await pool.query('SELECT id FROM workout_plans WHERE member_id = $1 ORDER BY created_at DESC LIMIT 1', [memberId])).rows[0].id;
      const exerciseCheck = await pool.query('SELECT id FROM exercises WHERE name = $1', ['Barbell Squat']);
      let exerciseId = exerciseCheck.rows[0]?.id;
      if (!exerciseId) {
        const exerciseResult = await pool.query(
          'INSERT INTO exercises (name, target_muscle, description, difficulty, created_by) VALUES ($1, $2, $3, $4, $5)',
          ['Barbell Squat', 'Legs', 'Compound lower-body movement for power and strength.', 'intermediate', trainerId]
        );
        exerciseId = exerciseResult.insertId || (await pool.query('SELECT id FROM exercises WHERE name = $1', ['Barbell Squat'])).rows[0].id;
      }
      const planExerciseCheck = await pool.query('SELECT id FROM workout_plan_exercises WHERE workout_plan_id = $1 AND exercise_id = $2', [workoutId, exerciseId]);
      if (!planExerciseCheck.rows.length) {
        await pool.query('INSERT INTO workout_plan_exercises (workout_plan_id, exercise_id, sets, reps, order_index) VALUES ($1, $2, $3, $4, $5)', [workoutId, exerciseId, 4, 8, 1]);
      }
    }

    const progressCheck = await pool.query('SELECT id FROM progress_metrics WHERE member_id = $1 LIMIT 1', [memberId]);
    if (!progressCheck.rows.length) {
      await pool.query(
        'INSERT INTO progress_metrics (member_id, weight_kg, body_fat_pct, bmi, goal_note, recorded_at) VALUES ($1, $2, $3, $4, $5, $6)',
        [memberId, 74.8, 18.6, 24.1, 'Build lean muscle and improve conditioning over the next month.', new Date()]
      );
    }

    const dietCheck = await pool.query('SELECT id FROM diet_plans WHERE member_id = $1 LIMIT 1', [memberId]);
    if (!dietCheck.rows.length) {
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

    const invoiceCheck = await pool.query('SELECT id FROM invoices WHERE member_id = $1 LIMIT 1', [memberId]);
    if (!invoiceCheck.rows.length) {
      const membershipId = (await pool.query('SELECT id FROM memberships WHERE member_id = $1 ORDER BY created_at DESC LIMIT 1', [memberId])).rows[0].id;
      await pool.query(
        'INSERT INTO invoices (invoice_number, member_id, membership_id, amount, due_date, status, notes) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [`INV-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(Date.now()).slice(-6)}`, memberId, membershipId, 49.99, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 'pending', 'Monthly premium membership invoice']
      );
    }

    console.log('✅ Demo member, trainer, plans, memberships, and dashboard data seeded.');
  } catch (err) {
    console.warn('⚠️ Could not ensure demo data:', err.message);
  }
}

async function start() {
  try {
    await pool.query('SELECT 1');
    console.log('✅ Database connection established');
    await ensureBaseSchema();
    await ensureDefaultAdmin();
    await ensureDemoData();

    app.listen(PORT, () => {
      console.log(`🚀 Gym & Fitness Platform API running on port ${PORT}`);
      console.log(`   API docs:     http://localhost:${PORT}/api-docs`);
      console.log("server is running in " + process.env.NODE_ENV + " mode");
    });
  } catch (err) {
    console.error('❌ Failed to start server — could not connect to the database:', err.message);
    process.exit(1);
  }
}

start();

process.on('unhandledRejection', (err) => {
  console.error('Unhandled promise rejection:', err);
  console.error('Shutting down the server due to unhandled promise rejection');
});
