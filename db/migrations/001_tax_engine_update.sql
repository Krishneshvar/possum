-- Migration: 001_tax_engine_update.sql

-- 1. Create new tax tables
CREATE TABLE IF NOT EXISTS tax_categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tax_profiles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  country_code TEXT,
  region_code TEXT,
  pricing_mode TEXT CHECK(pricing_mode IN ('INCLUSIVE', 'EXCLUSIVE')) NOT NULL,
  is_active INTEGER DEFAULT 0 CHECK(is_active IN (0,1)),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Trigger for single active profile
CREATE TRIGGER IF NOT EXISTS unique_active_profile
BEFORE UPDATE OF is_active ON tax_profiles
WHEN NEW.is_active = 1
BEGIN
  UPDATE tax_profiles SET is_active = 0 WHERE id != NEW.id AND is_active = 1;
END;

CREATE TRIGGER IF NOT EXISTS unique_active_profile_insert
BEFORE INSERT ON tax_profiles
WHEN NEW.is_active = 1
BEGIN
  UPDATE tax_profiles SET is_active = 0 WHERE is_active = 1;
END;

CREATE TABLE IF NOT EXISTS tax_rules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tax_profile_id INTEGER NOT NULL,
  tax_category_id INTEGER,
  rule_scope TEXT CHECK(rule_scope IN ('ITEM', 'INVOICE')) DEFAULT 'ITEM',
  min_price REAL,
  max_price REAL,
  min_invoice_total REAL,
  max_invoice_total REAL,
  customer_type TEXT,
  rate_percent REAL NOT NULL,
  is_compound INTEGER DEFAULT 0 CHECK(is_compound IN (0,1)),
  priority INTEGER DEFAULT 0,
  valid_from DATE,
  valid_to DATE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tax_profile_id) REFERENCES tax_profiles(id) ON DELETE CASCADE,
  FOREIGN KEY (tax_category_id) REFERENCES tax_categories(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_tax_rules_profile_id ON tax_rules(tax_profile_id);
CREATE INDEX IF NOT EXISTS idx_tax_rules_category_id ON tax_rules(tax_category_id);

-- 2. Alter Products Table
-- Check if column exists before adding (SQLite doesn't support IF NOT EXISTS for ADD COLUMN directly,
-- but this script is for migration. Ideally we run this in code with logic.)
-- We will use a safe approach: try adding, ignore error if exists in app logic, but here strict sql.
-- Since this is an offline app update, we assume standard flow.

ALTER TABLE products ADD COLUMN tax_category_id INTEGER REFERENCES tax_categories(id);
CREATE INDEX IF NOT EXISTS idx_products_tax_category_id ON products(tax_category_id);

-- 3. Alter Sale Items Table
ALTER TABLE sale_items ADD COLUMN applied_tax_rate REAL;
ALTER TABLE sale_items ADD COLUMN applied_tax_amount NUMERIC(10,2);
ALTER TABLE sale_items ADD COLUMN tax_rule_snapshot TEXT;

-- 4. Deprecate old tables (Optional: Rename or leave them be)
-- ALTER TABLE taxes RENAME TO taxes_deprecated;
-- ALTER TABLE product_taxes RENAME TO product_taxes_deprecated;
