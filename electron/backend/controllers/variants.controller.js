import {
  getVariantById,
  getAllVariantsForProduct,
  addVariant,
  updateVariant,
  updateVariantStock,
  decrementVariantStock,
  deleteVariant
} from '../models/variants.model.js';

const getVariantsByProduct = async (req, res) => {
  const { productId } = req.params;
  try {
    const variants = getAllVariantsForProduct(productId);
    res.json(variants);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve variants.' });
  }
};

const getVariant = async (req, res) => {
  const { id } = req.params;
  try {
    const variant = getVariantById(id);
    if (!variant) {
      return res.status(404).json({ error: 'Variant not found.' });
    }
    res.json(variant);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve variant details.' });
  }
};

const createVariant = async (req, res) => {
  let { product_id, name, sku, price, cost_price, profit_margin, stock = 0, product_tax = 0, status = 'active' } = req.body;

  if (price !== undefined && cost_price !== undefined) {
    if (price > 0) {
      profit_margin = Math.round(((price - cost_price) / price) * 100);
    } else {
      profit_margin = 0;
    }
  } else if (price !== undefined && profit_margin !== undefined) {
    cost_price = price - (price * (profit_margin / 100));
  } else if (cost_price !== undefined && profit_margin !== undefined) {
    price = Math.round(cost_price / (1 - (profit_margin / 100)));
  } else {
    return res.status(400).json({ error: 'Insufficient data for profit calculation.' });
  }

  if (!product_id || !name || !sku || price === undefined || cost_price === undefined) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }

  try {
    const newVariant = addVariant({
      product_id, name, sku, price, cost_price, profit_margin, stock, product_tax, status
    });
    res.status(201).json(newVariant);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create variant.' });
  }
};

const updateExistingVariant = async (req, res) => {
  const { id } = req.params;
  let { name, sku, price, cost_price, profit_margin, stock, product_tax, status } = req.body;

  if (price !== undefined && cost_price !== undefined) {
    if (price > 0) {
      profit_margin = Math.round(((price - cost_price) / price) * 100);
    } else {
      profit_margin = 0;
    }
  } else if (price !== undefined && profit_margin !== undefined) {
    cost_price = price - (price * (profit_margin / 100));
  } else if (cost_price !== undefined && profit_margin !== undefined) {
    price = Math.round(cost_price / (1 - (profit_margin / 100)));
  }
  
  try {
    const result = updateVariant(id, { name, sku, price, cost_price, profit_margin, stock, product_tax, status });
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Variant not found.' });
    }
    res.status(200).json({ message: 'Variant updated successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update variant.' });
  }
};

const deleteExistingVariant = async (req, res) => {
  const { id } = req.params;
  try {
    const result = deleteVariant(id);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Variant not found.' });
    }
    res.status(200).json({ message: 'Variant deleted successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete variant.' });
  }
};

export {
  getVariantsByProduct,
  getVariant,
  createVariant,
  updateExistingVariant,
  deleteExistingVariant,
};
