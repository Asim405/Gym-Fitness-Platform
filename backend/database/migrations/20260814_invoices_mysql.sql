CREATE TABLE IF NOT EXISTS invoices (
  id INT AUTO_INCREMENT PRIMARY KEY, invoice_number VARCHAR(40) NOT NULL UNIQUE, member_id INT NOT NULL, membership_id INT,
  amount DECIMAL(10,2) NOT NULL, due_date DATE, status VARCHAR(20) NOT NULL DEFAULT 'pending', notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, paid_at TIMESTAMP NULL,
  CHECK (amount >= 0), CHECK (status IN ('pending','paid','overdue','cancelled')),
  FOREIGN KEY (member_id) REFERENCES users(id) ON DELETE CASCADE, FOREIGN KEY (membership_id) REFERENCES memberships(id) ON DELETE SET NULL
);
CREATE INDEX idx_invoices_member ON invoices(member_id, status);
ALTER TABLE payments ADD COLUMN invoice_id INT NULL, ADD CONSTRAINT fk_payments_invoice FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE SET NULL;
