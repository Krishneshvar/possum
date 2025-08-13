import { initDB } from '../db.js';

const db = initDB();

const getVariantById = (id) => {
  return db.prepare('SELECT * FROM variants WHERE id = ? AND deleted_at IS NULL').get(id);
};

const getAllVariantsForProduct = (productId) => {
  return db.prepare('SELECT * FROM variants WHERE product_id = ? AND deleted_at IS NULL ORDER BY name ASC').all(productId);
};

const addVariant = ({
  product_id, name, sku, price, cost_price = null, profit_margin = null, stock = 0, product_tax = 0, status = 'active'
}) => {
  const stmt = db.prepare(`
    INSERT INTO variants (product_id, name, sku, price, cost_price, profit_margin, stock, product_tax, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const info = stmt.run(product_id, name, sku, price, cost_price, profit_margin, stock, product_tax, status);
  return { id: info.lastInsertRowid };
};

const updateVariant = (id, {
  name, sku, price, cost_price, profit_margin, stock, product_tax, status
}) => {
  const stmt = db.prepare(`
    UPDATE variants
    SET
      name = ?, sku = ?, price = ?, cost_price = ?, profit_margin = ?, stock = ?,
      product_tax = ?, status = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);
  return stmt.run(name, sku, price, cost_price, profit_margin, stock, product_tax, status, id);
};

// New function to update a variant's stock
const updateVariantStock = (id, newStock) => {
  return db.prepare('UPDATE variants SET stock = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(newStock, id);
};

// New function to decrement a variant's stock
const decrementVariantStock = (id, qty) => {
  return db.prepare('UPDATE variants SET stock = stock - ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(qty, id);
};

const deleteVariant = (id) => {
  const stmt = db.prepare('UPDATE variants SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?');
  return stmt.run(id);
};

export {
  getVariantById,
  getAllVariantsForProduct,
  addVariant,
  updateVariant,
  updateVariantStock,
  decrementVariantStock,
  deleteVariant,
};
