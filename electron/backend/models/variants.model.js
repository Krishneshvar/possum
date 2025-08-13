import { initDB } from '../db.js';

const db = initDB();

export function getVariantById(id) {
  return db.prepare('SELECT * FROM variants WHERE id = ? AND deleted_at IS NULL').get(id);
}

export function getAllVariantsForProduct(productId) {
  return db.prepare('SELECT * FROM variants WHERE product_id = ? AND deleted_at IS NULL ORDER BY name ASC').all(productId);
}

export function addVariant({
  product_id, name, sku, price, cost_price = null, profit_margin = null, stock = 0, product_tax = 0, status = 'active'
}) {
  const stmt = db.prepare(`
    INSERT INTO variants (product_id, name, sku, price, cost_price, profit_margin, stock, product_tax, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const info = stmt.run(product_id, name, sku, price, cost_price, profit_margin, stock, product_tax, status);
  return { id: info.lastInsertRowid };
}

export function updateVariant(id, {
  name, sku, price, cost_price, profit_margin, stock, product_tax, status
}) {
  const stmt = db.prepare(`
    UPDATE variants
    SET
      name = ?, sku = ?, price = ?, cost_price = ?, profit_margin = ?, stock = ?,
      product_tax = ?, status = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);
  return stmt.run(name, sku, price, cost_price, profit_margin, stock, product_tax, status, id);
}

export function deleteVariant(id) {
  const stmt = db.prepare('UPDATE variants SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?');
  return stmt.run(id);
}
