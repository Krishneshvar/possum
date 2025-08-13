import {
  getAllCategories,
  getCategoryById,
  addCategory,
  updateCategory,
  deleteCategory
} from '../models/categories.model.js';

const getCategories = async (req, res) => {
  try {
    const categories = getAllCategories();
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve categories.' });
  }
};

const getCategory = async (req, res) => {
  const { id } = req.params;
  try {
    const category = getCategoryById(id);
    if (!category) {
      return res.status(404).json({ error: 'Category not found.' });
    }
    res.json(category);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve category details.' });
  }
};

const createCategory = async (req, res) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Category name is required.' });
  }
  try {
    const newCategory = addCategory(name);
    res.status(201).json(newCategory);
  } catch (err) {
    if (err.message.includes('UNIQUE constraint failed')) {
      return res.status(409).json({ error: 'A category with this name already exists.' });
    }
    res.status(500).json({ error: 'Failed to create category.' });
  }
};

const updateExistingCategory = async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'New category name is required.' });
  }
  try {
    const result = updateCategory(id, name);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Category not found.' });
    }
    res.status(200).json({ message: 'Category updated successfully.' });
  } catch (err) {
    if (err.message.includes('UNIQUE constraint failed')) {
      return res.status(409).json({ error: 'A category with this name already exists.' });
    }
    res.status(500).json({ error: 'Failed to update category.' });
  }
};

const deleteExistingCategory = async (req, res) => {
  const { id } = req.params;
  try {
    const result = deleteCategory(id);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Category not found.' });
    }
    res.status(200).json({ message: 'Category deleted successfully.' });
  } catch (err) {
    if (err.message.includes('FOREIGN KEY constraint failed')) {
      return res.status(409).json({ error: 'Cannot delete category. It is associated with one or more products.' });
    }
    res.status(500).json({ error: 'Failed to delete category.' });
  }
};

export {
  getCategories,
  getCategory,
  createCategory,
  updateExistingCategory,
  deleteExistingCategory,
};
