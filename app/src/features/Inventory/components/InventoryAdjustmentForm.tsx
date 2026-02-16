import { useState } from 'react';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useCreateAdjustmentMutation } from '@/services/productsApi';

interface InventoryAdjustmentFormProps {
    variants: any[];
    onSuccess: () => void;
}

const ADJUSTMENT_REASONS = [
    { value: 'correction', label: 'Correction' },
    { value: 'damage', label: 'Damage' },
    { value: 'theft', label: 'Theft' },
    { value: 'spoilage', label: 'Spoilage' },
    { value: 'return', label: 'Return' },
];

export default function InventoryAdjustmentForm({ variants, onSuccess }: InventoryAdjustmentFormProps) {
    const [createAdjustment, { isLoading }] = useCreateAdjustmentMutation();
    const [selectedVariantId, setSelectedVariantId] = useState('');
    const [quantityChange, setQuantityChange] = useState('');
    const [reason, setReason] = useState('correction');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await createAdjustment({
                variantId: Number(selectedVariantId),
                quantityChange: Number(quantityChange),
                reason,
                userId: 1 // TODO: Get from auth
            }).unwrap();

            toast.success('Stock updated successfully');
            setQuantityChange('');
            setReason('correction');
            setSelectedVariantId('');
            onSuccess();
        } catch (error: any) {
            console.error('Failed to adjust stock:', error);
            toast.error(error.data?.error || 'Failed to update stock');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="variant">Variant</Label>
                    <Select value={selectedVariantId} onValueChange={setSelectedVariantId}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select a variant" />
                        </SelectTrigger>
                        <SelectContent>
                            {variants.map(v => (
                                <SelectItem key={v.id} value={String(v.id)}>
                                    {v.product_name} - {v.name} (SKU: {v.sku})
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="quantity">Quantity Change</Label>
                    <Input
                        type="number"
                        id="quantity"
                        value={quantityChange}
                        onChange={(e) => setQuantityChange(e.target.value)}
                        placeholder="+5 or -3"
                    />
                    <p className="text-xs text-muted-foreground">Use negative for reduction</p>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="reason">Reason</Label>
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
