import { useState, useEffect, useCallback } from 'react';

export interface ProductFormData {
    name: string;
    description: string;
    category_id: string;
    tax_category_id: string;
    status: string;
    imageFile: File | null;
    imageUrl: string | null;
    variants: any[];
}

export interface ValidationErrors {
    name?: string;
    variants?: { [key: number]: { name?: string; sku?: string; mrp?: string } };
}

const defaultVariant = {
    _tempId: Date.now(),
    name: 'Default',
    sku: '',
    mrp: '',
    cost_price: '',
    stock: '',
    stock_alert_cap: 10,
    is_default: true,
    status: 'active'
};

export function useProductAndVariantForm(initialData?: any) {
    const [formData, setFormData] = useState<ProductFormData>({
        name: '',
        description: '',
        category_id: '',
        tax_category_id: '',
        status: 'active',
        imageFile: null,
        imageUrl: null,
        variants: [defaultVariant]
    });

    const [errors, setErrors] = useState<ValidationErrors>({});
    const [touched, setTouched] = useState<{ [key: string]: boolean }>({});

    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name || '',
                description: initialData.description || '',
                category_id: initialData.category_id ? String(initialData.category_id) : '',
                tax_category_id: initialData.tax_category_id ? String(initialData.tax_category_id) : '',
                status: initialData.status || 'active',
                imageFile: null,
                imageUrl: initialData.imageUrl || initialData.image_path || null,
                variants: initialData.variants?.map((v: any) => ({
                    ...v,
                    _tempId: v.id || Date.now() + Math.random(),
                    mrp: v.price || v.mrp || '',
                    cost_price: v.cost_price || '',
                    stock: v.stock || '',
                    stock_alert_cap: v.stock_alert_cap || 10
                })) || [defaultVariant]
            });
        }
    }, [initialData]);

    const validateField = (field: string, value: any) => {
        if (field === 'name' && !value.trim()) {
            return 'Product name is required';
        }
        return undefined;
    };

    const validateVariantField = (field: string, value: any) => {
        if (field === 'name' && !value.trim()) return 'Variant name is required';
        if (field === 'sku' && !value.trim()) return 'SKU is required';
        if (field === 'mrp' && (!value || parseFloat(value) <= 0)) return 'MRP must be greater than 0';
        return undefined;
    };

    const handleProductChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (touched[field]) {
            const error = validateField(field, value);
            setErrors(prev => ({ ...prev, [field]: error }));
        }
    };

    const handleBlur = (field: string) => {
        setTouched(prev => ({ ...prev, [field]: true }));
        const error = validateField(field, formData[field as keyof ProductFormData]);
        setErrors(prev => ({ ...prev, [field]: error }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setFormData(prev => ({
                ...prev,
                imageFile: file,
                imageUrl: URL.createObjectURL(file)
            }));
        }
    };

    const handleRemoveImage = () => {
        setFormData(prev => ({ ...prev, imageFile: null, imageUrl: null }));
    };

    const handleVariantChange = (index: number, field: string, value: any) => {
        setFormData(prev => {
            const newVariants = [...prev.variants];
            newVariants[index] = { ...newVariants[index], [field]: value };
            return { ...prev, variants: newVariants };
        });
        
        const touchKey = `variant-${index}-${field}`;
        if (touched[touchKey]) {
            const error = validateVariantField(field, value);
            setErrors(prev => ({
                ...prev,
                variants: {
                    ...prev.variants,
                    [index]: { ...prev.variants?.[index], [field]: error }
                }
            }));
        }
    };

    const handleVariantBlur = (index: number, field: string) => {
        const touchKey = `variant-${index}-${field}`;
        setTouched(prev => ({ ...prev, [touchKey]: true }));
        const error = validateVariantField(field, formData.variants[index][field]);
        setErrors(prev => ({
            ...prev,
            variants: {
                ...prev.variants,
                [index]: { ...prev.variants?.[index], [field]: error }
            }
        }));
    };

    const clearPriceFields = (index: number) => {
        handleVariantChange(index, 'mrp', '');
        handleVariantChange(index, 'cost_price', '');
    };

    const addVariantLocally = () => {
        setFormData(prev => ({
            ...prev,
            variants: [...prev.variants, {
                _tempId: Date.now(),
                name: '',
                sku: '',
                mrp: '',
                cost_price: '',
                stock: '',
                stock_alert_cap: 10,
                is_default: false,
                status: 'active'
            }]
        }));
    };

    const removeVariantLocally = (tempId: number) => {
        setFormData(prev => ({
            ...prev,
            variants: prev.variants.filter(v => v._tempId !== tempId)
        }));
    };

    const handleSetDefaultVariantLocally = (index: number) => {
        setFormData(prev => ({
            ...prev,
            variants: prev.variants.map((v, i) => ({
                ...v,
                is_default: i === index
            }))
        }));
    };

    const reorderVariants = (startIndex: number, endIndex: number) => {
        setFormData(prev => {
            const result = Array.from(prev.variants);
            const [removed] = result.splice(startIndex, 1);
            result.splice(endIndex, 0, removed);
            return { ...prev, variants: result };
        });
    };

    return {
        formData,
        setFormData,
        errors,
        handleProductChange,
        handleVariantChange,
        handleFileChange,
        handleRemoveImage,
        handleBlur,
        handleVariantBlur,
        clearPriceFields,
        addVariantLocally,
        removeVariantLocally,
        handleSetDefaultVariantLocally,
        reorderVariants
    };
}
