import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCreateSupplierMutation, useUpdateSupplierMutation } from '@/services/suppliersApi';
import { toast } from 'sonner';

interface SupplierFormProps {
    supplier?: any;
    onSuccess: () => void;
    onCancel?: () => void;
}

export function SupplierForm({ supplier, onSuccess, onCancel }: SupplierFormProps) {
    const [name, setName] = useState('');
    const [contactPerson, setContactPerson] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [errors, setErrors] = useState<{ name?: string }>({});

    const [createSupplier, { isLoading: isCreating }] = useCreateSupplierMutation();
    const [updateSupplier, { isLoading: isUpdating }] = useUpdateSupplierMutation();

    const supplierToEdit = supplier;

    useEffect(() => {
        if (supplierToEdit) {
            setName(supplierToEdit.name || '');
            setContactPerson(supplierToEdit.contact_person || '');
            setPhone(supplierToEdit.phone || '');
            setEmail(supplierToEdit.email || '');
        } else {
            setName('');
            setContactPerson('');
            setPhone('');
            setEmail('');
        }
        setErrors({});
    }, [supplierToEdit]);

    const validate = () => {
        const newErrors: { name?: string } = {};
        if (!name.trim()) newErrors.name = 'Supplier name is required';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        const supplierData = {
            name,
            contact_person: contactPerson,
            phone,
            email,
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
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="name">Supplier Name</Label>
                <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Acme Corp"
                    className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
            </div>

            <div className="space-y-2">
                <Label htmlFor="contactPerson">Contact Person</Label>
                <Input
                    id="contactPerson"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    placeholder="e.g. John Doe"
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                        id="phone"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="e.g. 555-0123"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="e.g. contact@acme.com"
                    />
                </div>
            </div>

            <div className="flex justify-end pt-4">
                <Button type="submit" disabled={isLoading}>
                    {isLoading ? 'Saving...' : supplierToEdit ? 'Update Supplier' : 'Add Supplier'}
                </Button>
            </div>
        </form>
    );
}
