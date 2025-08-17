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
};

const createProduct = async (req, res) => {
  let { name, sku, category_id, price, cost_price, profit_margin, stock = 0, stock_alert_cap = 10, product_tax = 0, status = 'active' } = req.body;

  if (!name || !sku) {
    return res.status(400).json({ error: 'Name and SKU are required fields.' });
  }

  price = price * 100;
  cost_price = cost_price * 100;
  profit_margin = profit_margin * 100;
  console.log("Product: ", {name, sku, category_id, price, cost_price, profit_margin, stock, stock_alert_cap, product_tax, status} );

  try {
    const newProduct = addProduct({
      name,
      sku,
      category_id,
      price,
      cost_price,
      profit_margin,
      stock,
      stock_alert_cap,
      product_tax,
      status
    });
    res.status(201).json(newProduct);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create product.' });
  }
};

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
  const productData = req.body;

  if (productData.product_tax === undefined || productData.product_tax === null) {
    productData.product_tax = 0;
  }

  try {
    const changes = updateProduct(parseInt(id, 10), productData);
    if (changes.changes === 0) {
      return res.status(404).json({ error: 'Product not found.' });
    }
    res.status(200).json({ message: 'Product updated successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update product.' });
  }
};

export { getProducts, createProduct, getProductDetails, updateProductController, deleteProductController };
