import { useState, useEffect, useMemo } from 'react';
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { flattenCategories } from '@/utils/categories.utils.js';
import { Category } from '@/services/categoriesApi';

interface CategoryFormProps {
    defaultValues?: Partial<Category>;
    categories: Category[];
    onSave: (payload: { name: string; parentId: number | null }) => void;
    isLoading?: boolean;
}

export function CategoryForm({ defaultValues, categories, onSave, isLoading }: CategoryFormProps) {
    const [formData, setFormData] = useState({
        name: "",
        parentId: "none"
    });
    const [errors, setErrors] = useState<Record<string, string | null>>({});

    useEffect(() => {
        if (defaultValues) {
            setFormData({
                name: defaultValues.name || "",
                parentId: defaultValues.parent_id ? String(defaultValues.parent_id) : "none"
            });
        } else {
            setFormData({
                name: "",
                parentId: "none"
            });
        }
        setErrors({});
    }, [defaultValues]);

    const flatCategories = useMemo(() => {
        return flattenCategories(categories).filter(c => c.id !== defaultValues?.id);
    }, [categories, defaultValues]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }));
        }
    };

    const handleSelectChange = (value: string) => {
        setFormData(prev => ({ ...prev, parentId: value }));
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.name || formData.name.length < 2) {
            newErrors.name = "Category name must be at least 2 characters.";
        }
        return newErrors;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const newErrors = validate();
        if (Object.keys(newErrors).length > 0) {
            // @ts-ignore
            setErrors(newErrors);
            return;
        }

        const payload = {
            name: formData.name,
            parentId: formData.parentId === "none" ? null : Number(formData.parentId)
        };
        onSave(payload);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="name">Category Name</Label>
                <Input
                    id="name"
                    name="name"
                    placeholder="e.g. Beverages"
                    value={formData.name}
                    onChange={handleChange}
                />
                {errors.name && <p className="text-sm font-medium text-destructive">{errors.name}</p>}
            </div>

            <div className="space-y-2">
                <Label>Parent Category</Label>
                <Select onValueChange={handleSelectChange} value={formData.parentId}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select a parent category" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="none">None (Root Category)</SelectItem>
                        {flatCategories.map((category) => (
                            <SelectItem key={category.id} value={String(category.id)}>
                                {category.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="flex justify-end pt-4">
                <Button type="submit" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {defaultValues ? "Update Category" : "Add Category"}
                </Button>
            </div>
        </form>
    );
}
