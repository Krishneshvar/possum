import { useState, useEffect } from 'react';
import { Loader2, Info } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import RequiredFieldIndicator from '@/components/common/RequiredFieldIndicator';
import type { CreateUserPayload } from '@/services/usersApi';

interface EmployeeFormProps {
    defaultValues?: {
        name?: string;
        username?: string;
        is_active?: boolean | number;
    };
    onSave: (values: CreateUserPayload) => void;
    isLoading?: boolean;
}

export function EmployeeForm({ defaultValues, onSave, isLoading }: EmployeeFormProps) {
    const [formData, setFormData] = useState({
        name: "",
        username: "",
        password: "",
        is_active: true
    });
    const [errors, setErrors] = useState<{ name?: string; username?: string; password?: string }>({});

    useEffect(() => {
        if (defaultValues) {
            setFormData({
                name: defaultValues.name || "",
                username: defaultValues.username || "",
                password: "", // Don't pre-fill password for security/UX
                is_active: defaultValues.is_active === undefined
                    ? true
                    : defaultValues.is_active === 1 || defaultValues.is_active === true
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
            setErrors(prev => ({ ...prev, [name]: undefined }));
        }
    };

    const validate = (): { name?: string; username?: string; password?: string } => {
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
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Account Information Section */}
            <div className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="name">
                        Full Name <RequiredFieldIndicator />
                    </Label>
                    <Input
                        id="name"
                        name="name"
                        placeholder="e.g. John Doe"
                        value={formData.name}
                        onChange={handleChange}
                        aria-required="true"
                        aria-invalid={!!errors.name}
                        aria-describedby={errors.name ? "name-error" : undefined}
                    />
                    {errors.name && (
                        <p id="name-error" className="text-sm font-medium text-destructive" role="alert">
                            {errors.name}
                        </p>
                    )}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="username">
                        Username <RequiredFieldIndicator />
                    </Label>
                    <Input
                        id="username"
                        name="username"
                        placeholder="e.g. johndoe"
                        value={formData.username}
                        onChange={handleChange}
                        aria-required="true"
                        aria-invalid={!!errors.username}
                        aria-describedby={errors.username ? "username-error" : "username-helper"}
                    />
                    {!errors.username && defaultValues && (
                        <p id="username-helper" className="text-xs text-muted-foreground">
                            Used for login access
                        </p>
                    )}
                    {errors.username && (
                        <p id="username-error" className="text-sm font-medium text-destructive" role="alert">
                            {errors.username}
                        </p>
                    )}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="password">
                        Password {!defaultValues && <RequiredFieldIndicator />}
                    </Label>
                    <Input
                        id="password"
                        name="password"
                        type="password"
                        placeholder="******"
                        value={formData.password}
                        onChange={handleChange}
                        aria-required={!defaultValues}
                        aria-invalid={!!errors.password}
                        aria-describedby="password-helper"
                    />
                    <p id="password-helper" className="text-xs text-muted-foreground flex items-start gap-1.5">
                        <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
                        <span>
                            {defaultValues 
                                ? "Leave empty to keep current password" 
                                : "Minimum 6 characters required"}
                        </span>
                    </p>
                    {errors.password && (
                        <p className="text-sm font-medium text-destructive" role="alert">
                            {errors.password}
                        </p>
                    )}
                </div>
            </div>

            <Separator />

            {/* Status Section */}
            <div className="space-y-3">
                <div>
                    <h4 className="text-sm font-medium">Account Status</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                        Inactive employees cannot log in
                    </p>
                </div>
                <div className="flex items-center space-x-2">
                    <Checkbox
                        id="is_active"
                        name="is_active"
                        checked={formData.is_active}
                        onCheckedChange={(checked: boolean | 'indeterminate') => setFormData(prev => ({ ...prev, is_active: checked === true }))}
                        aria-label="Set employee account as active"
                    />
                    <Label htmlFor="is_active" className="font-normal cursor-pointer">
                        Employee is active
                    </Label>
                </div>
            </div>

            <div className="flex justify-end pt-2">
                <Button type="submit" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {defaultValues ? "Update Employee" : "Add Employee"}
                </Button>
            </div>
        </form>
    );
}
