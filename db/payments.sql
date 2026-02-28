CREATE TABLE IF NOT EXISTS payment_methods (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  is_active INTEGER NOT NULL DEFAULT 1 CHECK(is_active IN (0,1))
);

CREATE TABLE IF NOT EXISTS transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sale_id INTEGER,
  purchase_order_id INTEGER,
  amount NUMERIC(10,2) NOT NULL,
  type TEXT CHECK(type IN ('payment','refund','purchase','purchase_refund')) NOT NULL,
  payment_method_id INTEGER NOT NULL,
  status TEXT CHECK(status IN ('completed','pending','cancelled')) NOT NULL DEFAULT 'completed',
  transaction_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK(amount != 0),
  CHECK(
    (type IN ('payment', 'purchase_refund') AND amount > 0) OR
    (type IN ('refund', 'purchase') AND amount < 0)
  ),
  CHECK(
    (sale_id IS NOT NULL AND purchase_order_id IS NULL) OR
    (sale_id IS NULL AND purchase_order_id IS NOT NULL)
  ),
  FOREIGN KEY (sale_id) REFERENCES sales(id),
  FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders(id),
  FOREIGN KEY (payment_method_id) REFERENCES payment_methods(id)
);

CREATE INDEX IF NOT EXISTS idx_transactions_sale_id ON transactions(sale_id);
CREATE INDEX IF NOT EXISTS idx_transactions_purchase_order_id ON transactions(purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_transactions_payment_method_id ON transactions(payment_method_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
