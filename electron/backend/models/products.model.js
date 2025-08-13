import { initDB } from '../db.js';

const db = initDB();

const addProduct = ({
  name, sku, category_id = null, price = 0, cost_price = 0, profit_margin = 0, stock = 0, product_tax = 0, status = 'active'
}) => {
  const stmt = db.prepare(`
    INSERT INTO products (name, sku, category_id, price, cost_price, profit_margin, stock, product_tax, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const info = stmt.run(name, sku, category_id, price, cost_price, profit_margin, stock, product_tax, status);
  return { id: info.lastInsertRowid };
}

const updateProduct = (id, {
  name, sku, category_id, price, cost_price, profit_margin, stock, product_tax, status
}) => {
  const stmt = db.prepare(`
    UPDATE products
    SET
      name = ?, sku = ?, category_id = ?, price = ?, cost_price = ?, profit_margin = ?,
      stock = ?, product_tax = ?, status = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);
  return stmt.run(name, sku, category_id, price, cost_price, profit_margin, stock, product_tax, status, id);
}

const updateStock = (id, newStock) => {
  return db.prepare('UPDATE products SET stock = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(newStock, id);
}

const decrementStock = (id, qty) => {
  return db.prepare('UPDATE products SET stock = stock - ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(qty, id);
}

const deleteProduct = (id) => {
  const stmt = db.prepare('UPDATE products SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?');
  return stmt.run(id);
}

const getProductWithCategory = (id) => {
  const query = `
    SELECT
      p.id, p.name, p.sku, p.price, p.cost_price, p.profit_margin, p.stock, p.product_tax, p.status,
      c.name AS category_name
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.id = ? AND p.deleted_at IS NULL
  `;
  return db.prepare(query).get(id);
}

const getAllProductsWithCategories = () => {
  const query = `
    SELECT
      p.id, p.name, p.sku, p.price, p.cost_price, p.profit_margin, p.stock, p.product_tax, p.status,
      c.name AS category_name
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.deleted_at IS NULL
    ORDER BY p.name ASC
  `;
  return db.prepare(query).all();
}

const getProductWithVariants = (id) => {
  const product = getProductWithCategory(id);
  if (!product) return null;

  const variants = db.prepare('SELECT * FROM variants WHERE product_id = ? AND deleted_at IS NULL').all(id);
  return { ...product, variants };
}

export { addProduct, updateProduct, updateStock, decrementStock, deleteProduct, getProductWithCategory, getAllProductsWithCategories, getProductWithVariants };
