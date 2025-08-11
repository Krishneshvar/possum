import express from 'express';
import { recordSale, getAllSales } from '../models/sales.db.js';

const router = express.Router();

router.get('/', (req, res) => {
  res.json(getAllSales());
});

router.post('/', (req, res) => {
  try {
    const result = recordSale(req.body);
    res.json({ success: true, id: result.id });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
