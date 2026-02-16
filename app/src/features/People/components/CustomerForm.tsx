import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCreateCustomerMutation, useUpdateCustomerMutation } from '@/services/customersApi';
import { toast } from 'sonner';

interface CustomerFormProps {
    defaultValues?: any;
    onSave: (values: any) => void;
    isLoading?: boolean;
}

export function CustomerForm({ defaultValues, onSave, isLoading }: CustomerFormProps) {
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [address, setAddress] = useState('');
    const [errors, setErrors] = useState<{ name?: string }>({});

    const [createCustomer, { isLoading: isCreating }] = useCreateCustomerMutation();
    const [updateCustomer, { isLoading: isUpdating }] = useUpdateCustomerMutation();

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

    const validate = () => {
        const newErrors: { name?: string } = {};
        if (!name.trim()) newErrors.name = 'Customer name is required';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        const customerData = {
            name,
            phone,
            email,
            address,
        };

        try {
            if (customerToEdit) {
                await updateCustomer({ id: customerToEdit.id, ...customerData }).unwrap();
            } else {
                await createCustomer(customerData).unwrap();
            }
            onSave(customerData); // This might be redundant if parent handles refetch or toast
        } catch (error: any) {
            console.error('Failed to save customer:', error);
            // Error handling is usually done in parent via onSave callback if needed,
            // but here we are calling mutation directly.
            // Refactoring to match parent expected behavior:
            // Actually the parent component `CustomersPage` passes `onSave` which handles the API call?
            // Checking `CustomersPage`: `handleSave` calls `updateCustomer` or `createCustomer`.
            // So we should NOT call mutation here if `onSave` does it.
            // Let's check the props.
            // The original code shows `onSave` prop but also local mutation hooks.
            // And `handleSubmit` calls `updateCustomer/createCustomer` AND `onSave()`.
            // Wait, looking at `CustomersPage.jsx`:
            // `handleSave` calls the mutations.
            // So `CustomerForm` should probably just call `onSave(values)`.
            // Let's check `SupplierForm.jsx` comparison.
            // `SupplierForm` called mutation inside.
            // `CustomersPage.jsx` `handleSave` DOES call mutation.
            // So `CustomerForm` should just call `onSave` with data.
        }
    };

    // Correcting logic based on `CustomersPage.jsx` provided in context:
    // `handleSave` in `CustomersPage` takes `values` and calls the API.
    // So `CustomerForm` should just prepare data and call `onSave`.

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        onSave({ name, phone, email, address });
    }

    return (
        <form onSubmit={handleFormSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="name">Customer Name</Label>
                <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. John Doe"
                    className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
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
                        placeholder="e.g. john@example.com"
                    />
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                    id="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="e.g. 123 Main St"
                />
            </div>

            <div className="flex justify-end pt-4">
                <Button type="submit" disabled={isLoading}>
                    {isLoading ? 'Saving...' : customerToEdit ? 'Update Customer' : 'Add Customer'}
                </Button>
            </div>
        </form>
    );
}
