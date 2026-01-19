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
('Kevin Rodriguez', '555-2011', 'family.r@email.com', '808 Aspen Rd, Lakeview');

INSERT INTO users (id, name, username, password_hash) VALUES
(1, 'Admin User', 'admin', 'pass123'),
(2, 'Manager One', 'manager1', 'pass123'),
(3, 'Cashier A', 'cashierA', 'pass123'),
(4, 'Cashier B', 'cashierB', 'pass123'),
(5, 'Cashier C', 'cashierC', 'pass123'),
(6, 'Stock Manager', 'stockm', 'pass123'),
(7, 'Jane Smith', 'janes', 'pass123'),
(8, 'Peter Jones', 'peterj', 'pass123'),
(9, 'Laura Miller', 'lauram', 'pass123'),
(10, 'Daniel White', 'danielw', 'pass123'),
(11, 'Sophia Brown', 'sophiab', 'pass123');

INSERT INTO roles (id, name) VALUES
(1, 'admin'),
(2, 'manager'),
(3, 'cashier');

INSERT INTO user_roles (user_id, role_id) VALUES
(1, 1),
(2, 2),
(3, 3),
(4, 3),
(5, 3),
(6, 2),
(7, 3),
(8, 3),
(9, 3),
(10, 3),
(11, 3);

INSERT INTO payment_methods (name) VALUES
('Cash'),
('Credit Card'),
('Debit Card'),
('UPI'),
('Gift Card');

INSERT INTO taxes (name, rate, type) VALUES
('VAT 5%', 5, 'inclusive'),
('GST 12%', 12, 'exclusive'),
('GST 18%', 18, 'exclusive');

INSERT INTO products (id, name, category_id, status) VALUES
(1, 'Coffee Beans', 1, 'active'),
(2, 'Chocolate Bar', 2, 'active'),
(3, 'Smartphone', 3, 'active'),
(4, 'The Great Book', 4, 'active'),
(5, 'T-Shirt', 5, 'active'),
(6, 'Coffee Mug', 6, 'active'),
(7, 'Shampoo', 7, 'active'),
(8, 'Loaf of Bread', 8, 'active'),
(9, 'Milk Gallon', 11, 'active'),
(10, 'All-Purpose Cleaner', 10, 'active'),
(11, 'Headphones', 3, 'active');

INSERT INTO variants (id, product_id, name, sku, mrp, cost_price, is_default) VALUES
(1, 1, 'Arabica', 'COF-B01-A', 1800, 900, 1),
(2, 1, 'Robusta', 'COF-B01-R', 1700, 850, 0),
(3, 2, 'Milk Chocolate', 'SNK-CHOC1-M', 250, 100, 1),
(4, 3, '128GB', 'EL-SMT-01-128', 75000, 50000, 1),
(5, 3, '256GB', 'EL-SMT-01-256', 85000, 55000, 0),
(6, 4, 'Paperback', 'BK-GRT-B-PB', 1200, 500, 1),
(7, 5, 'Small', 'AP-TSH-01-S', 2000, 800, 0),
(8, 5, 'Medium', 'AP-TSH-01-M', 2000, 800, 1),
(9, 5, 'Large', 'AP-TSH-01-L', 2000, 800, 0),
(10, 6, 'White', 'HM-MUG-01-W', 800, 250, 1),
(11, 6, 'Black', 'HM-MUG-01-B', 800, 250, 0),
(12, 6, 'Red', 'HM-MUG-01-R', 800, 250, 0),
(13, 7, '200ml', 'PC-SHMP-01-200', 600, 300, 1),
(14, 8, 'Whole Wheat', 'BK-BRD-01-WW', 350, 150, 1),
(15, 9, 'Organic', 'DR-MLK-01-ORG', 400, 200, 1),
(16, 10, '250ml', 'CL-APC-01-250', 550, 220, 1),
(17, 11, 'Wireless', 'EL-HDP-01-W', 10000, 4000, 1);

