import { initDB } from '../db.js';

const db = initDB();

export function getAllProducts() {
  return db.prepare('SELECT * FROM products').all();
}

export function getProductById(id) {
  return db.prepare('SELECT * FROM products WHERE id = ?').get(id);
}

export function addProduct({ name, category, price, stock }) {
  const stmt = db.prepare(`
    INSERT INTO products (name, category, price, stock)
    VALUES (?, ?, ?, ?)
  `);
  const info = stmt.run(name, category, price, stock);
  return { id: info.lastInsertRowid };
}

export function updateStock(id, stock) {
  return db.prepare('UPDATE products SET stock = ? WHERE id = ?').run(stock, id);
}

export function deleteProduct(id) {
  return db.prepare('DELETE FROM products WHERE id = ?').run(id);
}
