import { useState, useCallback, useEffect } from 'react';

const calculateProfitMargin = (price, cost_price) => {
  if (cost_price > 0) {
    return ((price - cost_price) / cost_price) * 100;
  }
  return 0;
};

const calculateCostPrice = (price, profit_margin) => {
  return price / (1 + (profit_margin / 100));
};

const calculatePrice = (cost_price, profit_margin) => {
  return cost_price * (1 + (profit_margin / 100));
};

export const useProductForm = (initialState = {}) => {
  const getInitialFormData = useCallback((data) => {
    return {
      name: data?.name ?? '',
      sku: data?.sku ?? '',
      category_id: data?.category_id ? String(data.category_id) : '',
      price: data?.price ? String(data.price) : '',
      cost_price: data?.cost_price ? String(data.cost_price) : '',
      profit_margin: data?.profit_margin ? String(data.profit_margin) : '',
      stock: data?.stock ? String(data.stock) : '',
      stock_alert_cap: data?.stock_alert_cap ? String(data.stock_alert_cap) : '10',
      product_tax: data?.product_tax ? String(data.product_tax) : '',
      status: data?.status ?? 'active',
    };
  }, []);

  const [formData, setFormData] = useState(() => getInitialFormData(initialState));
  const [disabledField, setDisabledField] = useState("profit_margin");

  useEffect(() => {
    setFormData(getInitialFormData(initialState));
  }, [initialState, getInitialFormData]);

  const calculatePricing = useCallback((data, currentDisabledField) => {
    const price = Number.parseFloat(data.price) || 0;
    const cost_price = Number.parseFloat(data.cost_price) || 0;
    const profit_margin = Number.parseFloat(data.profit_margin) || 0;

    let updatedData = { ...data };

    if (currentDisabledField === 'price' && cost_price > 0 && profit_margin >= 0) {
      updatedData.price = calculatePrice(cost_price, profit_margin).toFixed(2);
    }
    else if (currentDisabledField === 'cost_price' && price > 0 && profit_margin >= 0) {
      updatedData.cost_price = calculateCostPrice(price, profit_margin).toFixed(2);
    }
    else if (currentDisabledField === 'profit_margin' && price > 0 && cost_price > 0) {
      updatedData.profit_margin = calculateProfitMargin(price, cost_price).toFixed(2);
    }

    return updatedData;
  }, []);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updatedData = { ...prev, [name]: value };

      if (['price', 'cost_price', 'profit_margin'].includes(name)) {
        return calculatePricing(updatedData, disabledField);
      }
      return updatedData;
    });
  }, [calculatePricing, disabledField]);

  const handleSelectChange = useCallback((name, value) => {
    setFormData(prevState => ({ ...prevState, [name]: value }));
  }, []);

  const handleRadioChange = useCallback((value) => {
    setDisabledField(value);
    setFormData(prev => calculatePricing(prev, value));
  }, [calculatePricing]);

  const clearPriceFields = useCallback(() => {
    setFormData(prevState => ({
      ...prevState,
      price: '',
      cost_price: '',
      profit_margin: '',
    }));
    setDisabledField('profit_margin');
  }, []);

  const resetForm = useCallback(() => {
    setFormData(getInitialFormData(initialState));
    setDisabledField('profit_margin');
  }, [initialState, getInitialFormData]);

  const getCleanData = useCallback(() => {
    const cleanData = { ...formData };

    cleanData.stock = cleanData.stock ? Number.parseInt(cleanData.stock) : null;
    cleanData.stock_alert_cap = cleanData.stock_alert_cap ? Number.parseInt(cleanData.stock_alert_cap) : null;

    cleanData.category_id = cleanData.category_id ? Number.parseInt(cleanData.category_id, 10) : null;

    return cleanData;
  }, [formData]);

  return {
    formData,
    setFormData,
    handleChange,
    handleSelectChange,
    handleRadioChange,
    disabledField,
    clearPriceFields,
    resetForm,
    getCleanData,
  };
};
