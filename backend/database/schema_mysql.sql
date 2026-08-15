-- ============================================================
-- Gym & Fitness Platform — MySQL Schema
-- Compatible with MySQL 8.x (Workbench, CLI, mysql2 driver)
-- ============================================================

DROP TABLE IF EXISTS activity_logs;
DROP TABLE IF EXISTS inventory_stock_history;
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS invoices;
DROP TABLE IF EXISTS trainer_assignments;
DROP TABLE IF EXISTS trainer_requests;
DROP TABLE IF EXISTS trainer_profiles;
DROP TABLE IF EXISTS progress_metrics;
DROP TABLE IF EXISTS attendance;
DROP TABLE IF EXISTS class_schedules;
DROP TABLE IF EXISTS workout_plan_exercises;
DROP TABLE IF EXISTS workout_plans;
DROP TABLE IF EXISTS exercises;
DROP TABLE IF EXISTS memberships;
DROP TABLE IF EXISTS membership_plans;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(120) NOT NULL,
  email VARCHAR(160) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'member',
  phone VARCHAR(30),
  date_of_birth DATE,
  gender VARCHAR(20),
  height_cm DECIMAL(5,2),
  profile_image VARCHAR(255),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CHECK (role IN ('admin', 'trainer', 'member'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_email ON users(email);

CREATE TABLE trainer_profiles (
  trainer_id INT PRIMARY KEY,
  specialization VARCHAR(120),
  experience_years INT,
  bio TEXT,
  availability_note VARCHAR(255),
  personal_training_cost DECIMAL(10,2),
  max_members INT NOT NULL DEFAULT 20,
  is_available BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CHECK (experience_years IS NULL OR experience_years >= 0),
  CHECK (personal_training_cost IS NULL OR personal_training_cost >= 0),
  CHECK (max_members > 0),
  FOREIGN KEY (trainer_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE trainer_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  member_id INT NOT NULL,
  trainer_id INT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  note VARCHAR(500),
  reviewed_by INT,
  reviewed_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  FOREIGN KEY (member_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (trainer_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE INDEX idx_trainer_requests_member ON trainer_requests(member_id, status);
CREATE INDEX idx_trainer_requests_trainer ON trainer_requests(trainer_id, status);

CREATE TABLE trainer_assignments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  member_id INT NOT NULL,
  trainer_id INT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  active_member_id INT GENERATED ALWAYS AS (CASE WHEN status = 'active' THEN member_id ELSE NULL END) STORED,
  assigned_by INT,
  assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ended_at TIMESTAMP NULL,
  CHECK (status IN ('active', 'ended')),
  FOREIGN KEY (member_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (trainer_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE UNIQUE INDEX uq_active_trainer_assignment_per_member ON trainer_assignments(active_member_id);
CREATE INDEX idx_trainer_assignments_member ON trainer_assignments(member_id, status);
CREATE INDEX idx_trainer_assignments_trainer ON trainer_assignments(trainer_id, status);

CREATE TABLE membership_plans (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(80) NOT NULL UNIQUE,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  duration_days INT NOT NULL,
  features JSON NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  CHECK (price >= 0),
  CHECK (duration_days > 0),
  CHECK (status IN ('active', 'inactive'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE memberships (
  id INT AUTO_INCREMENT PRIMARY KEY,
  member_id INT NOT NULL,
  membership_plan_id INT NOT NULL,
  start_date DATE NOT NULL DEFAULT (CURRENT_DATE),
  end_date DATE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  amount_paid DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CHECK (status IN ('active', 'expired', 'pending', 'cancelled')),
  FOREIGN KEY (member_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (membership_plan_id) REFERENCES membership_plans(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_memberships_member ON memberships(member_id);
CREATE INDEX idx_memberships_status ON memberships(status);

CREATE TABLE exercises (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  target_muscle VARCHAR(80) NOT NULL,
  description TEXT,
  media_url VARCHAR(500),
  difficulty VARCHAR(20) NOT NULL DEFAULT 'beginner',
  created_by INT,
  created_at TIMESTAMP NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_exercises_muscle ON exercises(target_muscle);
CREATE INDEX idx_exercises_name ON exercises(name);

CREATE TABLE workout_plans (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(150) NOT NULL,
  description TEXT,
  trainer_id INT NOT NULL,
  member_id INT,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (trainer_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (member_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_workout_plans_trainer ON workout_plans(trainer_id);
CREATE INDEX idx_workout_plans_member ON workout_plans(member_id);

CREATE TABLE workout_plan_exercises (
  id INT AUTO_INCREMENT PRIMARY KEY,
  workout_plan_id INT NOT NULL,
  exercise_id INT NOT NULL,
  sets INT NOT NULL DEFAULT 3,
  reps INT NOT NULL DEFAULT 10,
  duration_secs INT,
  order_index INT NOT NULL DEFAULT 0,
  UNIQUE KEY uq_workout_plan_exercise (workout_plan_id, exercise_id),
  FOREIGN KEY (workout_plan_id) REFERENCES workout_plans(id) ON DELETE CASCADE,
  FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_wpe_plan ON workout_plan_exercises(workout_plan_id);

CREATE TABLE class_schedules (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(150) NOT NULL,
  trainer_id INT NOT NULL,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  capacity INT NOT NULL DEFAULT 20,
  location VARCHAR(120),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (capacity > 0),
  CHECK (end_time > start_time),
  FOREIGN KEY (trainer_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_class_trainer ON class_schedules(trainer_id);
CREATE INDEX idx_class_start ON class_schedules(start_time);

CREATE TABLE attendance (
  id INT AUTO_INCREMENT PRIMARY KEY,
  class_schedule_id INT NOT NULL,
  member_id INT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'booked',
  checked_in_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_attendance_class_member (class_schedule_id, member_id),
  CHECK (status IN ('booked', 'checked_in', 'cancelled')),
  FOREIGN KEY (class_schedule_id) REFERENCES class_schedules(id) ON DELETE CASCADE,
  FOREIGN KEY (member_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_attendance_member ON attendance(member_id);
CREATE INDEX idx_attendance_class ON attendance(class_schedule_id);
CREATE INDEX idx_attendance_checked_in_at ON attendance(checked_in_at);

CREATE TABLE progress_metrics (
  id INT AUTO_INCREMENT PRIMARY KEY,
  member_id INT NOT NULL,
  weight_kg DECIMAL(5,2),
  body_fat_pct DECIMAL(5,2),
  bmi DECIMAL(5,2),
  goal_note VARCHAR(255),
  photo_url VARCHAR(500),
  recorded_at DATE NOT NULL DEFAULT (CURRENT_DATE),
  FOREIGN KEY (member_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_progress_member ON progress_metrics(member_id);
CREATE INDEX idx_progress_date ON progress_metrics(recorded_at);

CREATE TABLE inventory_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  category VARCHAR(80),
  quantity INT NOT NULL DEFAULT 0,
  minimum_stock INT NOT NULL DEFAULT 0,
  supplier VARCHAR(150),
  purchase_price DECIMAL(10,2),
  selling_price DECIMAL(10,2),
  status VARCHAR(30) NOT NULL DEFAULT 'available',
  notes TEXT,
  last_maintenance DATE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CHECK (quantity >= 0),
  CHECK (minimum_stock >= 0),
  CHECK (status IN ('available', 'maintenance', 'out_of_stock'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_inventory_status ON inventory_items(status);
CREATE INDEX idx_inventory_category ON inventory_items(category);

CREATE TABLE inventory_stock_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  inventory_item_id INT NOT NULL,
  quantity_change INT NOT NULL,
  quantity_after INT NOT NULL,
  reason VARCHAR(255),
  created_by INT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (inventory_item_id) REFERENCES inventory_items(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE INDEX idx_stock_history_item ON inventory_stock_history(inventory_item_id, created_at);

CREATE TABLE diet_plans (
  id INT AUTO_INCREMENT PRIMARY KEY,
  member_id INT NOT NULL,
  title VARCHAR(150) NOT NULL,
  notes TEXT,
  calories INT,
  protein INT,
  carbs INT,
  fats INT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (member_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE diet_plan_entries (
  id INT AUTO_INCREMENT PRIMARY KEY,
  diet_plan_id INT NOT NULL,
  meal_time VARCHAR(80) NOT NULL,
  name VARCHAR(150) NOT NULL,
  description TEXT,
  calories INT,
  protein INT,
  carbs INT,
  fats INT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (diet_plan_id) REFERENCES diet_plans(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE invoices (
  id INT AUTO_INCREMENT PRIMARY KEY,
  invoice_number VARCHAR(40) NOT NULL UNIQUE,
  member_id INT NOT NULL,
  membership_id INT,
  amount DECIMAL(10,2) NOT NULL,
  due_date DATE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  paid_at TIMESTAMP NULL,
  CHECK (amount >= 0),
  CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
  FOREIGN KEY (member_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (membership_id) REFERENCES memberships(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE INDEX idx_invoices_member ON invoices(member_id, status);

CREATE TABLE payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  member_id INT NOT NULL,
  invoice_id INT,
  amount DECIMAL(10,2) NOT NULL,
  payment_method VARCHAR(80) NOT NULL,
  reference VARCHAR(200),
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (member_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_payments_member ON payments(member_id);
CREATE INDEX idx_payments_created_at ON payments(created_at);

CREATE TABLE activity_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  action VARCHAR(100) NOT NULL,
  details JSON,
  ip_address VARCHAR(45),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_activity_user ON activity_logs(user_id);
CREATE INDEX idx_activity_action ON activity_logs(action);
CREATE INDEX idx_activity_time ON activity_logs(created_at);

INSERT INTO membership_plans (name, description, price, duration_days, features) VALUES
  ('Basic', 'Gym floor access only', 29.99, 30, JSON_ARRAY('Gym floor access')),
  ('Premium', 'Gym access + group classes', 49.99, 30, JSON_ARRAY('Gym access', 'Group classes')),
  ('Elite', 'Gym access + classes + personal trainer', 99.99, 30, JSON_ARRAY('Gym access', 'Group classes', 'Personal trainer'));

-- Optional: seed a first Admin user with a bcrypt hash
-- INSERT INTO users (full_name, email, password_hash, role)
-- VALUES ('Super Admin', 'admin@example.com', '<bcrypt-hash-here>', 'admin');
