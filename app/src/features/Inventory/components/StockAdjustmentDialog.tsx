import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Loader2, Package, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import { MANUAL_INVENTORY_REASONS, INVENTORY_REASON_LABELS, INVENTORY_REASONS } from '@shared/index';

import { useDispatch } from 'react-redux';
import { productsApi } from '@/services/productsApi';
import { variantsApi } from '@/services/variantsApi';

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
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
import { useCreateAdjustmentMutation } from '@/services/inventoryApi';
import { Badge } from '@/components/ui/badge';

interface StockAdjustmentDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    variantId: number;
    currentStock: number;
    productName: string;
    variantName: string;
    sku?: string;
    threshold?: number;
}

export default function StockAdjustmentDialog({
    open,
    onOpenChange,
    variantId,
    currentStock,
    productName,
    variantName,
    sku,
    threshold = 10
}: StockAdjustmentDialogProps) {
    const dispatch = useDispatch();
    const [createAdjustment, { isLoading }] = useCreateAdjustmentMutation();
    const [adjustmentType, setAdjustmentType] = useState<'set' | 'adjust'>('adjust');
    const [quantityChange, setQuantityChange] = useState('');
    const [newStock, setNewStock] = useState(currentStock.toString());
    const [reason, setReason] = useState<string>(INVENTORY_REASONS.CORRECTION);

    // Reset form when dialog opens
    useEffect(() => {
        if (open) {
            setAdjustmentType('adjust');
            setQuantityChange('');
            setNewStock(currentStock.toString());
            setReason(INVENTORY_REASONS.CORRECTION);
        }
    }, [open, currentStock]);

    const calculatedNewStock = adjustmentType === 'adjust'
        ? currentStock + (parseInt(quantityChange) || 0)
        : parseInt(newStock) || 0;

    const diff = calculatedNewStock - currentStock;
    const isIncrease = diff > 0;
    const isDecrease = diff < 0;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (diff === 0) {
            toast.info('No change in stock quantity');
            return;
        }

        try {
            // ARCHITECTURAL DEBT: User ID should come from auth context/store
            // The inventory module should NOT be responsible for auth state management
            // This is a cross-cutting concern that should be injected via context
            const userId = 1; // TODO: Replace with useAuth() hook or Redux auth selector

            await createAdjustment({
                variantId,
                quantityChange: diff,
                reason,
                userId
            }).unwrap();

            dispatch(productsApi.util.invalidateTags([{ type: 'Variant', id: variantId }, { type: 'Variant', id: 'LIST' }]));
            dispatch(variantsApi.util.invalidateTags([{ type: 'Variant', id: variantId }, { type: 'Variant', id: 'LIST' }, 'VariantStats']));

            toast.success(`Stock updated successfully: ${currentStock} → ${calculatedNewStock}`);
            onOpenChange(false);
        } catch (error: any) {
            console.error('Failed to adjust stock:', error);
            toast.error(error.data?.error || 'Failed to update stock');
        }
    };

    const getStockStatus = (stock: number) => {
        if (stock <= 0) return { label: 'Out of Stock', variant: 'destructive' as const };
        if (stock <= threshold) return { label: 'Low Stock', variant: 'default' as const, className: 'bg-orange-500 hover:bg-orange-600 text-white' };
        return { label: 'In Stock', variant: 'default' as const, className: 'bg-green-600 hover:bg-green-700 text-white' };
    };

    const currentStatus = getStockStatus(currentStock);
    const newStatus = getStockStatus(calculatedNewStock);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]" aria-describedby="stock-adjustment-description">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Package className="h-5 w-5 text-primary" />
                        Adjust Stock Level
                    </DialogTitle>
                    <DialogDescription id="stock-adjustment-description">
                        Update inventory quantity for this product variant
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Product Info */}
                    <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                            <div className="space-y-1 flex-1 min-w-0">
                                <p className="font-semibold text-sm text-foreground truncate">
                                    {productName} {variantName && `• ${variantName}`}
                                </p>
                                {sku && (
                                    <p className="text-xs text-muted-foreground font-mono">SKU: {sku}</p>
                                )}
                            </div>
                            <Badge {...currentStatus} className={currentStatus.className}>
                                {currentStatus.label}
                            </Badge>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t">
                            <span className="text-sm text-muted-foreground">Current Stock</span>
                            <span className="text-2xl font-bold tabular-nums">{currentStock}</span>
                        </div>
                    </div>

                    {/* Adjustment Type Toggle */}
                    <div className="space-y-2">
                        <Label>Adjustment Method</Label>
                        <div className="grid grid-cols-2 gap-2">
                            <Button
                                type="button"
                                variant={adjustmentType === 'adjust' ? 'default' : 'outline'}
                                onClick={() => setAdjustmentType('adjust')}
                                className="w-full"
                            >
                                Add/Remove
                            </Button>
                            <Button
                                type="button"
                                variant={adjustmentType === 'set' ? 'default' : 'outline'}
                                onClick={() => setAdjustmentType('set')}
                                className="w-full"
                            >
                                Set Exact
                            </Button>
                        </div>
                    </div>

                    {/* Quantity Input */}
                    <div className="space-y-2">
                        <Label htmlFor="quantity">
                            {adjustmentType === 'adjust' ? 'Quantity Change' : 'New Stock Level'}
                        </Label>
                        {adjustmentType === 'adjust' ? (
                            <div className="relative">
                                <Input
                                    id="quantity"
                                    type="number"
                                    value={quantityChange}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuantityChange(e.target.value)}
                                    placeholder="e.g., 10 or -5"
                                    className="text-lg font-semibold tabular-nums pr-10"
                                    autoFocus
                                    aria-describedby="quantity-help"
                                />
                                {isIncrease && (
                                    <TrendingUp className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-green-600" aria-hidden="true" />
                                )}
                                {isDecrease && (
                                    <TrendingDown className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-red-600" aria-hidden="true" />
                                )}
                            </div>
                        ) : (
                            <Input
                                id="quantity"
                                type="number"
                                value={newStock}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewStock(e.target.value)}
                                placeholder="Enter new stock level"
                                className="text-lg font-semibold tabular-nums"
                                autoFocus
                                aria-describedby="quantity-help"
                            />
                        )}
                        <p id="quantity-help" className="text-xs text-muted-foreground">
                            {adjustmentType === 'adjust'
                                ? 'Use positive numbers to add stock, negative to remove'
                                : 'Enter the exact stock quantity you want to set'}
                        </p>
                    </div>

                    {/* Reason */}
                    <div className="space-y-2">
                        <Label htmlFor="reason">Reason for Adjustment</Label>
                        <Select value={reason} onValueChange={setReason}>
                            <SelectTrigger id="reason" aria-label="Select reason for stock adjustment">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {MANUAL_INVENTORY_REASONS.map(r => (
                                    <SelectItem key={r} value={r}>
                                        {INVENTORY_REASON_LABELS[r]}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Preview */}
                    {diff !== 0 && (
                        <div className="rounded-lg border bg-primary/5 border-primary/20 p-4 space-y-3">
                            <div className="flex items-center gap-2 text-sm font-medium">
                                <AlertCircle className="h-4 w-4 text-primary" />
                                <span>Preview Changes</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Current Stock</span>
                                <span className="font-mono font-semibold">{currentStock}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Change</span>
                                <span className={`font-mono font-semibold ${isIncrease ? 'text-green-600' : 'text-red-600'}`}>
                                    {isIncrease ? '+' : ''}{diff}
                                </span>
                            </div>
                            <div className="flex items-center justify-between pt-2 border-t">
                                <span className="font-medium">New Stock</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-xl font-bold tabular-nums">{calculatedNewStock}</span>
                                    {currentStatus.label !== newStatus.label && (
                                        <Badge {...newStatus} className={newStatus.className}>
                                            {newStatus.label}
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isLoading}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isLoading || diff === 0}
                        >
                            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                            {isLoading ? 'Updating...' : 'Confirm Adjustment'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
