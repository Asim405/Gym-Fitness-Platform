ALTER TABLE inventory_items ADD COLUMN minimum_stock INT NOT NULL DEFAULT 0, ADD COLUMN supplier VARCHAR(150), ADD COLUMN purchase_price DECIMAL(10,2), ADD COLUMN selling_price DECIMAL(10,2);
CREATE TABLE IF NOT EXISTS inventory_stock_history (
  id INT AUTO_INCREMENT PRIMARY KEY, inventory_item_id INT NOT NULL, quantity_change INT NOT NULL, quantity_after INT NOT NULL,
  reason VARCHAR(255), created_by INT, created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (inventory_item_id) REFERENCES inventory_items(id) ON DELETE CASCADE, FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);
CREATE INDEX idx_stock_history_item ON inventory_stock_history(inventory_item_id, created_at);
