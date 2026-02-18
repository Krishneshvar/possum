import { useState } from 'react';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { MANUAL_INVENTORY_REASONS, INVENTORY_REASON_LABELS, INVENTORY_REASONS } from '@shared/index';

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useCreateAdjustmentMutation } from '@/services/productsApi';

interface StockAdjustmentCellProps {
    variantId: number;
    originalStock: number;
    productName: string;
    variantName: string;
}

export default function StockAdjustmentCell({ variantId, originalStock, productName, variantName }: StockAdjustmentCellProps) {
    const [createAdjustment, { isLoading }] = useCreateAdjustmentMutation();
    const [isEditing, setIsEditing] = useState(false);
    const [newStock, setNewStock] = useState(originalStock.toString());
    const [reason, setReason] = useState<string>(INVENTORY_REASONS.CORRECTION);

    const handleSave = async () => {
        const diff = parseInt(newStock, 10) - originalStock;
        if (diff === 0) {
            setIsEditing(false);
            return;
        }

        try {
            await createAdjustment({
                variantId,
                quantityChange: diff,
                reason,
                userId: 1 // TODO: Get from auth
            }).unwrap();

            toast.success('Stock updated successfully');
            setIsEditing(false);
        } catch (error: any) {
            console.error('Failed to adjust stock:', error);
            toast.error(error.data?.error || 'Failed to update stock');
        }
    };

    if (isEditing) {
        return (
            <div className="flex flex-col gap-2 min-w-[180px] bg-background border p-2 rounded-md shadow-sm z-10 relative">
                <div className="flex items-center gap-2">
                    <Input
                        type="number"
                        value={newStock}
                        onChange={(e) => setNewStock(e.target.value)}
                        className="h-8 w-20 text-right font-mono"
                        autoFocus
                    />
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                        (Diff: {parseInt(newStock, 10) - originalStock})
                    </span>
                </div>
                <Select value={reason} onValueChange={setReason}>
                    <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {MANUAL_INVENTORY_REASONS.map(r => (
                            <SelectItem key={r} value={r}>{INVENTORY_REASON_LABELS[r]}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <div className="flex justify-end gap-2 mt-1">
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                            setNewStock(originalStock.toString());
                            setIsEditing(false);
                        }}
                        className="h-7 px-2 text-xs"
                    >
                        Cancel
                    </Button>
                    <Button
                        size="sm"
                        onClick={handleSave}
                        disabled={isLoading}
                        className="h-7 px-2 text-xs"
                    >
                        {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Save'}
                    </Button>
                </div>
            </div>
        );
    }

    const stock = originalStock;
    const isLow = stock <= 10 && stock > 0;
    const isOut = stock <= 0;

    return (
        <div
            className={`cursor-pointer group flex items-center justify-end gap-2 py-1 px-2 rounded-md transition-colors hover:bg-muted/50 ${isOut ? 'text-destructive font-bold' : isLow ? 'text-orange-500 font-medium' : 'text-foreground'}`}
            onClick={() => setIsEditing(true)}
            title="Click to adjust stock"
        >
            <span>{stock}</span>
            <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity bg-primary/10 px-1.5 py-0.5 rounded">
                Edit
            </span>
        </div>
    );
}
