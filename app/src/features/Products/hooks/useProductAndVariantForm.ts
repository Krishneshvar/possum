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

    const handleProductChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
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

    return {
        formData,
        setFormData,
        handleProductChange,
        handleVariantChange,
        handleFileChange,
        handleRemoveImage,
        clearPriceFields,
        addVariantLocally,
        removeVariantLocally,
        handleSetDefaultVariantLocally
    };
}
