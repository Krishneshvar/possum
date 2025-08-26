INSERT INTO categories (name, parent_id) VALUES
('Apparel', NULL),
('Electronics', NULL),
('Home Goods', NULL),
('Books', NULL),

('Men''s Clothing', 1),
('Women''s Clothing', 1),
('Children''s Clothing', 1),

('Computers & Tablets', 2),
('Smartphones & Accessories', 2),
('TVs & Home Theater', 2),

('Kitchen & Dining', 3),
('Bed & Bath', 3),
('Furniture', 3),

('Fiction', 4),
('Non-Fiction', 4),

('Tops', 5),
('Bottoms', 5),
('Outerwear', 5),

('Dresses', 6),
('Skirts', 6),

('Laptops', 8),
('Desktops', 8),
('Tablets', 8),

('Cookware', 11),
('Dinnerware', 11),

('Sci-Fi', 14),
('Fantasy', 14),

('T-Shirts', 16),
('Sweatshirts', 16),
('Jeans', 17),
('Shorts', 17);

INSERT INTO suppliers (name, contact_person, phone, email) VALUES
('Global Foods Inc.', 'Jane Doe', '555-1001', 'jane.doe@globalfoods.com'),
('Tech Wholesale Co.', 'John Smith', '555-1002', 'john.smith@techwholesale.com'),
('Book Distributors LLC', 'Emily White', '555-1003', 'emily.white@bookdistributors.com'),
('Fashion Hub Ltd.', 'Michael Green', '555-1004', 'michael.green@fashionhub.com'),
('Daily Essentials Corp.', 'Sarah Brown', '555-1005', 'sarah.brown@dailyessentials.com'),
('Fresh Produce Farms', 'David Wilson', '555-1006', 'david.wilson@freshproduce.com'),
('Bakery Supplies Inc.', 'Jessica Turner', '555-1007', 'jessica.turner@bakerysupplies.com'),
('Wholesale Cleaning Co.', 'Robert Hall', '555-1008', 'robert.hall@wholesalecleaning.com'),
('Dairy King', 'Maria Rodriguez', '555-1009', 'maria.rodriguez@dairyking.com'),
('Eco-Friendly Goods', 'Chris Evans', '555-1010', 'chris.evans@ecogoods.com'),
('Global Electronics', 'Olivia Davis', '555-1011', 'olivia.davis@globalelectronics.com');

INSERT INTO customers (name, phone, email, address) VALUES
('Alice Johnson', '555-2001', 'alice.j@email.com', '123 Main St, Anytown'),
('Bob Williams', '555-2002', 'bob.w@email.com', '456 Oak Ave, Othertown'),
('Charlie Brown', '555-2003', 'charlie.b@email.com', '789 Pine Ln, Somewhere'),
('Diana Miller', '555-2004', 'diana.m@email.com', '101 Elm Dr, Mytown'),
('Edward Davis', '555-2005', 'edward.d@email.com', '202 Birch Rd, Newville'),
('Fiona Garcia', '555-2006', 'fiona.g@email.com', '303 Cedar Ct, Old City'),
('George Wilson', '555-2007', 'george.w@email.com', '404 Maple Ave, Faraway'),
('Helen Martinez', '555-2008', 'helen.m@email.com', '505 Poplar Blvd, Greentown'),
('Ivan Lee', '555-2009', 'ivan.l@email.com', '606 Willow Way, Riverton'),
('Judy Taylor', '555-2010', 'judy.t@email.com', '707 Spruce St, Hillside'),
('Kevin Rodriguez', '555-2011', 'kevin.r@email.com', '808 Aspen Rd, Lakeview');

INSERT INTO users (name, username, password_hash, role) VALUES
('Admin User', 'admin', 'pass123', 'admin'),
('Manager One', 'manager1', 'pass123', 'manager'),
('Cashier A', 'cashierA', 'pass123', 'cashier'),
('Cashier B', 'cashierB', 'pass123', 'cashier'),
('Cashier C', 'cashierC', 'pass123', 'cashier'),
('Stock Manager', 'stockm', 'pass123', 'manager'),
('Jane Smith', 'janes', 'pass123', 'cashier'),
('Peter Jones', 'peterj', 'pass123', 'cashier'),
('Laura Miller', 'lauram', 'pass123', 'cashier'),
('Daniel White', 'danielw', 'pass123', 'cashier'),
('Sophia Brown', 'sophiab', 'pass123', 'cashier');

