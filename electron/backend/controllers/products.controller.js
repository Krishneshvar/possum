import {
  addProduct,
  updateProduct,
  updateStock,
  decrementStock,
  deleteProduct,
  getProductWithCategory,
  getAllProductsWithCategories,
  getProductWithVariants
} from '../models/products.model.js';

const getProducts = async (req, res) => {
  try {
    const products = getAllProductsWithCategories();
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve products.' });
  }
}

const createProduct = async (req, res) => {
  const { name, sku, category_id, price, cost_price, stock } = req.body;

  if (!name || !sku || !category_id || price === undefined || cost_price === undefined) {
    return res.status(400).json({ error: 'Missing required fields: name, sku, category_id, price, cost_price.' });
  }

  let profit_margin = 0;
  if (price > 0) {
    profit_margin = Math.round(((price - cost_price) / price) * 100);
  }

  try {
    const newProduct = addProduct({
      name,
      sku,
      category_id,
      price,
      cost_price,
      profit_margin,
      stock: stock || 0
    });
    res.status(201).json(newProduct);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create product.' });
  }
}

const getProductDetails = async (req, res) => {
  const { id } = req.params;
  try {
    const product = getProductWithVariants(id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found.' });
    }
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve product details.' });
  }
}

export { getProducts, createProduct, getProductDetails };
