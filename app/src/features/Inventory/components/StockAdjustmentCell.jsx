import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Plus, Minus, Check, AlertCircle } from 'lucide-react';
import { useCreateAdjustmentMutation } from '@/services/productsApi';
import { toast } from 'sonner';

export default function StockAdjustmentCell({
    variantId,
    originalStock,
    productName,
    variantName
}) {
    const [currentStock, setCurrentStock] = useState(originalStock);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [reason, setReason] = useState('');

    const [createAdjustment, { isLoading }] = useCreateAdjustmentMutation();

    // Reset local state if data from server changes (e.g. fresh fetch)
    useEffect(() => {
        setCurrentStock(originalStock);
    }, [originalStock]);

    const hasChanged = currentStock !== originalStock;
    const difference = currentStock - originalStock;

    const handleCreateAdjustment = async () => {
        if (!reason) {
            toast.error("Please select a reason for the adjustment");
            return;
        }

        try {
            await createAdjustment({
                variantId,
                quantityChange: difference,
                reason,
                userId: 1 // TODO: Get from auth context
            }).unwrap();

            toast.success("Stock updated successfully");
            setIsModalOpen(false);
            setReason('');
            // currentStock will be updated via useEffect when the query invalidates and refetches
        } catch (err) {
            console.error("Failed to adjust stock:", err);
            toast.error(err?.data?.error || "Failed to update stock");
        }
    };

    const reasons = difference > 0
        ? [
            { value: 'correction', label: 'Correction (Found Extra)' },
            { value: 'return', label: 'Start Return' }, // Usually returns are handled via specific flow, but simplified here
            { value: 'confirm_receive', label: 'Received (Manual)' },
        ]
        : [
            { value: 'correction', label: 'Correction (Lost/Missing)' },
            { value: 'damage', label: 'Damaged' },
            { value: 'spoilage', label: 'Spoiled' },
            { value: 'theft', label: 'Stolen' },
            { value: 'sale', label: 'Manual Sale (No Invoice)' },
        ];

    return (
        <div className="flex items-center justify-end gap-2">
            <div className="flex items-center border rounded-md shadow-sm bg-background">
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-r-none hover:bg-muted/50"
                    onClick={() => setCurrentStock(prev => Math.max(0, prev - 1))}
                    disabled={isLoading}
                >
                    <Minus className="h-3 w-3" />
                </Button>
                <Input
                    type="number"
                    value={currentStock}
                    onChange={(e) => {
                        const val = parseInt(e.target.value);
                        if (!isNaN(val) && val >= 0) {
                            setCurrentStock(val);
                        } else if (e.target.value === '') {
                            setCurrentStock('');
                        }
                    }}
                    onBlur={() => {
                        if (currentStock === '') setCurrentStock(originalStock);
                    }}
                    className="h-8 w-16 border-0 text-center focus-visible:ring-0 p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    disabled={isLoading}
                />
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-l-none hover:bg-muted/50"
                    onClick={() => setCurrentStock(prev => Number(prev || 0) + 1)}
                    disabled={isLoading}
                >
                    <Plus className="h-3 w-3" />
                </Button>
            </div>

            {hasChanged && (
                <>
                    <Button
                        size="sm"
                        className="h-8 px-3 animate-in fade-in zoom-in duration-200"
                        onClick={() => setIsModalOpen(true)}
                    >
                        Save
                    </Button>

                    <Dialog open={isModalOpen} onOpenChange={(open) => {
                        if (!open) setReason('');
                        setIsModalOpen(open);
                    }}>
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle>Confirm Stock Adjustment</DialogTitle>
                            </DialogHeader>

                            <div className="py-4 space-y-4">
                                <div className="flex items-center gap-4 p-4 border rounded-lg bg-muted/20">
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-muted-foreground">Product</p>
                                        <p className="text-sm font-semibold">{productName}</p>
                                        <p className="text-xs text-muted-foreground">{variantName}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-medium text-muted-foreground">Change</p>
                                        <p className={`text-lg font-bold ${difference > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {difference > 0 ? '+' : ''}{difference}
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Reason for adjustment</label>
                                    <Select value={reason} onValueChange={setReason}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a reason..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {reasons.map((r) => (
                                                <SelectItem key={r.value} value={r.value}>
                                                    {r.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <DialogFooter>
                                <Button variant="outline" onClick={() => {
                                    setIsModalOpen(false);
                                    setCurrentStock(originalStock); // Optional: reset on cancel? No, usually just close modal
                                }}>
                                    Cancel
                                </Button>
                                <Button onClick={handleCreateAdjustment} disabled={isLoading || !reason}>
                                    {isLoading ? 'Saving...' : 'Confirm'}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </>
            )}
        </div>
    );
}
