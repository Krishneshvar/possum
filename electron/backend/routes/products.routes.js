import express from 'express';
import { getAllProducts, getProductById, addProduct, updateProduct, updateStock, deleteProduct } from '../models/products.db.js';

const router = express.Router();

router.get('/', (req, res) => {
  res.json(getAllProducts());
});

router.get('/:id', (req, res) => {
  const productId = parseInt(req.params.id, 10);
  if (isNaN(productId)) {
    return res.status(400).json({ error: 'Invalid product ID' });
  }
  const product = getProductById(productId);
  if (!product) return res.status(404).json({ error: 'Not found' });
  res.json(product);
});

router.post('/', (req, res) => {
  try {
    const result = addProduct(req.body);
    res.json({ success: true, id: result.id });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id', (req, res) => {
  try {
    const productId = parseInt(req.params.id, 10);
    const { name, category, price, stock } = req.body;
    updateProduct(productId, { name, category, price, stock });
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id/stock', (req, res) => {
  try {
    const productId = parseInt(req.params.id, 10);
    if (isNaN(productId)) {
        return res.status(400).json({ error: 'Invalid product ID' });
    }
    updateStock(productId, req.body.stock);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const productId = parseInt(req.params.id, 10);
    if (isNaN(productId)) {
      return res.status(400).json({ error: 'Invalid product ID' });
    }
    const changes = deleteProduct(productId);
    if (changes.changes === 0) {
        return res.status(404).json({ error: 'Product not found' });
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting product:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
