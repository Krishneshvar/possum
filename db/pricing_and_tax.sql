CREATE TABLE IF NOT EXISTS variant_price_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  variant_id INTEGER NOT NULL,
  mrp NUMERIC(10,2) NOT NULL,
  cost_price NUMERIC(10,2) NOT NULL,
  effective_from DATETIME NOT NULL,
  effective_to DATETIME,
  FOREIGN KEY (variant_id) REFERENCES variants(id)
);

CREATE TABLE IF NOT EXISTS taxes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  rate REAL NOT NULL,
  type TEXT CHECK(type IN ('inclusive','exclusive')) NOT NULL,
  is_active INTEGER DEFAULT 1 CHECK(is_active IN (0,1))
);

CREATE TABLE IF NOT EXISTS product_taxes (
  product_id INTEGER NOT NULL,
  tax_id INTEGER NOT NULL,
  PRIMARY KEY (product_id, tax_id),
  FOREIGN KEY (product_id) REFERENCES products(id),
  FOREIGN KEY (tax_id) REFERENCES taxes(id)
);

CREATE INDEX IF NOT EXISTS idx_variant_price_history_variant_id ON variant_price_history(variant_id);
CREATE INDEX IF NOT EXISTS idx_variant_price_history_effective_from ON variant_price_history(effective_from);
CREATE INDEX IF NOT EXISTS idx_product_taxes_tax_id ON product_taxes(tax_id);
