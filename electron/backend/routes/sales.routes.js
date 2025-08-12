import express from 'express';
import {
  createSale,
  getAllSales,
  getSaleWithItems,
} from '../models/sales.db.js';

const router = express.Router();

router.post("/", (req, res) => {
  const { items, payment_method, customer_name } = req.body;

  try {
    const newSale = createSale({ items, payment_method, customer_name });
    res.status(201).json(newSale);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get("/", (req, res) => {
  try {
    const sales = getAllSales();
    res.json(sales);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/:id", (req, res) => {
  const saleId = req.params.id;

  try {
    const sale = getSaleWithItems(saleId);
    if (!sale) {
      return res.status(404).json({ error: "Sale not found" });
    }
    res.json(sale);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
