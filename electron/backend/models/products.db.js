import { initDB } from '../db.js';

const db = initDB();

export function getAllProducts() {
  return db.prepare('SELECT * FROM products').all();
}

export function getProductById(id) {
  return db.prepare('SELECT * FROM products WHERE id = ?').get(id);
}

export function addProduct({ name, category = null, price = 0, stock = 0 }) {
  const stmt = db.prepare(`
    INSERT INTO products (name, category, price, stock)
    VALUES (?, ?, ?, ?)
  `);
  const info = stmt.run(name, category, price, stock);
  return { id: info.lastInsertRowid };
}

export function updateProduct(id, { name, category, price, stock }) {
  return db.prepare(
    `UPDATE products SET name = ?, category = ?, price = ?, stock = ? WHERE id = ?`
  ).run(name, category, price, stock, id);
}

export function updateStock(id, stock) {
  return db.prepare('UPDATE products SET stock = ? WHERE id = ?').run(stock, id);
}

export function decrementStock(id, qty) {
  return db.prepare('UPDATE products SET stock = stock - ? WHERE id = ?').run(qty, id);
}

export function deleteProduct(id) {
  return db.prepare('DELETE FROM products WHERE id = ?').run(id);
}
