-- Apply to existing MySQL 8 installations after the original schema.
CREATE TABLE IF NOT EXISTS trainer_profiles (
  trainer_id INT PRIMARY KEY, specialization VARCHAR(120), experience_years INT, bio TEXT,
  availability_note VARCHAR(255), personal_training_cost DECIMAL(10,2), max_members INT NOT NULL DEFAULT 20,
  is_available BOOLEAN NOT NULL DEFAULT TRUE, updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CHECK (experience_years IS NULL OR experience_years >= 0), CHECK (personal_training_cost IS NULL OR personal_training_cost >= 0), CHECK (max_members > 0),
  FOREIGN KEY (trainer_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS trainer_requests (
  id INT AUTO_INCREMENT PRIMARY KEY, member_id INT NOT NULL, trainer_id INT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending', note VARCHAR(500), reviewed_by INT, reviewed_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CHECK (status IN ('pending','approved','rejected','cancelled')),
  FOREIGN KEY (member_id) REFERENCES users(id) ON DELETE CASCADE, FOREIGN KEY (trainer_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
);
CREATE INDEX idx_trainer_requests_member ON trainer_requests(member_id, status);
CREATE INDEX idx_trainer_requests_trainer ON trainer_requests(trainer_id, status);
CREATE TABLE IF NOT EXISTS trainer_assignments (
  id INT AUTO_INCREMENT PRIMARY KEY, member_id INT NOT NULL, trainer_id INT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active', active_member_id INT GENERATED ALWAYS AS (CASE WHEN status = 'active' THEN member_id ELSE NULL END) STORED,
  assigned_by INT, assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, ended_at TIMESTAMP NULL,
  CHECK (status IN ('active','ended')), FOREIGN KEY (member_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (trainer_id) REFERENCES users(id) ON DELETE CASCADE, FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE KEY uq_active_trainer_assignment_per_member (active_member_id)
);
CREATE INDEX idx_trainer_assignments_trainer ON trainer_assignments(trainer_id, status);
