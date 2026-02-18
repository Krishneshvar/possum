import { useState, useEffect } from 'react';

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
    status: 'active',
    profit_margin: ''
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
                status: (initialData.status || 'active').toLowerCase(),
                imageFile: null,
                imageUrl: initialData.imageUrl || initialData.image_path || null,
                variants: initialData.variants?.map((v: any) => ({
                    ...v,
                    _tempId: v.id || Date.now() + Math.random(),
                    status: (v.status || 'active').toLowerCase(),
                    mrp: v.price ?? v.mrp ?? '',
                    cost_price: v.cost_price ?? '',
                    profit_margin: ((v.price ?? v.mrp) && v.cost_price && (v.price ?? v.mrp) > 0) ? (((((v.price ?? v.mrp) - v.cost_price) / (v.price ?? v.mrp)) * 100).toFixed(2)) : '',
                    stock: v.stock ?? '',
                    stock_alert_cap: v.stock_alert_cap ?? 10
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

    const handleVariantChange = (tempId: number, field: string, value: any) => {
        setFormData(prev => {
            const newVariants = [...prev.variants];
            const index = newVariants.findIndex(v => v._tempId === tempId);
            if (index === -1) return prev;

            const variant = { ...newVariants[index], [field]: value };

            // Pricing calculation logic
            const mrpRaw = field === 'mrp' ? value : variant.mrp;
            const costRaw = field === 'cost_price' ? value : variant.cost_price;
            const marginRaw = field === 'profit_margin' ? value : variant.profit_margin;

            const mrp = parseFloat(mrpRaw);
            const cost = parseFloat(costRaw);
            const margin = parseFloat(marginRaw);

            if (field === 'mrp' || field === 'cost_price') {
                if (!isNaN(mrp) && !isNaN(cost) && mrp > 0) {
                    variant.profit_margin = (((mrp - cost) / mrp) * 100).toFixed(2);
                } else if (!mrpRaw || !costRaw) {
                    variant.profit_margin = '';
                }
            } else if (field === 'profit_margin') {
                if (!isNaN(margin)) {
                    if (!isNaN(mrp) && mrp > 0) {
                        variant.cost_price = (mrp * (1 - margin / 100)).toFixed(2);
                    } else if (!isNaN(cost) && margin < 100) {
                        variant.mrp = (cost / (1 - margin / 100)).toFixed(2);
                    }
                } else if (!marginRaw) {
                    // If margin is cleared, we don't necessarily clear MRP/Cost because they are primary
                }
            }

            newVariants[index] = variant;
            return { ...prev, variants: newVariants };
        });

        const index = formData.variants.findIndex(v => v._tempId === tempId);
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

    const handleVariantBlur = (tempId: number, field: string) => {
        const index = formData.variants.findIndex(v => v._tempId === tempId);
        const touchKey = `variant-${index}-${field}`;
        setTouched(prev => ({ ...prev, [touchKey]: true }));
        if (index !== -1) {
            const error = validateVariantField(field, formData.variants[index][field]);
            setErrors(prev => ({
                ...prev,
                variants: {
                    ...prev.variants,
                    [index]: { ...prev.variants?.[index], [field]: error }
                }
            }));
        }
    };

    const clearPriceFields = (tempId: number) => {
        handleVariantChange(tempId, 'mrp', '');
        handleVariantChange(tempId, 'cost_price', '');
        handleVariantChange(tempId, 'profit_margin', '');
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
                profit_margin: '',
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

    const handleSetDefaultVariantLocally = (tempId: number) => {
        setFormData(prev => ({
            ...prev,
            variants: prev.variants.map((v) => ({
                ...v,
                is_default: v._tempId === tempId
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
