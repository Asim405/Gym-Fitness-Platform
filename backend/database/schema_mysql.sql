-- ============================================================
-- Gym & Fitness Platform — MySQL Schema
-- Compatible with MySQL 8.x (Workbench, CLI, mysql2 driver)
-- ============================================================

DROP TABLE IF EXISTS activity_logs;
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
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CHECK (role IN ('admin', 'trainer', 'member'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_email ON users(email);

CREATE TABLE membership_plans (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(80) NOT NULL UNIQUE,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  duration_days INT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (price >= 0),
  CHECK (duration_days > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE memberships (
  id INT AUTO_INCREMENT PRIMARY KEY,
  member_id INT NOT NULL,
  membership_plan_id INT NOT NULL,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
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
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
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
  recorded_at DATE NOT NULL DEFAULT CURRENT_DATE,
  FOREIGN KEY (member_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_progress_member ON progress_metrics(member_id);
CREATE INDEX idx_progress_date ON progress_metrics(recorded_at);

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

INSERT INTO membership_plans (name, description, price, duration_days) VALUES
  ('Basic', 'Gym floor access only', 29.99, 30),
  ('Premium', 'Gym access + group classes', 49.99, 30),
  ('Elite', 'Gym access + classes + personal trainer', 99.99, 30);

-- Optional: seed a first Admin user with a bcrypt hash
-- INSERT INTO users (full_name, email, password_hash, role)
-- VALUES ('Super Admin', 'admin@example.com', '<bcrypt-hash-here>', 'admin');
