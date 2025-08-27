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

const updatePricingCalculations = (variant) => {
  const price = Number.parseFloat(variant.price) || 0;
  const cost_price = Number.parseFloat(variant.cost_price) || 0;
  const profit_margin = Number.parseFloat(variant.profit_margin) || 0;

  let updatedVariant = { ...variant };

  if (variant.lastChangedField === 'price' || variant.lastChangedField === 'cost_price') {
    updatedVariant.profit_margin = calculateProfitMargin(price * 100, cost_price * 100).toFixed(2);
  }
  else if (variant.lastChangedField === 'profit_margin') {
    if (updatedVariant.price) {
      updatedVariant.cost_price = (calculateCostPrice(price * 100, profit_margin) / 100).toFixed(2);
    } else if (updatedVariant.cost_price) {
      updatedVariant.price = (calculatePrice(cost_price * 100, profit_margin) / 100).toFixed(2);
    }
  }

  return updatedVariant;
};

const getDefaultVariant = (isDefault = false) => ({
  _tempId: nanoid(),
  name: isDefault ? 'Default Variant' : '',
  sku: '',
  price: '',
  cost_price: '',
  profit_margin: '',
  stock: '0',
  stock_alert_cap: '10',
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

  const handleVariantChange = useCallback((variantId, name, value) => {
    setFormData(prev => {
      const newVariants = prev.variants.map(variant => {
        if (variant._tempId === variantId) {
          const updatedVariant = { ...variant, [name]: value, lastChangedField: name };

          if (['price', 'cost_price', 'profit_margin'].includes(name)) {
            return updatePricingCalculations(updatedVariant);
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
    const isDefault = formData.variants.find(v => v._tempId === variantId)?.is_default === 1;
    const filteredVariants = formData.variants.filter(v => v._tempId !== variantId);

    if (isDefault && filteredVariants.length > 0) {
      const newDefaultVariant = { ...filteredVariants[0], is_default: 1, name: 'Default Variant' };
      filteredVariants[0] = newDefaultVariant;
    }

    setFormData(prev => ({
      ...prev,
      variants: filteredVariants,
    }));
  }, [formData.variants]);

  const handleSetDefaultVariant = useCallback((variantId) => {
    setFormData(prev => {
      const newVariants = prev.variants.map(v => ({
        ...v,
        is_default: v._tempId === variantId ? 1 : 0,
        name: v._tempId === variantId ? 'Default Variant' : (v.is_default === 1 ? '' : v.name),
      }));
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
    cleanData.variants = cleanData.variants.map(({ _tempId, lastChangedField, ...rest }) => rest);
    return cleanData;
  }, [formData]);

  return {
    formData,
    handleProductChange,
    handleProductSelectChange,
    handleVariantChange,
    handleFileChange,
    handleRemoveImage,
    clearPriceFields,
    addVariant,
    removeVariant,
    handleSetDefaultVariant,
    getCleanData,
  };
};
