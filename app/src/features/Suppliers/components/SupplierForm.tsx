import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Supplier, useCreateSupplierMutation, useUpdateSupplierMutation, useGetPaymentPoliciesQuery, useCreatePaymentPolicyMutation } from '@/services/suppliersApi';
import { toast } from 'sonner';
import { Loader2, Plus } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';

interface SupplierFormProps {
    supplier?: Supplier | null;
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
    const [gstin, setGstin] = useState('');
    const [paymentPolicyId, setPaymentPolicyId] = useState<string>(supplier?.payment_policy_id ? String(supplier.payment_policy_id) : '1');
    const [errors, setErrors] = useState<FormErrors>({});

    const [isPolicyModalOpen, setIsPolicyModalOpen] = useState(false);
    const [newPolicyName, setNewPolicyName] = useState('');
    const [newPolicyDays, setNewPolicyDays] = useState<number | ''>(0);

    const { data: paymentPolicies = [], isLoading: isLoadingPolicies } = useGetPaymentPoliciesQuery();
    const [createPaymentPolicy, { isLoading: isCreatingPolicy }] = useCreatePaymentPolicyMutation();

    const [createSupplier, { isLoading: isCreating }] = useCreateSupplierMutation();
    const [updateSupplier, { isLoading: isUpdating }] = useUpdateSupplierMutation();

