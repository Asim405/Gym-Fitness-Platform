CREATE TABLE IF NOT EXISTS invoices (
  id SERIAL PRIMARY KEY, invoice_number VARCHAR(40) NOT NULL UNIQUE,
  member_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  membership_id INTEGER REFERENCES memberships(id) ON DELETE SET NULL,
  amount NUMERIC(10,2) NOT NULL CHECK (amount >= 0), due_date DATE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','overdue','cancelled')),
  notes TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), paid_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_invoices_member ON invoices(member_id, status);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS invoice_id INTEGER REFERENCES invoices(id) ON DELETE SET NULL;