INSERT INTO purchase_orders (id, supplier_id, order_date, received_date, status, created_by) VALUES
(1, 1, '2025-08-01 10:00:00', '2025-08-04 15:00:00', 'received', 6),
(2, 2, '2025-08-02 11:00:00', NULL, 'pending', 6),
(3, 4, '2025-08-03 12:00:00', '2025-08-07 14:00:00', 'received', 6),
(4, 5, '2025-08-04 13:00:00', '2025-08-06 11:00:00', 'received', 6),
(5, 1, '2025-08-05 14:00:00', NULL, 'pending', 6),
(6, 3, '2025-08-06 15:00:00', NULL, 'pending', 6),
(7, 6, '2025-08-07 16:00:00', '2025-08-08 10:00:00', 'received', 6),
(8, 7, '2025-08-08 17:00:00', '2025-08-09 12:00:00', 'received', 6),
(9, 9, '2025-08-09 18:00:00', '2025-08-10 14:00:00', 'received', 6),
(10, 10, '2025-08-10 19:00:00', NULL, 'pending', 6),
(11, 11, '2025-08-11 20:00:00', NULL, 'pending', 6);

INSERT INTO purchase_order_items (id, purchase_order_id, variant_id, quantity, unit_cost) VALUES
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

INSERT INTO inventory_lots (variant_id, quantity, unit_cost, expiry_date, purchase_order_item_id) VALUES
(1, 1, 900, '2025-12-31', 1),
(3, 3, 100, '2026-06-30', 2),
(7, 10, 800, NULL, 5),
(8, 15, 800, NULL, 6),
(9, 5, 800, NULL, 7),
(13, 20, 300, '2026-10-31', 8),
(14, 30, 150, '2025-08-15', 11),
(14, 20, 150, '2025-08-16', 12),
(15, 25, 200, '2025-08-20', 13);

INSERT INTO sales (invoice_number, sale_date, total_amount, paid_amount, total_tax, discount, customer_id, user_id, status) VALUES
('INV-001', '2025-08-12 10:00:00', 3150, 3150, 210, 0, 1, 3, 'paid'),
('INV-002', '2025-08-12 11:30:00', 87000, 87000, 2200, 0, 2, 4, 'paid'),
('INV-003', '2025-08-12 12:45:00', 2150, 1000, 150, 100, 3, 5, 'partially_paid'),
('INV-004', '2025-08-12 14:00:00', 2000, 2000, 150, 0, 4, 3, 'paid'),
('INV-005', '2025-08-12 15:15:00', 10800, 10800, 600, 0, 5, 4, 'paid'),
('INV-006', '2025-08-12 16:30:00', 4300, 0, 300, 0, 6, 5, 'cancelled'),
('INV-007', '2025-08-12 17:45:00', 7850, 7850, 750, 0, 7, 3, 'paid'),
('INV-008', '2025-08-12 18:00:00', 3000, 3000, 200, 200, 8, 4, 'refunded'),
('INV-009', '2025-08-12 19:15:00', 500, 500, 40, 0, 9, 7, 'paid'),
('INV-010', '2025-08-12 20:30:00', 1250, 1250, 85, 0, 10, 7, 'paid'),
('INV-011', '2025-08-12 21:00:00', 550, 550, 40, 0, 11, 7, 'paid');