    useEffect(() => {
        if (supplier) {
            setName(supplier.name || '');
            setContactPerson(supplier.contact_person || '');
            setPhone(supplier.phone || '');
            setEmail(supplier.email || '');
            setAddress(supplier.address || '');
            setGstin(supplier.gstin || '');
            const policyId = supplier.payment_policy_id != null ? String(supplier.payment_policy_id) : '1';
            setPaymentPolicyId(policyId);
        } else {
            setName('');
            setContactPerson('');
            setPhone('');
            setEmail('');
            setAddress('');
            setGstin('');
            setPaymentPolicyId('1');
        }
        setErrors({});
    }, [supplier]);

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
            gstin: gstin.trim() || undefined,
            payment_policy_id: paymentPolicyId ? Number(paymentPolicyId) : undefined,
        };

        try {
            if (supplier) {
                await updateSupplier({ id: supplier.id, ...supplierData }).unwrap();
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

    const handleCreatePolicy = async (e: React.FormEvent) => {
        e.preventDefault();
        e.stopPropagation(); // prevent triggering outer form submission

        if (!newPolicyName.trim() || newPolicyDays === '') {
            toast.error("Please fill required policy fields");
            return;
        }

        try {
            const result = await createPaymentPolicy({
                name: newPolicyName.trim(),
                days_to_pay: Number(newPolicyDays),
            }).unwrap();
            toast.success(`Payment Policy created successfully`);
            setPaymentPolicyId(String(result.id));
            setIsPolicyModalOpen(false);
            setNewPolicyName('');
            setNewPolicyDays(0);
        } catch (error: any) {
            console.error('Failed to create payment policy:', error);
            const errorMessage = error?.data?.error || 'Failed to create payment policy';
            toast.error(errorMessage);
        }
    };

    const isSaving = isCreating || isUpdating;
    const isLoading = isSaving;
    const isFetchingPolicies = isLoadingPolicies;

    return (
        <>
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
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                            onBlur={(e: React.FocusEvent<HTMLInputElement>) => handleFieldBlur('name', e.target.value)}
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
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setContactPerson(e.target.value)}
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
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPhone(e.target.value)}
                                onBlur={(e: React.FocusEvent<HTMLInputElement>) => handleFieldBlur('phone', e.target.value)}
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
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                                onBlur={(e: React.FocusEvent<HTMLInputElement>) => handleFieldBlur('email', e.target.value)}
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

                {/* Tax Information Section */}
                <div className="space-y-4 pt-2">
                    <h3 className="text-sm font-medium text-foreground">Tax Information</h3>
                    <div className="space-y-2">
                        <Label htmlFor="gstin" className="text-sm font-medium">
                            GSTIN
                        </Label>
                        <Input
                            id="gstin"
                            value={gstin}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setGstin(e.target.value)}
                            placeholder="Tax Identification Number (GSTIN)"
                            disabled={isLoading}
                            aria-label="GSTIN"
                        />
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
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setAddress(e.target.value)}
                        placeholder="Street address, city, state, postal code"
                        className="resize-none min-h-[80px]"
                        disabled={isLoading}
                        aria-label="Supplier address"
                    />
                    <p className="text-xs text-muted-foreground">Optional: Physical or mailing address</p>
                </div>

                {/* Payment Policy Section */}
                <div className="space-y-4 pt-2">
                    <h3 className="text-sm font-medium text-foreground">Payment Policy</h3>
                    <div className="flex gap-2 items-end">
                        <div className="flex-1 space-y-2">
                            <Label htmlFor="payment_policy_id" className="text-sm font-medium">
                                Select Payment Policy
                            </Label>
                            <Select
                                value={paymentPolicyId}
                                onValueChange={setPaymentPolicyId}
                                disabled={isLoading}
                            >
                                <SelectTrigger id="payment_policy_id" aria-label="Select Payment Policy" className="relative">
                                    <SelectValue placeholder="Select a payment policy">
                                        {paymentPolicies.find(p => String(p.id) === paymentPolicyId)?.name ||
                                            (supplier?.payment_policy_id != null && String(supplier.payment_policy_id) === paymentPolicyId
                                                ? supplier.payment_policy_name
                                                : (isFetchingPolicies ? 'Loading policies...' : (paymentPolicyId === '1' ? 'Pay when received' : '')))
                                        }
                                    </SelectValue>
                                    {isFetchingPolicies && <Loader2 className="absolute right-8 w-3 h-3 animate-spin text-muted-foreground" />}
                                </SelectTrigger>
                                <SelectContent>
                                    {/* Phantom item to allow Radix Select to resolve the value even while list is loading */}
                                    {paymentPolicyId && !paymentPolicies.find(p => String(p.id) === paymentPolicyId) && (
                                        <SelectItem value={paymentPolicyId} className="hidden">
                                            {supplier?.payment_policy_name || (paymentPolicyId === '1' ? 'Pay when received' : 'Loading...')}
                                        </SelectItem>
                                    )}
                                    {paymentPolicies.map(policy => (
                                        <SelectItem key={policy.id} value={String(policy.id)}>
                                            {policy.name} ({policy.days_to_pay} Days)
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            className="mb-[1px]"
                            onClick={() => setIsPolicyModalOpen(true)}
                            disabled={isLoading}
                        >
                            <Plus className="w-4 h-4 mr-1" /> New
                        </Button>
                    </div>
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
                    <Button type="submit" disabled={isLoading} aria-label={supplier ? 'Update supplier' : 'Add new supplier'}>
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                                Saving...
                            </>
                        ) : (
                            supplier ? 'Update Supplier' : 'Add Supplier'
                        )}
                    </Button>
                </div>
            </form>

            {/* Create Policy Dialog */}
            <Dialog open={isPolicyModalOpen} onOpenChange={setIsPolicyModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create Payment Policy</DialogTitle>
                        <DialogDescription>
                            Add a new payment policy to your system.
                        </DialogDescription>
                    </DialogHeader>
                    <form id="create-policy-form" onSubmit={handleCreatePolicy} className="space-y-4 mt-4">
                        <div className="space-y-2">
                            <Label htmlFor="policy-name">Policy Name <span className="text-destructive">*</span></Label>
                            <Input
                                id="policy-name"
                                value={newPolicyName}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPolicyName(e.target.value)}
                                required
                                disabled={isCreatingPolicy}
                                placeholder="e.g. Net 30"
                                autoFocus
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="policy-days">Days to Pay <span className="text-destructive">*</span></Label>
                            <Input
                                id="policy-days"
                                type="number"
                                min="0"
                                value={newPolicyDays}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPolicyDays(e.target.value === '' ? '' : Number(e.target.value))}
                                required
                                disabled={isCreatingPolicy}
                            />
                        </div>
                        <DialogFooter className="pt-4">
                            <DialogClose asChild>
                                <Button type="button" variant="outline" disabled={isCreatingPolicy}>Cancel</Button>
                            </DialogClose>
                            <Button type="submit" disabled={isCreatingPolicy}>
                                {isCreatingPolicy ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                                Save Policy
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}
