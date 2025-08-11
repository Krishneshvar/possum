import express from 'express';
import { getAllProducts, getProductById, addProduct, updateStock, deleteProduct } from '../models/products.db.js';

const router = express.Router();

router.get('/', (req, res) => {
  res.json(getAllProducts());
});

router.get('/:id', (req, res) => {
  const product = getProductById(req.params.id);
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

router.put('/:id/stock', (req, res) => {
  try {
    updateStock(req.params.id, req.body.stock);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id', (req, res) => {
  deleteProduct(req.params.id);
  res.json({ success: true });
});

export default router;
