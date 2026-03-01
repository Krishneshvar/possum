DROP TABLE IF EXISTS taxes;
DROP TABLE IF EXISTS product_taxes;
DROP TABLE IF EXISTS variant_price_history;

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
