ALTER TABLE class_schedules ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE class_schedules ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'cancelled', 'completed'));
