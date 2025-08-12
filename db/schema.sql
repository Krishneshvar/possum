CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  category TEXT,
  price REAL NOT NULL,
  stock INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sales (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sale_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  total_amount REAL NOT NULL,
  payment_method TEXT NOT NULL,
  customer_name TEXT
);

CREATE TABLE IF NOT EXISTS sale_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sale_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  quantity INTEGER NOT NULL,
  price_per_unit REAL NOT NULL,
  FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Dummy data
INSERT INTO products (name, category, price, stock) VALUES
('Espresso', 'Coffee', 3.50, 50),
('Latte', 'Coffee', 4.25, 45),
('Cappuccino', 'Coffee', 4.00, 38),
('Croissant', 'Pastry', 2.75, 25),
('Blueberry Muffin', 'Pastry', 3.25, 18),
('Green Tea', 'Tea', 2.50, 60);

INSERT INTO sales (total_amount, payment_method, customer_name) VALUES
(12.50, 'cash', 'John Doe'),
(8.00, 'card', NULL),
(20.25, 'digital', 'Jane Smith');

INSERT INTO sale_items (sale_id, product_id, quantity, price_per_unit) VALUES
(1, 1, 2, 3.50),
(1, 4, 1, 2.75);

INSERT INTO sale_items (sale_id, product_id, quantity, price_per_unit) VALUES
(2, 2, 1, 4.25),
(2, 6, 1, 2.50);

INSERT INTO sale_items (sale_id, product_id, quantity, price_per_unit) VALUES
(3, 3, 3, 4.00),
(3, 5, 2, 3.25);
