-- Product Flow Analysis (materialized log)
CREATE TABLE IF NOT EXISTS product_flow (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  variant_id INTEGER NOT NULL,
  event_type TEXT CHECK(event_type IN ('purchase','sale','return','adjustment')) NOT NULL,
  quantity INTEGER NOT NULL,
  reference_type TEXT,
  reference_id INTEGER,
  event_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (variant_id) REFERENCES variants(id)
);

-- Aggregated Sales Reports (optional caching)
CREATE TABLE IF NOT EXISTS sales_reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  report_type TEXT CHECK(report_type IN ('daily','monthly','yearly')) NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_sales NUMERIC(10,2) NOT NULL,
  total_tax NUMERIC(10,2) NOT NULL,
  total_discount NUMERIC(10,2) NOT NULL,
  total_transactions INTEGER NOT NULL,
  generated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_product_flow_variant_id ON product_flow(variant_id);
CREATE INDEX IF NOT EXISTS idx_product_flow_event_date ON product_flow(event_date);
CREATE INDEX IF NOT EXISTS idx_product_flow_event_type ON product_flow(event_type);
CREATE INDEX IF NOT EXISTS idx_product_flow_ref ON product_flow(reference_type, reference_id);
CREATE INDEX IF NOT EXISTS idx_sales_reports_period_start ON sales_reports(period_start);
CREATE INDEX IF NOT EXISTS idx_sales_reports_report_type ON sales_reports(report_type);
