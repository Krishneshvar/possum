import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import type { Customer, CustomerWritePayload } from '@/services/customersApi';

interface CustomerFormProps {
    defaultValues?: Customer | null;
    onSave: (values: CustomerWritePayload) => void;
    isLoading?: boolean;
}

interface FormErrors {
    name?: string;
    email?: string;
    phone?: string;
}

export function CustomerForm({ defaultValues, onSave, isLoading }: CustomerFormProps) {
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [address, setAddress] = useState('');
    const [errors, setErrors] = useState<FormErrors>({});

    const customerToEdit = defaultValues;

    useEffect(() => {
        if (customerToEdit) {
            setName(customerToEdit.name || '');
            setPhone(customerToEdit.phone || '');
            setEmail(customerToEdit.email || '');
            setAddress(customerToEdit.address || '');
        } else {
            setName('');
            setPhone('');
            setEmail('');
            setAddress('');
        }
        setErrors({});
    }, [customerToEdit]);

    const validateField = (field: string, value: string): string | undefined => {
        switch (field) {
            case 'name':
                return !value.trim() ? 'Customer name is required' : undefined;
            case 'email':
                if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                    return 'Please enter a valid email address';
                }
                return undefined;
            case 'phone':
                if (value && !/^[\d\s()+-]+$/.test(value)) {
                    return 'Please enter a valid phone number';
                }
                return undefined;
            default:
                return undefined;
        }
    };

    const validate = () => {
        const newErrors: FormErrors = {};
        const nameError = validateField('name', name);
        const emailError = validateField('email', email);
        const phoneError = validateField('phone', phone);
        
        if (nameError) newErrors.name = nameError;
        if (emailError) newErrors.email = emailError;
        if (phoneError) newErrors.phone = phoneError;
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleFieldBlur = (field: string, value: string) => {
        const error = validateField(field, value);
        setErrors(prev => ({ ...prev, [field]: error }));
    };

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        onSave({ 
            name: name.trim(), 
            phone: phone.trim() || undefined, 
            email: email.trim() || undefined, 
            address: address.trim() || undefined 
        });
    };

    return (
        <form onSubmit={handleFormSubmit} className="space-y-6">
            {/* Basic Information Section */}
            <div className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-medium">
                        Customer Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        onBlur={(e) => handleFieldBlur('name', e.target.value)}
                        placeholder="Enter customer name"
                        className={errors.name ? 'border-destructive focus-visible:ring-destructive' : ''}
                        disabled={isLoading}
                        required
                        aria-required="true"
                        aria-invalid={!!errors.name}
                        aria-describedby={errors.name ? 'name-error' : undefined}
                    />
                    {errors.name && (
                        <p id="name-error" className="text-sm text-destructive" role="alert">
                            {errors.name}
                        </p>
                    )}
                </div>
            </div>

            {/* Contact Information Section */}
            <div className="space-y-4">
                <h3 className="text-sm font-medium text-foreground">Contact Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="phone" className="text-sm font-medium">
                            Phone
                        </Label>
                        <Input
                            id="phone"
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            onBlur={(e) => handleFieldBlur('phone', e.target.value)}
                            placeholder="e.g. +1 (555) 123-4567"
                            className={errors.phone ? 'border-destructive focus-visible:ring-destructive' : ''}
                            disabled={isLoading}
                            aria-invalid={!!errors.phone}
                            aria-describedby={errors.phone ? 'phone-error' : undefined}
                        />
                        {errors.phone && (
                            <p id="phone-error" className="text-sm text-destructive" role="alert">
                                {errors.phone}
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email" className="text-sm font-medium">
                            Email
                        </Label>
                        <Input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            onBlur={(e) => handleFieldBlur('email', e.target.value)}
                            placeholder="customer@example.com"
                            className={errors.email ? 'border-destructive focus-visible:ring-destructive' : ''}
                            disabled={isLoading}
                            aria-invalid={!!errors.email}
                            aria-describedby={errors.email ? 'email-error' : undefined}
                        />
                        {errors.email && (
                            <p id="email-error" className="text-sm text-destructive" role="alert">
                                {errors.email}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Address Section */}
            <div className="space-y-2">
                <Label htmlFor="address" className="text-sm font-medium">
                    Address
                </Label>
                <Textarea
                    id="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Street address, city, state, postal code"
                    className="resize-none min-h-[80px]"
                    disabled={isLoading}
                    aria-label="Customer address"
                />
                <p className="text-xs text-muted-foreground">Optional: Physical or mailing address</p>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end pt-2 border-t">
                <Button type="submit" disabled={isLoading} aria-label={customerToEdit ? 'Update customer' : 'Add new customer'}>
                    {isLoading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                            Saving...
                        </>
                    ) : (
                        customerToEdit ? 'Update Customer' : 'Add Customer'
                    )}
                </Button>
            </div>
        </form>
    );
}
