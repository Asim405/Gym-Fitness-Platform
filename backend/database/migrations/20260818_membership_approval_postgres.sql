DO $$
DECLARE constraint_name text;
BEGIN
  SELECT conname INTO constraint_name FROM pg_constraint
  WHERE conrelid = 'memberships'::regclass AND contype = 'c'
    AND pg_get_constraintdef(oid) LIKE '%status%';
  IF constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE memberships DROP CONSTRAINT %I', constraint_name);
  END IF;
END $$;
ALTER TABLE memberships ADD CONSTRAINT memberships_status_check
  CHECK (status IN ('active', 'expired', 'pending', 'approved', 'rejected', 'cancelled'));
