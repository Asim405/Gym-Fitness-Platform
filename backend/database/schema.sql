-- ============================================================
-- Gym & Fitness Platform — PostgreSQL Schema
-- Compatible with PostgreSQL 13+. MySQL notes given inline for
-- the handful of dialect differences (SERIAL -> AUTO_INCREMENT,
-- TIMESTAMPTZ -> TIMESTAMP, ILIKE -> LIKE, JSONB -> JSON).
-- ============================================================

-- Clean rebuild (dev only — remove the DROP block in production)
DROP TABLE IF EXISTS activity_logs CASCADE;
DROP TABLE IF EXISTS progress_metrics CASCADE;
DROP TABLE IF EXISTS attendance CASCADE;
DROP TABLE IF EXISTS class_schedules CASCADE;
DROP TABLE IF EXISTS workout_plan_exercises CASCADE;
DROP TABLE IF EXISTS workout_plans CASCADE;
DROP TABLE IF EXISTS exercises CASCADE;
DROP TABLE IF EXISTS memberships CASCADE;
DROP TABLE IF EXISTS membership_plans CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ============================================================
-- USERS  (Admin / Trainer / Member — single table + role column)
-- ============================================================
CREATE TABLE users (
    id              SERIAL PRIMARY KEY,
    full_name       VARCHAR(120)  NOT NULL,
    email           VARCHAR(160)  NOT NULL UNIQUE,
    password_hash   VARCHAR(255)  NOT NULL,
    role            VARCHAR(20)   NOT NULL DEFAULT 'member'
                        CHECK (role IN ('admin', 'trainer', 'member')),
    phone           VARCHAR(30),
    date_of_birth   DATE,
    gender          VARCHAR(20),
    height_cm       NUMERIC(5,2),          -- default height used for BMI calc
    profile_image   VARCHAR(255),
    is_active       BOOLEAN       NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_role  ON users(role);
CREATE INDEX idx_users_email ON users(email);

-- ============================================================
-- MEMBERSHIP PLANS  (catalog: Basic / Premium / Elite ...)
-- ============================================================
CREATE TABLE membership_plans (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(80)   NOT NULL UNIQUE,
    description     TEXT,
    price           NUMERIC(10,2) NOT NULL CHECK (price >= 0),
    duration_days   INTEGER       NOT NULL CHECK (duration_days > 0),
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ============================================================
-- MEMBERSHIPS  (a member's subscription instance to a plan)
-- ============================================================
CREATE TABLE memberships (
    id                  SERIAL PRIMARY KEY,
    member_id           INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    membership_plan_id  INTEGER NOT NULL REFERENCES membership_plans(id) ON DELETE RESTRICT,
    start_date          DATE    NOT NULL DEFAULT CURRENT_DATE,
    end_date            DATE    NOT NULL,
    status              VARCHAR(20) NOT NULL DEFAULT 'pending'
                            CHECK (status IN ('active', 'expired', 'pending', 'cancelled')),
    amount_paid         NUMERIC(10,2) NOT NULL DEFAULT 0,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_memberships_member ON memberships(member_id);
CREATE INDEX idx_memberships_status ON memberships(status);

-- ============================================================
-- EXERCISES  (library, managed by trainer/admin)
-- ============================================================
CREATE TABLE exercises (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(120) NOT NULL,
    target_muscle   VARCHAR(80)  NOT NULL,
    description     TEXT,
    media_url       VARCHAR(500),
    difficulty      VARCHAR(20)  NOT NULL DEFAULT 'beginner'
                        CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
    created_by      INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_exercises_muscle ON exercises(target_muscle);
CREATE INDEX idx_exercises_name   ON exercises(name);

-- ============================================================
-- WORKOUT PLANS  (built by trainer, assigned to a member)
-- ============================================================
CREATE TABLE workout_plans (
    id              SERIAL PRIMARY KEY,
    title           VARCHAR(150) NOT NULL,
    description     TEXT,
    trainer_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    member_id       INTEGER REFERENCES users(id) ON DELETE CASCADE,
    start_date      DATE,
    end_date        DATE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_workout_plans_trainer ON workout_plans(trainer_id);
CREATE INDEX idx_workout_plans_member  ON workout_plans(member_id);

-- Join table: which exercises belong to a plan, with sets/reps/duration
CREATE TABLE workout_plan_exercises (
    id                SERIAL PRIMARY KEY,
    workout_plan_id   INTEGER NOT NULL REFERENCES workout_plans(id) ON DELETE CASCADE,
    exercise_id       INTEGER NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
    sets              INTEGER NOT NULL DEFAULT 3,
    reps              INTEGER NOT NULL DEFAULT 10,
    duration_secs     INTEGER,
    order_index       INTEGER NOT NULL DEFAULT 0,
    UNIQUE (workout_plan_id, exercise_id)
);

CREATE INDEX idx_wpe_plan ON workout_plan_exercises(workout_plan_id);

-- ============================================================
-- CLASS SCHEDULES  (trainer-run group classes)
-- ============================================================
CREATE TABLE class_schedules (
    id              SERIAL PRIMARY KEY,
    title           VARCHAR(150) NOT NULL,
    trainer_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    start_time      TIMESTAMPTZ NOT NULL,
    end_time        TIMESTAMPTZ NOT NULL,
    capacity        INTEGER NOT NULL DEFAULT 20 CHECK (capacity > 0),
    location        VARCHAR(120),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (end_time > start_time)
);

CREATE INDEX idx_class_trainer ON class_schedules(trainer_id);
CREATE INDEX idx_class_start   ON class_schedules(start_time);

-- ============================================================
-- ATTENDANCE  (doubles as class booking + check-in record)
-- A member books a class (status='booked'); a trainer/admin marks
-- them present at the door (status='checked_in', checked_in_at set).
-- ============================================================
CREATE TABLE attendance (
    id                  SERIAL PRIMARY KEY,
    class_schedule_id   INTEGER NOT NULL REFERENCES class_schedules(id) ON DELETE CASCADE,
    member_id           INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status              VARCHAR(20) NOT NULL DEFAULT 'booked'
                            CHECK (status IN ('booked', 'checked_in', 'cancelled')),
    checked_in_at       TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (class_schedule_id, member_id)
);

CREATE INDEX idx_attendance_member ON attendance(member_id);
CREATE INDEX idx_attendance_class  ON attendance(class_schedule_id);
CREATE INDEX idx_attendance_checked_in_at ON attendance(checked_in_at);

-- ============================================================
-- PROGRESS METRICS  (weight history, body fat %, BMI, goals)
-- ============================================================
CREATE TABLE progress_metrics (
    id              SERIAL PRIMARY KEY,
    member_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    weight_kg       NUMERIC(5,2),
    body_fat_pct    NUMERIC(5,2),
    bmi             NUMERIC(5,2),
    goal_note       VARCHAR(255),
    photo_url       VARCHAR(500),
    recorded_at     DATE NOT NULL DEFAULT CURRENT_DATE
);

CREATE INDEX idx_progress_member ON progress_metrics(member_id);
CREATE INDEX idx_progress_date   ON progress_metrics(recorded_at);

-- ============================================================
-- INVENTORY ITEMS
-- ============================================================
CREATE TABLE inventory_items (
    id               SERIAL PRIMARY KEY,
    name             VARCHAR(150) NOT NULL,
    category         VARCHAR(80),
    quantity         INTEGER NOT NULL DEFAULT 0,
    status           VARCHAR(30) NOT NULL DEFAULT 'available',
    notes            TEXT,
    last_maintenance DATE,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (quantity >= 0),
    CHECK (status IN ('available', 'maintenance', 'out_of_stock'))
);

CREATE INDEX idx_inventory_status ON inventory_items(status);
CREATE INDEX idx_inventory_category ON inventory_items(category);

-- ============================================================
-- DIET PLANS
-- ============================================================
CREATE TABLE diet_plans (
    id          SERIAL PRIMARY KEY,
    member_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title       VARCHAR(150) NOT NULL,
    notes       TEXT,
    calories    INTEGER,
    protein     INTEGER,
    carbs       INTEGER,
    fats        INTEGER,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE diet_plan_entries (
    id           SERIAL PRIMARY KEY,
    diet_plan_id INTEGER NOT NULL REFERENCES diet_plans(id) ON DELETE CASCADE,
    meal_time    VARCHAR(80) NOT NULL,
    name         VARCHAR(150) NOT NULL,
    description  TEXT,
    calories     INTEGER,
    protein      INTEGER,
    carbs        INTEGER,
    fats         INTEGER,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- PAYMENTS / BILLING
-- ============================================================
CREATE TABLE payments (
    id             SERIAL PRIMARY KEY,
    member_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount         NUMERIC(10,2) NOT NULL,
    payment_method VARCHAR(80) NOT NULL,
    reference      VARCHAR(200),
    notes          TEXT,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payments_member ON payments(member_id);
CREATE INDEX idx_payments_created_at ON payments(created_at);

-- ============================================================
-- ACTIVITY LOGS  (audit trail for critical actions)
-- ============================================================
CREATE TABLE activity_logs (
    id              SERIAL PRIMARY KEY,
    user_id         INTEGER REFERENCES users(id) ON DELETE SET NULL,
    action          VARCHAR(100) NOT NULL,
    details         JSONB,
    ip_address      VARCHAR(45),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_activity_user   ON activity_logs(user_id);
CREATE INDEX idx_activity_action ON activity_logs(action);
CREATE INDEX idx_activity_time   ON activity_logs(created_at);

-- ============================================================
-- Seed: default membership plans
-- ============================================================
INSERT INTO membership_plans (name, description, price, duration_days) VALUES
    ('Basic',   'Gym floor access only',                    29.99, 30),
    ('Premium', 'Gym access + group classes',                49.99, 30),
    ('Elite',   'Gym access + classes + personal trainer',   99.99, 30);

-- ============================================================
-- Optional: seed a first Admin (uncomment and replace hash)
-- Generate a bcrypt hash locally with:
--   node -e "console.log(require('bcrypt').hashSync('YourPassword123', 10))"
-- ============================================================
-- INSERT INTO users (full_name, email, password_hash, role)
-- VALUES ('Super Admin', 'admin@example.com', '<bcrypt-hash-here>', 'admin');
