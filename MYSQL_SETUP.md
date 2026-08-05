# MySQL Setup Guide for Gym & Fitness Platform

This guide shows how to create the MySQL database from scratch and configure the project for MySQL.

> Note: The current backend code in this repository is written for PostgreSQL (`pg`). If you want to run the app with MySQL, you will also need to update the backend DB driver and some database-specific SQL syntax.

## 1. Prerequisites

- MySQL Server installed on your machine
- MySQL command-line client (`mysql`) or MySQL Workbench
- Node.js and npm installed
- A terminal or PowerShell window

## 2. Start MySQL

Open MySQL shell or start the MySQL service.

On Windows with the MySQL service installed:

```powershell
net start MySQL
```

Or use MySQL Workbench / the Installer UI to start the server.

Verify with:

```powershell
mysql --version
```

## 3. Create the database and user

Open MySQL with a root or admin user:

```bash
mysql -u root -p
```

Then run:

```sql
CREATE DATABASE gym_fitness_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'gym_user'@'localhost' IDENTIFIED BY 'gym_password';
GRANT ALL PRIVILEGES ON gym_fitness_db.* TO 'gym_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

If you prefer a different username, password, or host, replace the values above.

## 4. Create the schema in MySQL

The repository schema file at `backend/database/schema.sql` is written for PostgreSQL. You can either convert it to MySQL syntax or use a MySQL-specific schema file.

### 4.1 Convert PostgreSQL schema to MySQL

Key PostgreSQL → MySQL conversions:

- `SERIAL` → `INT AUTO_INCREMENT`
- `TIMESTAMPTZ` → `TIMESTAMP` or `DATETIME`
- `NOW()` can remain `NOW()` for MySQL
- `JSONB` → `JSON`
- `BOOLEAN` works in MySQL, but is stored as `TINYINT(1)` internally
- `CHECK` constraints are supported in MySQL 8+, but may be ignored in older MySQL versions
- `TEXT`, `VARCHAR`, and foreign keys remain largely the same

### 4.2 Example MySQL-compatible table definitions

Below is a MySQL-friendly translation of the main tables. Use this as a reference when converting the schema file.

```sql
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
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_email ON users(email);

