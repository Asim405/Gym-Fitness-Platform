-- Apply to existing PostgreSQL installations after the original schema.
CREATE TABLE IF NOT EXISTS trainer_profiles (
  trainer_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  specialization VARCHAR(120), experience_years INTEGER CHECK (experience_years >= 0), bio TEXT,
  availability_note VARCHAR(255), personal_training_cost NUMERIC(10,2) CHECK (personal_training_cost >= 0),
  max_members INTEGER NOT NULL DEFAULT 20 CHECK (max_members > 0), is_available BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS trainer_requests (
  id SERIAL PRIMARY KEY, member_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  trainer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','cancelled')),
  note VARCHAR(500), reviewed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_trainer_requests_member ON trainer_requests(member_id, status);
CREATE INDEX IF NOT EXISTS idx_trainer_requests_trainer ON trainer_requests(trainer_id, status);
CREATE TABLE IF NOT EXISTS trainer_assignments (
  id SERIAL PRIMARY KEY, member_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  trainer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active','ended')),
  assigned_by INTEGER REFERENCES users(id) ON DELETE SET NULL, assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), ended_at TIMESTAMPTZ
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_active_trainer_assignment_per_member ON trainer_assignments(member_id) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_trainer_assignments_trainer ON trainer_assignments(trainer_id, status);
