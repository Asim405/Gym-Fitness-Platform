ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS minimum_stock INTEGER NOT NULL DEFAULT 0 CHECK (minimum_stock >= 0);
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS supplier VARCHAR(150);
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS purchase_price NUMERIC(10,2) CHECK (purchase_price >= 0);
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS selling_price NUMERIC(10,2) CHECK (selling_price >= 0);
CREATE TABLE IF NOT EXISTS inventory_stock_history (
  id SERIAL PRIMARY KEY, inventory_item_id INTEGER NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
  quantity_change INTEGER NOT NULL, quantity_after INTEGER NOT NULL, reason VARCHAR(255),
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_stock_history_item ON inventory_stock_history(inventory_item_id, created_at DESC);
