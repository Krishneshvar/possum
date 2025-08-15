import { useEffect, useState, useCallback } from 'react';

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

export const useProductForm = (initialState) => {
  const getInitialFormData = (data) => {
    return {
      name: data?.name ?? '',
      sku: data?.sku ?? '',
      category_id: data?.category_id ? String(data.category_id) : '',
      price: data?.price ? String(data.price) : '',
      cost_price: data?.cost_price ? String(data.cost_price) : '',
      profit_margin: data?.profit_margin ? String(data.profit_margin) : '',
      stock: data?.stock ? String(data.stock) : '',
      stock_alert_cap: data?.stock_alert_cap ? String(data.stock_alert_cap) : '10',
      product_tax: data?.product_tax ? String(data.product_tax) : '0',
      status: data?.status ?? 'active',
    };
  };

  const [formData, setFormData] = useState(() => getInitialFormData(initialState));
  const [disabledField, setDisabledField] = useState("profit_margin");

  const handleCalculation = useCallback((data, currentDisabledField) => {
    let updatedData = { ...data };

    const price = Number(updatedData.price);
    const cost_price = Number(updatedData.cost_price);
    const profit_margin = Number(updatedData.profit_margin);

    if (currentDisabledField === 'price' && cost_price > 0 && profit_margin >= 0) {
      updatedData = { ...updatedData, price: calculatePrice(cost_price, profit_margin).toFixed(2) };
    }
    else if (currentDisabledField === 'cost_price' && price > 0 && profit_margin >= 0) {
      updatedData = { ...updatedData, cost_price: calculateCostPrice(price, profit_margin).toFixed(2) };
    }
    else if (currentDisabledField === 'profit_margin' && price > 0 && cost_price >= 0) {
      updatedData = { ...updatedData, profit_margin: calculateProfitMargin(price, cost_price).toFixed(2) };
    }

    return updatedData;
  }, []);

  useEffect(() => {
    setFormData(getInitialFormData(initialState));
  }, [initialState]);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    let updatedData = { ...formData, [name]: value };

    if (['price', 'cost_price', 'profit_margin'].includes(name)) {
      setFormData(handleCalculation(updatedData, disabledField));
    } else {
      setFormData(updatedData);
    }
  }, [formData, handleCalculation, disabledField]);

  const handleSelectChange = useCallback((name, value) => {
    setFormData(prevState => ({ ...prevState, [name]: value }));
  }, []);

  const handleRadioChange = useCallback((value) => {
    setDisabledField(value);
    setFormData(handleCalculation(formData, value));
  }, [formData, handleCalculation]);

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
  }, [initialState]);

  const getCleanData = useCallback(() => {
    return {
      ...formData,
      price: formData.price !== '' ? parseFloat(formData.price) : null,
      cost_price: formData.cost_price !== '' ? parseFloat(formData.cost_price) : null,
      profit_margin: formData.profit_margin !== '' ? parseFloat(formData.profit_margin) : null,
      stock: formData.stock !== '' ? parseInt(formData.stock, 10) : null,
      stock_alert_cap: formData.stock_alert_cap !== '' ? parseInt(formData.stock_alert_cap, 10) : null,
      category_id: formData.category_id !== '' ? parseInt(formData.category_id, 10) : null,
      product_tax: formData.product_tax !== '' ? parseFloat(formData.product_tax) : null,
    };
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
