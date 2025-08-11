import { initDB } from '../db.js';
import { getProductById, updateStock } from './products.db.js';

const db = initDB();

export function recordSale({ product_id, quantity }) {
  const product = getProductById(product_id);
  if (!product) throw new Error('Product not found');
  if (product.stock < quantity) throw new Error('Insufficient stock');

  const total_price = product.price * quantity;

  const stmt = db.prepare(`
    INSERT INTO sales (product_id, quantity, total_price)
    VALUES (?, ?, ?)
  `);
  const info = stmt.run(product_id, quantity, total_price);

  updateStock(product_id, product.stock - quantity);

  return { id: info.lastInsertRowid };
}

export function getAllSales() {
  return db.prepare('SELECT * FROM sales').all();
}
