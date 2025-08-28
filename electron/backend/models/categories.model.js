import { initDB } from '../db.js';

const db = initDB();

const buildCategoryTree = (categories, parentId = null) => {
  const tree = [];
  categories
    .filter(category => category.parent_id === parentId)
    .forEach(category => {
      const children = buildCategoryTree(categories, category.id);
      if (children.length > 0) {
        category.subcategories = children;
      }
      tree.push(category);
    });
  return tree;
};

const getCategoriesAsTree = () => {
  const allCategories = db.prepare('SELECT * FROM categories WHERE deleted_at IS NULL ORDER BY name ASC').all();
  return buildCategoryTree(allCategories);
};

const getAllCategories = () => {
  return db.prepare('SELECT * FROM categories WHERE deleted_at IS NULL ORDER BY name ASC').all();
};

const getCategoryById = (id) => {
  return db.prepare('SELECT * FROM categories WHERE id = ? AND deleted_at IS NULL').get(id);
};

const addCategory = (name, parentId = null) => {
  const stmt = db.prepare('INSERT INTO categories (name, parent_id) VALUES (?, ?)');
  const info = stmt.run(name, parentId);
  return { id: info.lastInsertRowid };
};

const updateCategory = (id, { name, parentId }) => {
  let updateFields = ['updated_at = CURRENT_TIMESTAMP'];
  let params = [];
  
  if (name !== undefined) {
    updateFields.push('name = ?');
    params.push(name);
  }
  
  if (parentId !== undefined) {
    updateFields.push('parent_id = ?');
    params.push(parentId);
  }

  if (updateFields.length === 1) {
    return { changes: 0 };
  }
  
  const stmt = db.prepare(`
    UPDATE categories
    SET ${updateFields.join(', ')}
    WHERE id = ? AND deleted_at IS NULL
  `);

  params.push(id);
  const info = stmt.run(...params);
  return { changes: info.changes };
};

const deleteCategory = (id) => {
  const stmt = db.prepare('UPDATE categories SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?');
  const info = stmt.run(id);
  return { changes: info.changes };
};

export {
  getCategoriesAsTree,
  getAllCategories,
  getCategoryById,
  addCategory,
  updateCategory,
  deleteCategory,
};