INSERT INTO payment_methods (name) VALUES
('Cash'),
('Credit Card'),
('Debit Card'),
('UPI'),
('Gift Card');

INSERT INTO products (id, name, category_id, status, product_tax) VALUES
(1, 'Coffee Beans', 1, 'active', 50.00),
(2, 'Chocolate Bar', 2, 'active', 50.00),
(3, 'Smartphone', 3, 'active', 50.00),
(4, 'The Great Book', 4, 'active', 50.00),
(5, 'T-Shirt', 5, 'active', 50.00),
(6, 'Coffee Mug', 6, 'active', 50.00),
(7, 'Shampoo', 7, 'active', 50.00),
(8, 'Loaf of Bread', 8, 'active', 50.00),
(9, 'Milk Gallon', 11, 'active', 50.00),
(10, 'All-Purpose Cleaner', 10, 'active', 50.00),
(11, 'Headphones', 3, 'active', 50.00);

INSERT INTO variants (id, product_id, name, sku, price, cost_price, profit_margin, stock, is_default) VALUES
(1, 1, 'Arabica', 'COF-B01-A', 1800, 900, 900, 30, 1),
(2, 1, 'Robusta', 'COF-B01-R', 1700, 850, 850, 25, 0),
(3, 2, 'Milk Chocolate', 'SNK-CHOC1-M', 250, 100, 150, 200, 1),
(4, 3, '128GB', 'EL-SMT-01-128', 75000, 50000, 25000, 8, 1),
(5, 3, '256GB', 'EL-SMT-01-256', 85000, 55000, 30000, 7, 0),
(6, 4, 'Paperback', 'BK-GRT-B-PB', 1200, 500, 700, 30, 1),
(7, 5, 'Small', 'AP-TSH-01-S', 2000, 800, 1200, 40, 0),
(8, 5, 'Medium', 'AP-TSH-01-M', 2000, 800, 1200, 35, 1),
(9, 5, 'Large', 'AP-TSH-01-L', 2000, 800, 1200, 25, 0),
(10, 6, 'White', 'HM-MUG-01-W', 800, 250, 550, 30, 1),
(11, 6, 'Black', 'HM-MUG-01-B', 800, 250, 550, 25, 0),
(12, 6, 'Red', 'HM-MUG-01-R', 800, 250, 550, 20, 0),
(13, 7, '200ml', 'PC-SHMP-01-200', 600, 300, 300, 50, 1),
(14, 8, 'Whole Wheat', 'BK-BRD-01-WW', 350, 150, 200, 40, 1),
(15, 9, 'Organic', 'DR-MLK-01-ORG', 400, 200, 200, 60, 1),
(16, 10, '250ml', 'CL-APC-01-250', 550, 220, 330, 80, 1),
(17, 11, 'Wireless', 'EL-HDP-01-W', 10000, 4000, 6000, 50, 1);

INSERT INTO purchase_orders (supplier_id, order_date, expected_delivery_date, actual_delivery_date, status, note) VALUES
(1, '2025-08-01 10:00:00', '2025-08-05 10:00:00', '2025-08-04 15:00:00', 'received', 'Urgent restock of coffee and snacks'),
(2, '2025-08-02 11:00:00', '2025-08-10 11:00:00', NULL, 'pending', 'Order for new smartphones'),
(4, '2025-08-03 12:00:00', '2025-08-08 12:00:00', '2025-08-07 14:00:00', 'received', 'Seasonal apparel order'),
(5, '2025-08-04 13:00:00', '2025-08-07 13:00:00', '2025-08-06 11:00:00', 'received', 'Regular order of personal care items'),
(1, '2025-08-05 14:00:00', '2025-08-09 14:00:00', NULL, 'pending', 'Another snack order'),
(3, '2025-08-06 15:00:00', '2025-08-12 15:00:00', NULL, 'pending', 'New book shipment'),
(6, '2025-08-07 16:00:00', '2025-08-08 16:00:00', '2025-08-08 10:00:00', 'received', 'Weekly produce delivery'),
(7, '2025-08-08 17:00:00', '2025-08-09 17:00:00', '2025-08-09 12:00:00', 'received', 'Restock of bread'),
(9, '2025-08-09 18:00:00', '2025-08-10 18:00:00', '2025-08-10 14:00:00', 'received', 'Dairy restock'),
(10, '2025-08-10 19:00:00', '2025-08-14 19:00:00', NULL, 'pending', 'Order for cleaning supplies'),
(11, '2025-08-11 20:00:00', '2025-08-15 20:00:00', NULL, 'pending', 'Order for new headphones');

