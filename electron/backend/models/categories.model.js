import { initDB } from '../db.js';

const db = initDB();

const getAllCategories = () => {
  return db.prepare('SELECT * FROM categories ORDER BY name ASC').all();
};

const getCategoryById = (id) => {
  return db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
};

const addCategory = (name) => {
  const stmt = db.prepare('INSERT INTO categories (name) VALUES (?)');
  const info = stmt.run(name);
  return { id: info.lastInsertRowid };
};

const updateCategory = (id, name) => {
  const stmt = db.prepare('UPDATE categories SET name = ? WHERE id = ?');
  const info = stmt.run(name, id);
  return { changes: info.changes };
};

const deleteCategory = (id) => {
  const stmt = db.prepare('DELETE FROM categories WHERE id = ?');
  const info = stmt.run(id);
  return { changes: info.changes };
};

export {
  getAllCategories,
  getCategoryById,
  addCategory,
  updateCategory,
  deleteCategory,
};
