import { useState, useEffect } from 'react';
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

export function EmployeeForm({ defaultValues, onSave, isLoading }) {
    const isEditMode = !!defaultValues;
    const [formData, setFormData] = useState({
        name: "",
        username: "",
        password: "",
        is_active: true
    });
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (defaultValues) {
            setFormData({
                name: defaultValues.name || "",
                username: defaultValues.username || "",
                password: "",
                is_active: defaultValues.is_active === 1 || defaultValues.is_active === true
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

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }));
        }
    };

    const handleCheckboxChange = (checked) => {
        setFormData(prev => ({ ...prev, is_active: checked }));
    };

    const validate = () => {
        const newErrors = {};
        if (!formData.name || formData.name.length < 2) {
            newErrors.name = "Name must be at least 2 characters.";
        }
        if (!formData.username || formData.username.length < 3) {
            newErrors.username = "Username must be at least 3 characters.";
        }
        if (!isEditMode && (!formData.password)) {
            newErrors.password = "Password is required for new users.";
        }
        return newErrors;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const newErrors = validate();
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        const payload = { ...formData };
        if (isEditMode && !payload.password) {
            delete payload.password;
        }
        payload.is_active = payload.is_active ? 1 : 0;

        onSave(payload);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                    id="name"
                    name="name"
                    placeholder="Jane Doe"
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
                    placeholder="jane.doe"
                    value={formData.username}
                    onChange={handleChange}
                />
                {errors.username && <p className="text-sm font-medium text-destructive">{errors.username}</p>}
            </div>

            <div className="space-y-2">
                <Label htmlFor="password">Password {isEditMode && "(Leave blank to keep current)"}</Label>
                <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="********"
                    value={formData.password}
                    onChange={handleChange}
                />
                {errors.password && <p className="text-sm font-medium text-destructive">{errors.password}</p>}
            </div>

            <div className="flex flex-row items-center space-x-3 rounded-lg border p-3 shadow-sm">
                <Checkbox
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={handleCheckboxChange}
                />
                <div className="space-y-0.5 leading-none">
                    <Label htmlFor="is_active">Active Account</Label>
                    <p className="text-sm text-muted-foreground">Inactive users cannot log in.</p>
                </div>
            </div>

            <div className="flex justify-end pt-4">
                <Button type="submit" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isEditMode ? "Update Employee" : "Add Employee"}
                </Button>
            </div>
        </form>
    );
}