INSERT INTO purchase_order_items (id, purchase_order_id, product_variant_id, quantity, cost_per_unit) VALUES
(1, 1, 1, 20, 900),
(2, 1, 3, 50, 100),
(3, 2, 4, 5, 50000),
(4, 2, 5, 5, 55000),
(5, 3, 7, 10, 800),
(6, 3, 8, 15, 800),
(7, 3, 9, 5, 800),
(8, 4, 13, 20, 300),
(9, 5, 3, 40, 100),
(10, 6, 6, 15, 500),
(11, 7, 14, 30, 150),
(12, 8, 14, 20, 150),
(13, 9, 15, 25, 200),
(14, 10, 16, 30, 220),
(15, 11, 17, 10, 4000);

INSERT INTO inventory_lots (variant_id, quantity, expiry_date, purchase_order_item_id) VALUES
(1, 1, '2025-12-31', 1),
(2, 3, '2026-06-30', 2),
(7, 10, NULL, 5),
(8, 15, NULL, 6),
(9, 5, NULL, 7),
(13, 20, '2026-10-31', 8),
(14, 30, '2025-08-15', 11),
(14, 20, '2025-08-16', 12),
(15, 25, '2025-08-20', 13);

INSERT INTO sales (invoice_number, sale_date, total_amount, paid_amount, total_tax, discount, customer_id, user_id, note, status) VALUES
('INV-001', '2025-08-12 10:00:00', 3150, 3150, 210, 0, 1, 3, 'Regular sale, paid in full', 'paid'),
('INV-002', '2025-08-12 11:30:00', 87000, 87000, 2200, 0, 2, 4, 'High-value sale', 'paid'),
('INV-003', '2025-08-12 12:45:00', 2150, 1000, 150, 100, 3, 5, 'Partially paid, using credit', 'partially paid'),
('INV-004', '2025-08-12 14:00:00', 2000, 2000, 150, 0, 4, 3, 'Regular apparel sale', 'paid'),
('INV-005', '2025-08-12 15:15:00', 10800, 10800, 600, 0, 5, 4, 'Multiple items, paid in cash', 'paid'),
('INV-006', '2025-08-12 16:30:00', 4300, 0, 300, 0, 6, 5, 'Cancelled order', 'cancelled'),
('INV-007', '2025-08-12 17:45:00', 7850, 7850, 750, 0, 7, 3, 'Paid in full', 'paid'),
('INV-008', '2025-08-12 18:00:00', 3000, 3000, 200, 200, 8, 4, 'Refund processed later', 'refunded'),
('INV-009', '2025-08-12 19:15:00', 500, 500, 40, 0, 9, 7, 'Small purchase', 'paid'),
('INV-010', '2025-08-12 20:30:00', 1250, 1250, 85, 0, 10, 7, 'Paid by card', 'paid'),
('INV-011', '2025-08-12 21:00:00', 550, 550, 40, 0, 11, 7, 'Single item purchase', 'paid');

INSERT INTO sale_items (sale_id, product_variant_id, quantity, price_per_unit, cost_per_unit, total_price) VALUES
(1, 1, 1, 1800, 900, 1800),
(1, 3, 5, 250, 100, 1250),
(1, 10, 1, 800, 250, 800),
(2, 5, 1, 85000, 55000, 85000),
(2, 3, 8, 250, 100, 2000),
(3, 8, 1, 2000, 800, 2000),
(3, 3, 1, 250, 100, 250),
(4, 8, 1, 2000, 800, 2000),
(5, 17, 1, 10000, 4000, 10000),
(5, 13, 1, 600, 300, 600),
(5, 14, 1, 350, 150, 350),
(6, 6, 1, 1200, 500, 1200),
(6, 11, 2, 800, 250, 1600),
(6, 15, 2, 400, 200, 800),
(7, 6, 2, 1200, 500, 2400),
(7, 13, 1, 600, 300, 600),
(7, 14, 1, 350, 150, 350),
(7, 16, 5, 550, 220, 2750),
(8, 9, 1, 2000, 800, 2000),
(8, 3, 4, 250, 100, 1000),
(9, 3, 2, 250, 100, 500),
(10, 14, 1, 350, 150, 350),
(10, 15, 2, 400, 200, 800),
(10, 10, 1, 800, 250, 800),
(11, 16, 1, 550, 220, 550);

