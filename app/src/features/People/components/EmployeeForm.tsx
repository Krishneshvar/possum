import { useState, useEffect } from 'react';
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

interface EmployeeFormProps {
    defaultValues?: any;
    onSave: (values: any) => void;
    isLoading?: boolean;
}

export function EmployeeForm({ defaultValues, onSave, isLoading }: EmployeeFormProps) {
    const [formData, setFormData] = useState({
        name: "",
        username: "",
        password: "",
        is_active: true
    });
    const [errors, setErrors] = useState<{ name?: string; username?: string }>({});

    useEffect(() => {
        if (defaultValues) {
            setFormData({
                name: defaultValues.name || "",
                username: defaultValues.username || "",
                password: "", // Don't pre-fill password for security/UX
                is_active: defaultValues.is_active ?? true
            });
        } else {
            setFormData({
                name: "",
                username: "",
                password: "",
                is_active: true
            });
        }
        setErrors({});
    }, [defaultValues]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
        if (errors[name as keyof typeof errors]) {
            setErrors(prev => ({ ...prev, [name]: null }));
        }
    };

    const validate = () => {
        const newErrors: { name?: string; username?: string; password?: string } = {};
        if (!formData.name || formData.name.length < 2) {
            newErrors.name = "Name must be at least 2 characters.";
        }
        if (!formData.username || formData.username.length < 3) {
            newErrors.username = "Username must be at least 3 characters.";
        }
        if (!defaultValues && (!formData.password || formData.password.length < 6)) {
            newErrors.password = "Password must be at least 6 characters.";
        }
        return newErrors;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const newErrors = validate();
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        onSave(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                    id="name"
                    name="name"
                    placeholder="e.g. John Doe"
                    value={formData.name}
                    onChange={handleChange}
                />
                {errors.name && <p className="text-sm font-medium text-destructive">{errors.name}</p>}
            </div>

            <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                    id="username"
                    name="username"
                    placeholder="e.g. johndoe"
                    value={formData.username}
                    onChange={handleChange}
                />
                {errors.username && <p className="text-sm font-medium text-destructive">{errors.username}</p>}
            </div>

            <div className="space-y-2">
                <Label htmlFor="password">Password {defaultValues && "(Leave empty to keep current)"}</Label>
                <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="******"
                    value={formData.password}
                    onChange={handleChange}
                />
                {/* @ts-ignore */}
                {errors.password && <p className="text-sm font-medium text-destructive">{errors.password}</p>}
            </div>

            <div className="flex items-center space-x-2 pt-2">
                <Checkbox
                    id="is_active"
                    name="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked: boolean) => setFormData(prev => ({ ...prev, is_active: checked }))}
                />
                <Label htmlFor="is_active">Active Account</Label>
            </div>

            <div className="flex justify-end pt-4">
                <Button type="submit" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {defaultValues ? "Update Employee" : "Add Employee"}
                </Button>
            </div>
        </form>
    );
}
