import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useGetProductsQuery } from '@/services/productsApi';
import { useCreateAdjustmentMutation } from '@/services/inventoryApi';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const ADJUSTMENT_REASONS = [
    { value: 'sale', label: 'Sale' },
    { value: 'return', label: 'Return' },
    { value: 'spoilage', label: 'Spoilage' },
    { value: 'damage', label: 'Damage' },
    { value: 'theft', label: 'Theft' },
    { value: 'correction', label: 'Correction' },
];

export function InventoryAdjustmentForm({ onSuccess, initialVariantId = '' }) {
    const { data: productsData } = useGetProductsQuery({ page: 1, limit: 1000 });
    const products = productsData?.products || [];

    const [createAdjustment, { isLoading }] = useCreateAdjustmentMutation();

    const [selectedProductId, setSelectedProductId] = useState('');
    const [selectedVariantId, setSelectedVariantId] = useState(initialVariantId);
    const [quantityChange, setQuantityChange] = useState('');
    const [reason, setReason] = useState('correction');

    const selectedProduct = useMemo(() =>
        products.find(p => p.id === parseInt(selectedProductId)),
        [products, selectedProductId]
    );

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedVariantId || !quantityChange || !reason) {
            toast.error('Please fill in all fields.');
            return;
        }

        try {
            await createAdjustment({
                variantId: parseInt(selectedVariantId),
                quantityChange: parseInt(quantityChange),
                reason
            }).unwrap();

            toast.success('Inventory adjusted successfully');
            onSuccess();
        } catch (error) {
            console.error('Failed to adjust inventory:', error);
            toast.error(error?.data?.error || 'Failed to adjust inventory');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label>Product</Label>
                <Select
                    value={selectedProductId}
                    onValueChange={(val) => {
                        setSelectedProductId(val);
                        setSelectedVariantId('');
                    }}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Select Product" />
                    </SelectTrigger>
                    <SelectContent>
                        {products.map(p => (
                            <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <Label>Variant</Label>
                <Select
                    value={selectedVariantId}
                    onValueChange={setSelectedVariantId}
                    disabled={!selectedProduct}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Select Variant" />
                    </SelectTrigger>
                    <SelectContent>
                        {selectedProduct?.variants?.map(v => (
                            <SelectItem key={v.id} value={String(v.id)}>
                                {v.sku} - {v.name || 'Default'}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="quantityChange">Quantity Change (+/-)</Label>
                    <Input
                        id="quantityChange"
                        type="number"
                        value={quantityChange}
                        onChange={(e) => setQuantityChange(e.target.value)}
                        placeholder="e.g. -5 or 10"
                    />
                </div>

                <div className="space-y-2">
                    <Label>Reason</Label>
                    <Select value={reason} onValueChange={setReason}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {ADJUSTMENT_REASONS.map(r => (
                                <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="flex justify-end pt-4">
                <Button type="submit" disabled={isLoading || !selectedVariantId}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Adjust Stock
                </Button>
            </div>
        </form>
    );
}
