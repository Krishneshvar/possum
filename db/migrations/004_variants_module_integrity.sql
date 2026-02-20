-- Migration: Variants Module Integrity Fixes
-- Date: 2024
-- Description: Add constraints and indexes for variants module data integrity

-- Add CHECK constraints for positive values
-- Note: SQLite doesn't support adding constraints to existing tables
-- We need to recreate the table with constraints

-- Create new variants table with proper constraints
CREATE TABLE IF NOT EXISTS variants_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  sku TEXT,
  mrp NUMERIC(10,2) NOT NULL CHECK(mrp >= 0),
  cost_price NUMERIC(10,2) NOT NULL CHECK(cost_price >= 0),
  status TEXT CHECK(status IN ('active','inactive','discontinued')) DEFAULT 'active',
  is_default INTEGER DEFAULT 0 CHECK(is_default IN (0,1)),
  stock_alert_cap INTEGER DEFAULT 10 CHECK(stock_alert_cap >= 0),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  deleted_at DATETIME,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Copy data from old table
INSERT INTO variants_new (id, product_id, name, sku, mrp, cost_price, status, is_default, stock_alert_cap, created_at, updated_at, deleted_at)
SELECT id, product_id, name, sku, mrp, cost_price, status, is_default, stock_alert_cap, created_at, updated_at, deleted_at
FROM variants;

-- Drop old table
DROP TABLE variants;

-- Rename new table
ALTER TABLE variants_new RENAME TO variants;

-- Recreate indexes
CREATE UNIQUE INDEX idx_one_default_variant
ON variants(product_id)
WHERE is_default = 1 AND deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_variants_product_id ON variants(product_id);
CREATE INDEX IF NOT EXISTS idx_variants_name ON variants(name);
CREATE INDEX IF NOT EXISTS idx_variants_sku ON variants(sku) WHERE sku IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_variants_status ON variants(status);
CREATE INDEX IF NOT EXISTS idx_variants_deleted_at ON variants(deleted_at);
