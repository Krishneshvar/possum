import { useState, useCallback, useEffect } from 'react';
import { nanoid } from '@reduxjs/toolkit';

import {
  useAddProductMutation,
  useUpdateProductMutation,
  useAddVariantMutation,
  useUpdateVariantMutation,
  useDeleteVariantMutation
} from '@/services/productsApi';

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

const calculateMRP = (costPriceInCents, profitMargin) => {
  return costPriceInCents * (1 + (profitMargin / 100));
};

const updatePricingCalculations = (variant) => {
  const mrp = Number.parseFloat(variant.mrp) || 0;
  const cost_price = Number.parseFloat(variant.cost_price) || 0;
  const profit_margin = Number.parseFloat(variant.profit_margin) || 0;

  let updatedVariant = { ...variant };

  if (variant.lastChangedField === 'mrp' || variant.lastChangedField === 'cost_price') {
    updatedVariant.profit_margin = calculateProfitMargin(mrp * 100, cost_price * 100).toFixed(2);
  }
  else if (variant.lastChangedField === 'profit_margin') {
    if (updatedVariant.mrp) {
      updatedVariant.cost_price = (calculateCostPrice(mrp * 100, profit_margin) / 100).toFixed(2);
    } else if (updatedVariant.cost_price) {
      updatedVariant.mrp = (calculateMRP(cost_price * 100, profit_margin) / 100).toFixed(2);
    }
  }

  return updatedVariant;
};

const getDefaultVariant = (isDefault = false) => ({
  _tempId: nanoid(),
  name: isDefault ? 'Default Variant' : '',
  sku: '',
  mrp: '',
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
        mrp: v.mrp ? String(v.mrp) : '',
        cost_price: v.cost_price ? String(v.cost_price) : '',
        profit_margin: v.cost_price && v.mrp ? calculateProfitMargin(v.mrp, v.cost_price).toFixed(2) : '0',
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

  const [addProduct] = useAddProductMutation();
  const [updateProduct] = useUpdateProductMutation();
  const [addVariant] = useAddVariantMutation();
  const [updateVariant] = useUpdateVariantMutation();
  const [deleteVariant] = useDeleteVariantMutation();

  useEffect(() => {
    setFormData(getInitialFormData(initialState));
    console.log("PD: ", formData);
  }, [initialState]);

  const handleProductChange = useCallback((name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
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

          if (['mrp', 'cost_price', 'profit_margin'].includes(name)) {
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
            mrp: '',
            cost_price: '',
            profit_margin: '',
          };
        }
        return variant;
      });
      return { ...prevState, variants: newVariants };
    });
  }, []);

  const addVariantLocally = useCallback(() => {
    setFormData(prev => ({
      ...prev,
      variants: [...prev.variants, getDefaultVariant()],
    }));
  }, []);

  const removeVariantLocally = useCallback((variantId) => {
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

  const handleSetDefaultVariantLocally = useCallback((variantId) => {
    setFormData(prev => {
      const newVariants = prev.variants.map(v => ({
        ...v,
        is_default: v._tempId === variantId ? 1 : 0,
        name: v._tempId === variantId ? 'Default Variant' : (v.is_default === 1 ? '' : v.name),
      }));
      return { ...prev, variants: newVariants };
    });
  }, []);

  const getProductData = useCallback(() => {
    const { variants, ...rest } = formData;
    const cleanData = {
      ...rest,
      category_id: formData.category_id ? Number.parseInt(formData.category_id, 10) : null,
      product_tax: formData.product_tax ? Number.parseFloat(formData.product_tax) : 0,
    };

    if (formData.imageFile) {
      cleanData.imageFile = formData.imageFile;
    } else if (formData.image_path) {
      cleanData.image_path = formData.image_path;
    }

    return cleanData;
  }, [formData]);

  const getVariantData = useCallback((variant) => {
    const { _tempId, lastChangedField, ...rest } = variant;
    const cleanData = {
      ...rest,
      mrp: variant.mrp ? Number.parseFloat(variant.mrp) : 0,
      cost_price: variant.cost_price ? Number.parseFloat(variant.cost_price) : 0,
      stock: variant.stock ? Number.parseInt(variant.stock) : 0,
      stock_alert_cap: variant.stock_alert_cap ? Number.parseInt(variant.stock_alert_cap) : 0,
      is_default: variant.is_default,
    };
    return cleanData;
  }, []);

  const saveProductAndVariants = useCallback(async (isEditMode, id) => {
    try {
      const productData = getProductData();
      const variantData = formData.variants.map(getVariantData);

      if (isEditMode) {
        const newVariants = variantData.filter(v => !v.id);
        const existingVariants = variantData.filter(v => v.id);

        await updateProduct({ id, ...productData }).unwrap();

        for (const variant of existingVariants) {
          await updateVariant({ id: variant.id, productId: id, ...variant }).unwrap();
        }

        for (const variant of newVariants) {
          await addVariant({ ...variant, productId: id }).unwrap();
        }

      } else {
        await addProduct({ ...productData, variants: variantData }).unwrap();
      }
      return { success: true };
    } catch (error) {
      console.error('Failed to save product or variants:', error);
      return { success: false, error };
    }
  }, [formData, addProduct, updateProduct, addVariant, updateVariant, getProductData, getVariantData]);

  const deleteVariantFromApi = useCallback(async (variantId, productId) => {
    try {
      await deleteVariant({ id: variantId, productId }).unwrap();
      return { success: true };
    } catch (error) {
      console.error('Failed to delete variant:', error);
      return { success: false, error };
    }
  }, [deleteVariant]);

  return {
    formData,
    handleProductChange,
    handleFileChange,
    handleRemoveImage,
    handleVariantChange,
    clearPriceFields,
    addVariantLocally,
    removeVariantLocally,
    handleSetDefaultVariantLocally,
    saveProductAndVariants,
    deleteVariantFromApi,
  };
};
