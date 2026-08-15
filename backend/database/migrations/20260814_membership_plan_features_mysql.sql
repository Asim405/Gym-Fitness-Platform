ALTER TABLE membership_plans ADD COLUMN features JSON NULL;
UPDATE membership_plans SET features = JSON_ARRAY() WHERE features IS NULL;
ALTER TABLE membership_plans MODIFY features JSON NOT NULL;
ALTER TABLE membership_plans ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'active';
