import { useState, useCallback, useEffect } from 'react';
import { nanoid } from '@reduxjs/toolkit';

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

const getDefaultVariant = () => ({
  _tempId: nanoid(),
  name: 'Default Variant',
  sku: '',
  price: '',
  cost_price: '',
  profit_margin: '',
  stock: '0',
  stock_alert_cap: '10',
  product_tax: '0',
  disabledField: 'profit_margin',
  is_default: 1,
});

const getInitialFormData = (data) => {
  // If editing an existing product, populate with its data
  if (data?.variants?.length > 0) {
    const defaultVariant = data.variants.find(v => v.is_default);
    return {
      name: data.name ?? '',
      category_id: data.category_id ? String(data.category_id) : '',
      status: data.status ?? 'active',
      variants: data.variants.map(v => ({
        ...v,
        _tempId: v.id,
        price: v.price ? String(v.price) : '',
        cost_price: v.cost_price ? String(v.cost_price) : '',
        profit_margin: v.cost_price && v.price ? calculateProfitMargin(v.price, v.cost_price).toFixed(2) : '0',
        stock: v.stock ? String(v.stock) : '0',
        stock_alert_cap: v.stock_alert_cap ? String(v.stock_alert_cap) : '10',
        product_tax: v.product_tax ? String(v.product_tax) : '0',
        disabledField: 'profit_margin',
      })),
    };
  }
  // If adding a new product, provide a default variant
  return {
    name: '',
    category_id: '',
    status: 'active',
    variants: [getDefaultVariant()],
  };
};

export const useProductAndVariantForm = (initialState = {}) => {
  const [formData, setFormData] = useState(() => getInitialFormData(initialState));

  useEffect(() => {
    setFormData(getInitialFormData(initialState));
  }, [initialState]);

  const handleProductChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleProductSelectChange = useCallback((name, value) => {
    setFormData(prevState => ({ ...prevState, [name]: value }));
  }, []);

  const handleVariantChange = useCallback((variantId, e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newVariants = prev.variants.map(variant => {
        if (variant._tempId === variantId) {
          let updatedVariant = { ...variant, [name]: value };

          if (['price', 'cost_price', 'profit_margin'].includes(name)) {
            const price = Number.parseFloat(updatedVariant.price) || 0;
            const cost_price = Number.parseFloat(updatedVariant.cost_price) || 0;
            const profit_margin = Number.parseFloat(updatedVariant.profit_margin) || 0;

            if (updatedVariant.disabledField === 'price' && cost_price > 0 && profit_margin >= 0) {
              updatedVariant.price = calculatePrice(cost_price, profit_margin).toFixed(2);
            }
            else if (updatedVariant.disabledField === 'cost_price' && price > 0 && profit_margin >= 0) {
              updatedVariant.cost_price = calculateCostPrice(price, profit_margin).toFixed(2);
            }
            else if (updatedVariant.disabledField === 'profit_margin' && price > 0 && cost_price > 0) {
              updatedVariant.profit_margin = calculateProfitMargin(price, cost_price).toFixed(2);
            }
          }
          return updatedVariant;
        }
        return variant;
      });
      return { ...prev, variants: newVariants };
    });
  }, []);

  const handleVariantSelectChange = useCallback((variantId, name, value) => {
    setFormData(prevState => {
      const newVariants = prevState.variants.map(variant => {
        if (variant._tempId === variantId) {
          return { ...variant, [name]: value };
        }
        return variant;
      });
      return { ...prevState, variants: newVariants };
    });
  }, []);

  const handleRadioChange = useCallback((variantId, value) => {
    setFormData(prev => {
      const newVariants = prev.variants.map(variant => {
        if (variant._tempId === variantId) {
          let updatedVariant = { ...variant, disabledField: value };
          const price = Number.parseFloat(updatedVariant.price) || 0;
          const cost_price = Number.parseFloat(updatedVariant.cost_price) || 0;
          const profit_margin = Number.parseFloat(updatedVariant.profit_margin) || 0;

          if (value === 'price' && cost_price > 0 && profit_margin >= 0) {
            updatedVariant.price = calculatePrice(cost_price, profit_margin).toFixed(2);
          }
          else if (value === 'cost_price' && price > 0 && profit_margin >= 0) {
            updatedVariant.cost_price = calculateCostPrice(price, profit_margin).toFixed(2);
          }
          else if (value === 'profit_margin' && price > 0 && cost_price > 0) {
            updatedVariant.profit_margin = calculateProfitMargin(price, cost_price).toFixed(2);
          }

          return updatedVariant;
        }
        return variant;
      });
      return { ...prev, variants: newVariants };
    });
  }, []);

  const clearPriceFields = useCallback((variantId) => {
    setFormData(prevState => {
      const newVariants = prevState.variants.map(variant => {
        if (variant._tempId === variantId) {
          return {
            ...variant,
            price: '',
            cost_price: '',
            profit_margin: '',
            disabledField: 'profit_margin',
          };
        }
        return variant;
      });
      return { ...prevState, variants: newVariants };
    });
  }, []);

  const addVariant = useCallback(() => {
    setFormData(prev => ({
      ...prev,
      variants: [...prev.variants, getDefaultVariant()],
    }));
  }, []);

  const removeVariant = useCallback((variantId) => {
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.filter(v => v._tempId !== variantId),
    }));
  }, []);

  const getCleanData = useCallback(() => {
    const cleanData = {
      ...formData,
      category_id: formData.category_id ? Number.parseInt(formData.category_id, 10) : null,
      variants: formData.variants.map(v => ({
        ...v,
        price: v.price ? Number.parseFloat(v.price) : 0,
        cost_price: v.cost_price ? Number.parseFloat(v.cost_price) : 0,
        profit_margin: v.profit_margin ? Number.parseFloat(v.profit_margin) : 0,
        stock: v.stock ? Number.parseInt(v.stock) : 0,
        stock_alert_cap: v.stock_alert_cap ? Number.parseInt(v.stock_alert_cap) : 0,
        product_tax: v.product_tax ? Number.parseFloat(v.product_tax) : 0,
      }))
    };
    return cleanData;
  }, [formData]);

  return {
    formData,
    handleProductChange,
    handleProductSelectChange,
    handleVariantChange,
    handleVariantSelectChange,
    handleRadioChange,
    clearPriceFields,
    addVariant,
    removeVariant,
    getCleanData,
  };
};
