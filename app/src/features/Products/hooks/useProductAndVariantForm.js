import { useState, useCallback, useEffect } from 'react';
import { nanoid } from '@reduxjs/toolkit';

const calculateProfitMargin = (priceInCents, costPriceInCents) => {
  if (costPriceInCents > 0) {
    return ((priceInCents - costPriceInCents) / costPriceInCents) * 100;
  }
  return 0;
};

const calculateCostPrice = (priceInCents, profitMargin) => {
  if (profitMargin !== -100) {
    return priceInCents / (1 + (profitMargin / 100));
  }
  return 0;
};

const calculatePrice = (costPriceInCents, profitMargin) => {
  return costPriceInCents * (1 + (profitMargin / 100));
};

const getDefaultVariant = (isDefault = false) => ({
  _tempId: nanoid(),
  name: isDefault ? 'Default Variant' : '',
  sku: '',
  price: '',
  cost_price: '',
  profit_margin: '',
  stock: '',
  stock_alert_cap: '',
  is_default: isDefault ? 1 : 0,
  status: 'active',
});

const getInitialFormData = (data) => {
  if (data?.variants?.length > 0) {
    return {
      name: data.name ?? '',
      description: data.description ?? '',
      image_path: data.image_path ?? null,
      category_id: data.category_id ? String(data.category_id) : '',
      status: data.status ?? 'active',
      product_tax: data.product_tax ? String(data.product_tax) : '0',
      variants: data.variants.map(v => ({
        ...v,
        _tempId: v.id,
        price: v.price ? String(v.price) : '',
        cost_price: v.cost_price ? String(v.cost_price) : '',
        profit_margin: v.cost_price && v.price ? calculateProfitMargin(v.price, v.cost_price).toFixed(2) : '0',
        stock: v.stock ? String(v.stock) : '0',
        stock_alert_cap: v.stock_alert_cap ? String(v.stock_alert_cap) : '10',
        status: v.status ?? 'active',
      })),
    };
  }
  return {
    name: '',
    description: '',
    image_path: null,
    imageFile: null,
    category_id: '',
    status: 'active',
    product_tax: '0',
    variants: [getDefaultVariant(true)],
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

  const handleFileChange = useCallback((e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({ ...prev, imageFile: file, image_path: null }));
    }
  }, []);

  const handleRemoveImage = useCallback(() => {
    setFormData(prev => ({ ...prev, imageFile: null, image_path: null }));
  }, []);

  const handleVariantChange = useCallback((variantId, e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newVariants = prev.variants.map(variant => {
        if (variant._tempId === variantId) {
          let updatedVariant = { ...variant, [name]: value };

          const price = Number.parseFloat(updatedVariant.price) || 0;
          const cost_price = Number.parseFloat(updatedVariant.cost_price) || 0;
          const profit_margin = Number.parseFloat(updatedVariant.profit_margin) || 0;

          if (name === 'price' || name === 'cost_price') {
            updatedVariant.profit_margin = calculateProfitMargin(price * 100, cost_price * 100).toFixed(2);
          } else if (name === 'profit_margin') {
             if (updatedVariant.price) {
               updatedVariant.cost_price = (calculateCostPrice(price * 100, profit_margin) / 100).toFixed(2);
             } else if (updatedVariant.cost_price) {
                updatedVariant.price = (calculatePrice(cost_price * 100, profit_margin) / 100).toFixed(2);
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

  const clearPriceFields = useCallback((variantId) => {
    setFormData(prevState => {
      const newVariants = prevState.variants.map(variant => {
        if (variant._tempId === variantId) {
          return {
            ...variant,
            price: '',
            cost_price: '',
            profit_margin: '',
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

  const handleSetDefaultVariant = useCallback((variantId) => {
    setFormData(prev => {
      const newVariants = prev.variants.map(v => {
        if (v.is_default === 1) {
          return { ...v, is_default: 0, name: '' };
        }
        if (v._tempId === variantId) {
          return { ...v, is_default: 1, name: 'Default Variant' };
        }
        return v;
      });
      return { ...prev, variants: newVariants };
    });
  }, []);

  const getCleanData = useCallback(() => {
    const { product_tax, ...rest } = formData;
    const cleanData = {
      ...rest,
      category_id: formData.category_id ? Number.parseInt(formData.category_id, 10) : null,
      product_tax: product_tax ? Number.parseFloat(product_tax) : 0,
      variants: formData.variants.map(v => ({
        ...v,
        id: v.id,
        price: v.price ? Number.parseFloat(v.price) : 0,
        cost_price: v.cost_price ? Number.parseFloat(v.cost_price) : 0,
        stock: v.stock ? Number.parseInt(v.stock) : 0,
        stock_alert_cap: v.stock_alert_cap ? Number.parseInt(v.stock_alert_cap) : 0,
      }))
    };

    cleanData.variants = cleanData.variants.map(({ _tempId, ...rest }) => rest);

    return cleanData;
  }, [formData]);

  return {
    formData,
    handleProductChange,
    handleProductSelectChange,
    handleVariantChange,
    handleVariantSelectChange,
    handleFileChange,
    handleRemoveImage,
    clearPriceFields,
    addVariant,
    removeVariant,
    handleSetDefaultVariant,
    getCleanData,
  };
};