INSERT INTO sale_items (sale_id, variant_id, quantity, price_per_unit, cost_per_unit, tax_rate, tax_amount, discount_amount) VALUES
(1, 1, 1, 1800, 900, 0, 0, 0),
(1, 3, 5, 250, 100, 0, 0, 0),
(1, 10, 1, 800, 250, 0, 0, 0),
(2, 5, 1, 85000, 55000, 0, 0, 0),
(2, 3, 8, 250, 100, 0, 0, 0),
(3, 8, 1, 2000, 800, 0, 0, 0),
(3, 3, 1, 250, 100, 0, 0, 0),
(4, 8, 1, 2000, 800, 0, 0, 0),
(5, 17, 1, 10000, 4000, 0, 0, 0),
(5, 13, 1, 600, 300, 0, 0, 0),
(5, 14, 1, 350, 150, 0, 0, 0),
(6, 6, 1, 1200, 500, 0, 0, 0),
(6, 11, 2, 800, 250, 0, 0, 0),
(6, 15, 2, 400, 200, 0, 0, 0),
(7, 6, 2, 1200, 500, 0, 0, 0),
(7, 13, 1, 600, 300, 0, 0, 0),
(7, 14, 1, 350, 150, 0, 0, 0),
(7, 16, 5, 550, 220, 0, 0, 0),
(8, 9, 1, 2000, 800, 0, 0, 0),
(8, 3, 4, 250, 100, 0, 0, 0),
(9, 3, 2, 250, 100, 0, 0, 0),
(10, 14, 1, 350, 150, 0, 0, 0),
(10, 15, 2, 400, 200, 0, 0, 0),
(10, 10, 1, 800, 250, 0, 0, 0),
(11, 16, 1, 550, 220, 0, 0, 0);

INSERT INTO transactions (sale_id, amount, type, payment_method_id, transaction_date) VALUES
(1, 3150, 'payment', 1, '2025-08-12 10:00:00'),
(2, 87000, 'payment', 2, '2025-08-12 11:30:00'),
(3, 1000, 'payment', 1, '2025-08-12 12:45:00'),
(4, 2000, 'payment', 3, '2025-08-12 14:00:00'),
(5, 10800, 'payment', 1, '2025-08-12 15:15:00'),
(7, 7850, 'payment', 4, '2025-08-12 17:45:00'),
(8, 3000, 'payment', 2, '2025-08-12 18:00:00'),
(8, -3000, 'refund', 2, '2025-08-12 18:05:00'),
(9, 500, 'payment', 1, '2025-08-12 19:15:00'),
(10, 1250, 'payment', 2, '2025-08-12 20:30:00'),
(11, 550, 'payment', 1, '2025-08-12 21:00:00');

INSERT INTO inventory_adjustments (lot_id, variant_id, quantity_change, reason, adjusted_by, adjusted_at) VALUES
(2, 1, -5, 'spoilage', 6, '2025-08-12 09:00:00'),
(8, 5, 2, 'correction', 6, '2025-08-12 09:15:00'),
(5, 3, -1, 'damage', 6, '2025-08-12 09:30:00'),
(6, 4, -2, 'theft', 6, '2025-08-12 09:45:00'),
(2, 1, 5, 'correction', 6, '2025-08-12 10:00:00'),
(7, 5, -3, 'spoilage', 6, '2025-08-12 11:00:00'),
(9, 5, -1, 'damage', 6, '2025-08-12 12:00:00'),
(NULL, 10, 10, 'correction', 6, '2025-08-12 13:00:00'),
(NULL, 11, -1, 'theft', 6, '2025-08-12 14:00:00'),
(4, 3, 2, 'correction', 6, '2025-08-12 15:00:00');

INSERT INTO audit_log (user_id, action, table_name, row_id, old_data, new_data, created_at) VALUES
(1, 'create', 'products', 1, NULL, '{"name": "Coffee Beans"}', '2025-08-12 08:00:00'),
(2, 'update', 'products', 1, '{"price": 1500}', '{"price": 1600}', '2025-08-12 08:05:00'),
(6, 'update', 'products', 1, '{"stock": 50}', '{"stock": 55}', '2025-08-12 08:10:00'),
(3, 'create', 'sales', 1, NULL, '{"invoice_number": "INV-001"}', '2025-08-12 10:00:00'),
(4, 'create', 'sales', 2, NULL, '{"invoice_number": "INV-002"}', '2025-08-12 11:30:00'),
(5, 'update', 'sales', 3, '{"status": "pending"}', '{"status": "partially_paid"}', '2025-08-12 12:45:00'),
(3, 'create', 'sales', 4, NULL, '{"invoice_number": "INV-004"}', '2025-08-12 14:00:00'),
(4, 'update', 'sales', 6, '{"status": "pending"}', '{"status": "cancelled"}', '2025-08-12 16:35:00'),
(7, 'create', 'sales', 9, NULL, '{"invoice_number": "INV-009"}', '2025-08-12 19:15:00');

