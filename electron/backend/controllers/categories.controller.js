import {
  getCategoriesAsTree,
  getAllCategories,
  getCategoryById,
  addCategory,
  updateCategory,
  deleteCategory,
} from '../models/categories.model.js';

const getCategoriesController = (req, res) => {
  try {
    const categories = getCategoriesAsTree();
    res.json(categories);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to retrieve categories.' });
  }
};

const createCategoryController = (req, res) => {
  const { name, parentId = null } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Category name is required.' });
  }
  try {
    const newCategory = addCategory(name, parentId);
    res.status(201).json(newCategory);
  } catch (err) {
    if (err.message.includes('UNIQUE constraint failed')) {
      return res.status(409).json({ error: 'A category with this name already exists.' });
    }
    res.status(500).json({ error: 'Failed to create category.' });
  }
};

const updateCategoryController = (req, res) => {
  const { id } = req.params;
  const { name, parentId } = req.body;

  try {
    const changes = updateCategory(parseInt(id, 10), { name, parentId });
    if (changes.changes === 0) {
      return res.status(404).json({ error: 'Category not found or no changes made.' });
    }
    res.status(200).json({ message: 'Category updated successfully.' });
  } catch (err) {
    if (err.message.includes('UNIQUE constraint failed')) {
      return res.status(409).json({ error: 'A category with this name already exists.' });
    }
    res.status(500).json({ error: 'Failed to update category.' });
  }
};

const deleteCategoryController = (req, res) => {
  const { id } = req.params;
  try {
    const changes = deleteCategory(parseInt(id, 10));
    if (changes.changes === 0) {
      return res.status(404).json({ error: 'Category not found.' });
    }
    res.status(204).end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete category.' });
  }
};

export {
  getCategoriesController,
  createCategoryController,
  updateCategoryController,
  deleteCategoryController,
};
