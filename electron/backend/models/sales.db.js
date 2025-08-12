import { initDB } from '../db.js';
import { getProductById, decrementStock } from './products.db.js';

const db = initDB();

export function createSale({ items, payment_method = 'cash', customer_name = null }) {
  if (!items || !Array.isArray(items) || items.length === 0) {
    throw new Error('No items provided for sale');
  }

  let total_amount = 0;
  for (const it of items) {
    if (!it.product_id || !it.quantity || !it.price) {
      throw new Error('Invalid item format (need product_id, quantity, price)');
    }
    const product = getProductById(it.product_id);
    if (!product) throw new Error(`Product ${it.product_id} not found`);
    if (product.stock < it.quantity) throw new Error(`Insufficient stock for ${product.name}`);
    total_amount += it.price * it.quantity;
  }

  const insertSale = db.prepare(
    `INSERT INTO sales (total_amount, payment_method, customer_name) VALUES (?, ?, ?)`
  );
  const insertSaleItem = db.prepare(
    `INSERT INTO sale_items (sale_id, product_id, quantity, price_per_unit) VALUES (?, ?, ?, ?)`
  );

  const transaction = db.transaction((items) => {
    const saleInfo = insertSale.run(total_amount, payment_method, customer_name);
    const saleId = saleInfo.lastInsertRowid;

    for (const it of items) {
      insertSaleItem.run(saleId, it.product_id, it.quantity, it.price);
      decrementStock(it.product_id, it.quantity);
    }

    return saleId;
  });

  const saleId = transaction(items);
  return { id: saleId, total_amount };
}

export function getAllSales() {
  return db.prepare('SELECT * FROM sales ORDER BY sale_date DESC').all();
}

export function getSaleWithItems(saleId) {
  const sale = db.prepare('SELECT * FROM sales WHERE id = ?').get(saleId);
  if (!sale) return null;
  const items = db.prepare('SELECT * FROM sale_items WHERE sale_id = ?').all(saleId);
  return { ...sale, items };
}