-- Additional Dummy Data
INSERT INTO customers (name, phone, email, address) VALUES
('Liam Wilson', '555-3001', 'liam.w@email.com', '111 Pine St, Uptown'),
('Mia Thomas', '555-3002', 'mia.t@email.com', '222 Oak St, Downtown'),
('Noah Jackson', '555-3003', 'noah.j@email.com', '333 Maple St, Midtown'),
('Olivia White', '555-3004', 'olivia.w@email.com', '444 Elm St, Suburbia'),
('William Harris', '555-3005', 'william.h@email.com', '555 Cedar St, Countryside');

INSERT INTO products (id, name, category_id, status) VALUES
(12, 'Gaming Mouse', 3, 'active'),
(13, 'Mechanical Keyboard', 3, 'active'),
(14, 'Monitor 24in', 3, 'active'),
(15, 'Green Tea', 1, 'active'),
(16, 'Orange Juice', 1, 'active');

INSERT INTO variants (id, product_id, name, sku, mrp, cost_price, is_default) VALUES
(20, 12, 'Black', 'GM-BLK-001', 1500, 800, 1),
(21, 13, 'RGB', 'KB-RGB-001', 3000, 1500, 1),
(22, 14, 'Standard', 'MN-24-001', 12000, 8000, 1),
(23, 15, 'pack of 20', 'BEV-GT-20', 150, 80, 1),
(24, 16, '1 Liter', 'BEV-OJ-1L', 200, 100, 1);

INSERT INTO inventory_lots (variant_id, quantity, unit_cost, expiry_date, purchase_order_item_id) VALUES
(20, 50, 800, NULL, NULL),
(21, 30, 1500, NULL, NULL),
(22, 10, 8000, NULL, NULL),
(23, 100, 80, '2025-12-01', NULL),
(24, 100, 100, '2025-09-01', NULL);

INSERT INTO sales (invoice_number, sale_date, total_amount, paid_amount, total_tax, discount, customer_id, user_id, status) VALUES
('INV-012', '2025-08-13 10:00:00', 1500, 1500, 150, 0, 1, 3, 'paid'),
('INV-013', '2025-08-13 10:30:00', 3000, 3000, 300, 0, 1, 3, 'paid'),
('INV-014', '2025-08-13 11:00:00', 12000, 12000, 1200, 0, 1, 4, 'paid'),
('INV-015', '2025-08-13 11:30:00', 350, 350, 35, 0, 1, 5, 'paid'),
('INV-016', '2025-08-13 12:00:00', 4500, 4500, 450, 0, 1, 4, 'paid');

INSERT INTO sale_items (sale_id, variant_id, quantity, price_per_unit, cost_per_unit, tax_rate, tax_amount, discount_amount) VALUES
(12, 20, 1, 1500, 800, 0.10, 150, 0),
(13, 21, 1, 3000, 1500, 0.10, 300, 0),
(14, 22, 1, 12000, 8000, 0.10, 1200, 0),
(15, 23, 1, 150, 80, 0.10, 15, 0),
(15, 24, 1, 200, 100, 0.10, 20, 0),
(16, 20, 1, 1500, 800, 0.10, 150, 0),
(16, 21, 1, 3000, 1500, 0.10, 300, 0);

INSERT INTO transactions (sale_id, amount, type, payment_method_id, transaction_date) VALUES
(12, 1500, 'payment', 1, '2025-08-13 10:00:00'),
(13, 3000, 'payment', 2, '2025-08-13 10:30:00'),
(14, 12000, 'payment', 2, '2025-08-13 11:00:00'),
(15, 350, 'payment', 1, '2025-08-13 11:30:00'),
(16, 4500, 'payment', 2, '2025-08-13 12:00:00');