CREATE TABLE membership_plans (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(80) NOT NULL UNIQUE,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  duration_days INT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

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
  FOREIGN KEY (member_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (membership_plan_id) REFERENCES membership_plans(id) ON DELETE RESTRICT
);

CREATE TABLE exercises (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  target_muscle VARCHAR(80) NOT NULL,
  description TEXT,
  media_url VARCHAR(500),
  difficulty VARCHAR(20) NOT NULL DEFAULT 'beginner',
  created_by INT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

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
);

CREATE TABLE workout_plan_exercises (
  id INT AUTO_INCREMENT PRIMARY KEY,
  workout_plan_id INT NOT NULL,
  exercise_id INT NOT NULL,
  sets INT NOT NULL DEFAULT 3,
  reps INT NOT NULL DEFAULT 10,
  duration_secs INT,
  order_index INT NOT NULL DEFAULT 0,
  UNIQUE KEY (workout_plan_id, exercise_id),
  FOREIGN KEY (workout_plan_id) REFERENCES workout_plans(id) ON DELETE CASCADE,
  FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE CASCADE
);

CREATE TABLE class_schedules (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(150) NOT NULL,
  trainer_id INT NOT NULL,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  capacity INT NOT NULL DEFAULT 20,
  location VARCHAR(120),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (trainer_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE attendance (
  id INT AUTO_INCREMENT PRIMARY KEY,
  class_schedule_id INT NOT NULL,
  member_id INT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'booked',
  checked_in_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY (class_schedule_id, member_id),
  FOREIGN KEY (class_schedule_id) REFERENCES class_schedules(id) ON DELETE CASCADE,
  FOREIGN KEY (member_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE progress_metrics (
  id INT AUTO_INCREMENT PRIMARY KEY,
  member_id INT NOT NULL,
  weight_kg DECIMAL(5,2),
  body_fat_pct DECIMAL(5,2),
  bmi DECIMAL(5,2),
  goal_note VARCHAR(255),
  recorded_at DATE NOT NULL DEFAULT CURRENT_DATE,
  FOREIGN KEY (member_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE activity_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  action VARCHAR(100) NOT NULL,
  details JSON,
  ip_address VARCHAR(45),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_memberships_member ON memberships(member_id);
CREATE INDEX idx_memberships_status ON memberships(status);
CREATE INDEX idx_exercises_muscle ON exercises(target_muscle);
CREATE INDEX idx_exercises_name ON exercises(name);
CREATE INDEX idx_workout_plans_trainer ON workout_plans(trainer_id);
CREATE INDEX idx_workout_plans_member ON workout_plans(member_id);
CREATE INDEX idx_wpe_plan ON workout_plan_exercises(workout_plan_id);
CREATE INDEX idx_class_trainer ON class_schedules(trainer_id);
CREATE INDEX idx_class_start ON class_schedules(start_time);
CREATE INDEX idx_attendance_member ON attendance(member_id);
CREATE INDEX idx_attendance_class ON attendance(class_schedule_id);
CREATE INDEX idx_attendance_checked_in_at ON attendance(checked_in_at);
CREATE INDEX idx_progress_member ON progress_metrics(member_id);
CREATE INDEX idx_progress_date ON progress_metrics(recorded_at);
CREATE INDEX idx_activity_user ON activity_logs(user_id);
CREATE INDEX idx_activity_action ON activity_logs(action);
CREATE INDEX idx_activity_time ON activity_logs(created_at);

INSERT INTO membership_plans (name, description, price, duration_days) VALUES
  ('Basic', 'Gym floor access only', 29.99, 30),
  ('Premium', 'Gym access + group classes', 49.99, 30),
  ('Elite', 'Gym access + classes + personal trainer', 99.99, 30);
```

### 4.3 Import a MySQL schema file

If you save the converted schema as `backend/database/schema_mysql.sql`, load it with:

```bash
mysql -u gym_user -p gym_fitness_db < backend/database/schema_mysql.sql
```

If you want to use the existing PostgreSQL file for reference only, do not import it directly into MySQL.

## 5. Configure backend environment variables

Create or update `backend/.env` with MySQL settings:

```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000

DB_HOST=localhost
DB_PORT=3306
DB_NAME=gym_fitness_db
DB_USER=gym_user
DB_PASSWORD=gym_password

JWT_SECRET=replace_with_a_long_random_secret
JWT_EXPIRES_IN=1d
BCRYPT_SALT_ROUNDS=10
```

## 6. Install the MySQL driver and start backend

In `backend/`:

```bash
cd backend
npm install
npm install mysql2
```

Then run your backend as usual:

```bash
npm run dev
```

> If the backend still uses `pg`, you must update `backend/src/config/db.js` to use `mysql2` or another MySQL-compatible client.

## 7. Verify the database

Connect as the app user:

```bash
mysql -u gym_user -p -D gym_fitness_db
SHOW TABLES;
SELECT COUNT(*) FROM users;
```

## 8. Create the first admin user

If there is no admin account yet, use the app's registration endpoint and then update the role in the database manually:

```sql
UPDATE users SET role = 'admin' WHERE email = 'your-email@example.com';
```

## 9. Troubleshooting

- `ERROR 1045 (28000)`: bad MySQL username/password
- `ERROR 1049 (42000)`: database does not exist
- `ERROR 1064`: SQL syntax may still be PostgreSQL-style
- `ER_BAD_FIELD_ERROR`: field name mismatch after schema conversion
- `ER_NO_SUCH_TABLE`: schema import failed

## 10. Important note

This guide is for creating the MySQL database and loading schema data. Running the current backend with MySQL may require code changes because the repository is configured for PostgreSQL by default.
