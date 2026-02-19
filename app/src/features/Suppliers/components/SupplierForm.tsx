import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCreateSupplierMutation, useUpdateSupplierMutation } from '@/services/suppliersApi';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface SupplierFormProps {
    supplier?: any;
    onSuccess: () => void;
    onCancel?: () => void;
}

interface FormErrors {
    name?: string;
    email?: string;
    phone?: string;
}

export function SupplierForm({ supplier, onSuccess, onCancel }: SupplierFormProps) {
    const [name, setName] = useState('');
    const [contactPerson, setContactPerson] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [address, setAddress] = useState('');
    const [errors, setErrors] = useState<FormErrors>({});

    const [createSupplier, { isLoading: isCreating }] = useCreateSupplierMutation();
    const [updateSupplier, { isLoading: isUpdating }] = useUpdateSupplierMutation();

    const supplierToEdit = supplier;

    useEffect(() => {
        if (supplierToEdit) {
            setName(supplierToEdit.name || '');
            setContactPerson(supplierToEdit.contact_person || '');
            setPhone(supplierToEdit.phone || '');
            setEmail(supplierToEdit.email || '');
            setAddress(supplierToEdit.address || '');
        } else {
            setName('');
            setContactPerson('');
            setPhone('');
            setEmail('');
            setAddress('');
        }
        setErrors({});
    }, [supplierToEdit]);

    const validateField = (field: string, value: string): string | undefined => {
        switch (field) {
            case 'name':
                return !value.trim() ? 'Supplier name is required' : undefined;
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        const supplierData = {
            name: name.trim(),
            contact_person: contactPerson.trim() || undefined,
            phone: phone.trim() || undefined,
            email: email.trim() || undefined,
            address: address.trim() || undefined,
        };

        try {
            if (supplierToEdit) {
                await updateSupplier({ id: supplierToEdit.id, ...supplierData }).unwrap();
                toast.success(`Supplier "${name}" updated successfully`);
            } else {
                await createSupplier(supplierData).unwrap();
                toast.success(`Supplier "${name}" created successfully`);
            }
            onSuccess();
        } catch (error: any) {
            console.error('Failed to save supplier:', error);
            const errorMessage = error?.data?.error || 'Failed to save supplier';
            toast.error(errorMessage);
        }
    };

    const isLoading = isCreating || isUpdating;

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information Section */}
            <div className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-medium">
                        Supplier Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        onBlur={(e) => handleFieldBlur('name', e.target.value)}
                        placeholder="Enter supplier or company name"
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

                <div className="space-y-2">
                    <Label htmlFor="contactPerson" className="text-sm font-medium">
                        Contact Person
                    </Label>
                    <Input
                        id="contactPerson"
                        value={contactPerson}
                        onChange={(e) => setContactPerson(e.target.value)}
                        placeholder="Primary contact name"
                        disabled={isLoading}
                        aria-label="Contact person name"
                    />
                    <p className="text-xs text-muted-foreground">Optional: Name of the primary contact</p>
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
                            placeholder="contact@example.com"
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
                    aria-label="Supplier address"
                />
                <p className="text-xs text-muted-foreground">Optional: Physical or mailing address</p>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-3 pt-2 border-t">
                {onCancel && (
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onCancel}
                        disabled={isLoading}
                        aria-label="Cancel and close form"
                    >
                        Cancel
                    </Button>
                )}
                <Button type="submit" disabled={isLoading} aria-label={supplierToEdit ? 'Update supplier' : 'Add new supplier'}>
                    {isLoading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                            Saving...
                        </>
                    ) : (
                        supplierToEdit ? 'Update Supplier' : 'Add Supplier'
                    )}
                </Button>
            </div>
        </form>
    );
}
