import { useState } from 'react';

const calculateProfitMargin = (price, cost_price) => {
  if (price > 0) {
    return Math.round(((price - cost_price) / price) * 100);
  }
  return 0;
};

const calculateCostPrice = (price, profit_margin) => {
  return Math.round(price - (price * (profit_margin / 100)));
};

const calculatePrice = (cost_price, profit_margin) => {
  return Math.round(cost_price / (1 - (profit_margin / 100)));
};

export const useProductForm = (initialState) => {
  const getInitialFormData = () => {
    if (initialState) {
      return {
        name: initialState.name ?? '',
        sku: initialState.sku ?? '',
        category_id: initialState.category_id ? String(initialState.category_id) : '',
        price: initialState.price ? String(initialState.price) : '',
        cost_price: initialState.cost_price ? String(initialState.cost_price) : '',
        profit_margin: initialState.profit_margin ? String(initialState.profit_margin) : '',
        stock: initialState.stock ? String(initialState.stock) : '',
        status: initialState.status ?? 'active',
      };
    }
    return {
      name: '',
      sku: '',
      category_id: '',
      price: '',
      cost_price: '',
      profit_margin: '',
      stock: '',
      status: 'active',
    };
  };

  const [formData, setFormData] = useState(getInitialFormData());

  const handleChange = (e) => {
    const { name, value } = e.target;

    let updatedData = { ...formData, [name]: value };

    const price = updatedData.price !== '' ? parseFloat(updatedData.price) : null;
    const cost_price = updatedData.cost_price !== '' ? parseFloat(updatedData.cost_price) : null;
    const profit_margin = updatedData.profit_margin !== '' ? parseFloat(updatedData.profit_margin) : null;
    
    if (price !== null && cost_price !== null) {
      updatedData = { ...updatedData, profit_margin: calculateProfitMargin(price, cost_price) };
    }
    else if (price !== null && profit_margin !== null) {
      updatedData = { ...updatedData, cost_price: calculateCostPrice(price, profit_margin) };
    }
    else if (cost_price !== null && profit_margin !== null) {
      updatedData = { ...updatedData, price: calculatePrice(cost_price, profit_margin) };
    }

    setFormData(updatedData);
  };

  const handleSelectChange = (name, value) => {
    setFormData(prevState => ({
      ...prevState,
      [name]: value,
    }));
  };

  const clearPriceFields = () => {
    setFormData(prevState => ({
      ...prevState,
      price: '',
      cost_price: '',
      profit_margin: '',
    }));
  };

  const resetForm = () => {
    setFormData(getInitialFormData());
  };

  const getCleanData = () => {
    return {
      ...formData,
      price: formData.price !== '' ? parseFloat(formData.price) : null,
      cost_price: formData.cost_price !== '' ? parseFloat(formData.cost_price) : null,
      profit_margin: formData.profit_margin !== '' ? parseFloat(formData.profit_margin) : null,
      stock: formData.stock !== '' ? parseInt(formData.stock, 10) : null,
      category_id: formData.category_id !== '' ? parseInt(formData.category_id, 10) : null,
    };
  };

  return {
    formData,
    setFormData,
    handleChange,
    handleSelectChange,
    clearPriceFields,
    resetForm,
    getCleanData,
  };
};