INSERT INTO transactions (sale_id, user_id, amount, type, payment_method_id, transaction_date) VALUES
(1, 3, 3150, 'payment', 1, '2025-08-12 10:00:00'),
(2, 4, 87000, 'payment', 2, '2025-08-12 11:30:00'),
(3, 5, 1000, 'payment', 1, '2025-08-12 12:45:00'),
(4, 3, 2000, 'payment', 3, '2025-08-12 14:00:00'),
(5, 4, 10800, 'payment', 1, '2025-08-12 15:15:00'),
(7, 3, 7850, 'payment', 4, '2025-08-12 17:45:00'),
(8, 4, 3000, 'payment', 2, '2025-08-12 18:00:00'),
(8, 4, -3000, 'refund', 2, '2025-08-12 18:05:00'),
(9, 7, 500, 'payment', 1, '2025-08-12 19:15:00'),
(10, 7, 1250, 'payment', 2, '2025-08-12 20:30:00'),
(11, 7, 550, 'payment', 1, '2025-08-12 21:00:00');

INSERT INTO inventory_adjustments (lot_id, quantity_change, reason, user_id, adjustment_date) VALUES
(2, -5, 'spoilage', 6, '2025-08-12 09:00:00'),
(8, 2, 'correction', 6, '2025-08-12 09:15:00'),
(5, -1, 'damage', 6, '2025-08-12 09:30:00'),
(6, -2, 'theft', 6, '2025-08-12 09:45:00'),
(2, 5, 'correction', 6, '2025-08-12 10:00:00'),
(7, -3, 'spoilage', 6, '2025-08-12 11:00:00'),
(9, -1, 'damage', 6, '2025-08-12 12:00:00'),
(NULL, 10, 'correction', 6, '2025-08-12 13:00:00'),
(NULL, -1, 'theft', 6, '2025-08-12 14:00:00'),
(4, 2, 'correction', 6, '2025-08-12 15:00:00');

INSERT INTO audit_log (user_id, action, table_name, row_id, old_data, new_data, created_at) VALUES
(1, 'create', 'products', 1, NULL, '{"name": "Coffee Beans"}', '2025-08-12 08:00:00'),
(2, 'update', 'products', 1, '{"price": 1500}', '{"price": 1600}', '2025-08-12 08:05:00'),
(6, 'update', 'products', 1, '{"stock": 50}', '{"stock": 55}', '2025-08-12 08:10:00'),
(3, 'create', 'sales', 1, NULL, '{"invoice_number": "INV-001"}', '2025-08-12 10:00:00'),
(4, 'create', 'sales', 2, NULL, '{"invoice_number": "INV-002"}', '2025-08-12 11:30:00'),
(5, 'update', 'sales', 3, '{"status": "pending"}', '{"status": "partially paid"}', '2025-08-12 12:45:00'),
(3, 'create', 'sales', 4, NULL, '{"invoice_number": "INV-004"}', '2025-08-12 14:00:00'),
(4, 'update', 'sales', 6, '{"status": "pending"}', '{"status": "cancelled"}', '2025-08-12 16:35:00'),
(7, 'create', 'sales', 9, NULL, '{"invoice_number": "INV-009"}', '2025-08-12 19:15:00'),
(1, 'update', 'users', 2, '{"role": "manager"}', '{"role": "admin"}', '2025-08-12 22:00:00');

INSERT INTO reports (report_name, report_date, data) VALUES
('daily_sales', '2025-08-12', '{"total_sales": 10, "total_revenue": 105800, "top_seller": "Coffee Beans"}'),
('monthly_sales', '2025-08-01', '{"total_sales": 200, "total_revenue": 2500000, "top_seller": "Smartphone"}');
