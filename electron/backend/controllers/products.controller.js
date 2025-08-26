import {
  addProductWithVariants,
  getProductWithAllVariants,
  updateProductWithVariants,
  deleteProduct,
  getProducts
} from '../models/products.model.js';
import path from 'path';
import fs from 'fs';

const getProductsController = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      searchTerm = '',
      stockStatus,
      status,
      categories
    } = req.query;

    const stockStatusArray = Array.isArray(stockStatus)
      ? stockStatus.filter(s => s !== '')
      : (stockStatus ? [stockStatus] : []);

    const statusArray = Array.isArray(status)
      ? status.filter(s => s !== '')
      : (status ? [status] : []);

    let categoryIds = [];
    if (categories) {
      categoryIds = Array.isArray(categories) ? categories : [categories];
      categoryIds = categoryIds.filter(id => id !== '');
    }

    const productsData = getProducts({
      searchTerm,
      stockStatus: stockStatusArray,
      status: statusArray,
      categories: categoryIds,
      currentPage: parseInt(page, 10),
      itemsPerPage: parseInt(limit, 10)
    });

    res.json(productsData);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to retrieve products.' });
  }
};

const createProductController = async (req, res) => {
  const { name, category_id, description, status, variants } = req.body;
  const image_path = req.file ? `/uploads/${req.file.filename}` : null;

  const parsedVariants = JSON.parse(variants);

  if (!name || !parsedVariants || parsedVariants.length === 0) {
    if (image_path) {
      fs.unlinkSync(path.join(__dirname, '..', image_path));
    }
    return res.status(400).json({ error: 'Product name and at least one variant are required fields.' });
  }

  for (const variant of parsedVariants) {
    if (!variant.name || !variant.sku) {
      return res.status(400).json({ error: 'Each variant must have a name and SKU.' });
    }
  }

  try {
    const newProduct = addProductWithVariants({
      name,
      category_id,
      description,
      status,
      image_path,
      variants: parsedVariants,
    });
    res.status(201).json(newProduct);
  } catch (err) {
    console.error(err);
    if (image_path) {
      fs.unlinkSync(path.join(__dirname, '..', image_path));
    }
    res.status(500).json({ error: 'Failed to create product.' });
  }
};

const getProductDetails = async (req, res) => {
  const { id } = req.params;
  try {
    const product = getProductWithAllVariants(id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found.' });
    }
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve product details.' });
  }
};

const deleteProductController = async (req, res) => {
  const { id } = req.params;
  const productId = parseInt(id, 10);
  if (isNaN(productId)) {
    return res.status(400).json({ error: 'Invalid product ID.' });
  }

  try {
    const changes = deleteProduct(productId);
    if (changes.changes === 0) {
      return res.status(404).json({ error: 'Product not found.' });
    }
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete product.' });
  }
};

const updateProductController = async (req, res) => {
  const { id } = req.params;
  const { name, category_id, description, status, variants } = req.body;
  const image_path = req.file ? `/uploads/${req.file.filename}` : undefined;

  if (image_path) {
    const oldProduct = getProductWithAllVariants(parseInt(id, 10));
    if (oldProduct && oldProduct.image_path) {
      const oldImagePath = path.join(__dirname, '..', oldProduct.image_path);
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
      }
    }
  }

  const parsedVariants = JSON.parse(variants);
  const productData = { name, category_id, description, status, variants: parsedVariants };
  if (image_path) {
    productData.image_path = image_path;
  }

  try {
    const changes = updateProductWithVariants(parseInt(id, 10), productData);

    if (changes.productChanges.changes === 0 && changes.variantChanges.changes === 0) {
      if (image_path) {
        fs.unlinkSync(path.join(__dirname, '..', image_path));
      }
      return res.status(404).json({ error: 'Product not found or no changes made.' });
    }

    res.status(200).json({ message: 'Product updated successfully.' });
  } catch (err) {
    console.error(err);
    if (image_path) {
      fs.unlinkSync(path.join(__dirname, '..', image_path));
    }
    res.status(500).json({ error: 'Failed to update product.' });
  }
};

export { getProductsController, createProductController, getProductDetails, updateProductController, deleteProductController };
