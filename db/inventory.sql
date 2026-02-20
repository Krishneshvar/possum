CREATE TABLE IF NOT EXISTS suppliers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  contact_person TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  gstin TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  deleted_at DATETIME
);

CREATE TABLE IF NOT EXISTS purchase_orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  supplier_id INTEGER NOT NULL,
  status TEXT CHECK(status IN ('pending','received','cancelled')) NOT NULL DEFAULT 'pending',
  order_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  received_date DATETIME,
  created_by INTEGER NOT NULL,
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS purchase_order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  purchase_order_id INTEGER NOT NULL,
  variant_id INTEGER NOT NULL,
  quantity INTEGER NOT NULL CHECK(quantity > 0),
  unit_cost NUMERIC(10,2) NOT NULL CHECK(unit_cost >= 0),
  UNIQUE(purchase_order_id, variant_id),
  FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders(id),
  FOREIGN KEY (variant_id) REFERENCES variants(id)
);

CREATE TABLE IF NOT EXISTS inventory_lots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  variant_id INTEGER NOT NULL,
  batch_number TEXT,
  manufactured_date DATETIME,
  expiry_date DATETIME,
  quantity INTEGER NOT NULL CHECK(quantity > 0),
  unit_cost NUMERIC(10,2) NOT NULL CHECK(unit_cost >= 0),
  purchase_order_item_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (variant_id) REFERENCES variants(id),
  FOREIGN KEY (purchase_order_item_id) REFERENCES purchase_order_items(id)
);

CREATE TABLE IF NOT EXISTS inventory_adjustments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  variant_id INTEGER NOT NULL,
  lot_id INTEGER,
  quantity_change INTEGER NOT NULL,
  reason TEXT CHECK(reason IN ('sale','return','confirm_receive','spoilage','damage','theft','correction')) NOT NULL,
  reference_type TEXT,
  reference_id INTEGER,
  adjusted_by INTEGER NOT NULL,
  adjusted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (variant_id) REFERENCES variants(id),
  FOREIGN KEY (lot_id) REFERENCES inventory_lots(id),
  FOREIGN KEY (adjusted_by) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_purchase_orders_supplier_id ON purchase_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_deleted_at ON suppliers(deleted_at);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_status ON purchase_orders(status);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_order_date ON purchase_orders(order_date);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_created_by ON purchase_orders(created_by);
CREATE INDEX IF NOT EXISTS idx_purchase_order_items_po_id ON purchase_order_items(purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_purchase_order_items_variant_id ON purchase_order_items(variant_id);
CREATE INDEX IF NOT EXISTS idx_inventory_lots_variant_id ON inventory_lots(variant_id);
CREATE INDEX IF NOT EXISTS idx_inventory_lots_expiry_date ON inventory_lots(expiry_date);
CREATE INDEX IF NOT EXISTS idx_inventory_lots_purchase_order_item_id ON inventory_lots(purchase_order_item_id);
CREATE INDEX IF NOT EXISTS idx_inventory_adjustments_variant_id ON inventory_adjustments(variant_id);
CREATE INDEX IF NOT EXISTS idx_inventory_adjustments_lot_id ON inventory_adjustments(lot_id);
CREATE INDEX IF NOT EXISTS idx_inventory_adjustments_adjusted_at ON inventory_adjustments(adjusted_at);

-- Triggers from 009_purchase_module_integrity.sql
CREATE TRIGGER IF NOT EXISTS trg_purchase_orders_require_creator_insert
BEFORE INSERT ON purchase_orders
FOR EACH ROW
WHEN NEW.created_by IS NULL
BEGIN
  SELECT RAISE(ABORT, 'purchase_orders.created_by is required');
END;

CREATE TRIGGER IF NOT EXISTS trg_purchase_orders_require_creator_update
BEFORE UPDATE ON purchase_orders
FOR EACH ROW
WHEN NEW.created_by IS NULL
BEGIN
  SELECT RAISE(ABORT, 'purchase_orders.created_by is required');
END;

CREATE TRIGGER IF NOT EXISTS trg_purchase_orders_received_date_insert
BEFORE INSERT ON purchase_orders
FOR EACH ROW
WHEN NEW.status = 'received' AND NEW.received_date IS NULL
BEGIN
  SELECT RAISE(ABORT, 'received purchase order must have received_date');
END;

CREATE TRIGGER IF NOT EXISTS trg_purchase_orders_received_date_update
BEFORE UPDATE ON purchase_orders
FOR EACH ROW
WHEN NEW.status = 'received' AND NEW.received_date IS NULL
BEGIN
  SELECT RAISE(ABORT, 'received purchase order must have received_date');
END;

CREATE TRIGGER IF NOT EXISTS trg_purchase_order_items_validate_insert
BEFORE INSERT ON purchase_order_items
FOR EACH ROW
WHEN NEW.quantity <= 0
  OR NEW.unit_cost < 0
  OR EXISTS (
    SELECT 1
    FROM purchase_order_items poi
    WHERE poi.purchase_order_id = NEW.purchase_order_id
      AND poi.variant_id = NEW.variant_id
  )
BEGIN
  SELECT RAISE(ABORT, 'invalid purchase_order_items row');
END;

CREATE TRIGGER IF NOT EXISTS trg_purchase_order_items_validate_update
BEFORE UPDATE ON purchase_order_items
FOR EACH ROW
WHEN NEW.quantity <= 0
  OR NEW.unit_cost < 0
  OR EXISTS (
    SELECT 1
    FROM purchase_order_items poi
    WHERE poi.purchase_order_id = NEW.purchase_order_id
      AND poi.variant_id = NEW.variant_id
      AND poi.id != NEW.id
  )
BEGIN
  SELECT RAISE(ABORT, 'invalid purchase_order_items row');
END;
