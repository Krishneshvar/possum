import { useState } from 'react';
import { Edit3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import StockAdjustmentDialog from './StockAdjustmentDialog';

interface StockAdjustmentCellProps {
    variantId: number;
    originalStock: number;
    productName: string;
    variantName: string;
    sku?: string;
    threshold?: number;
}

export default function StockAdjustmentCell({
    variantId,
    originalStock,
    productName,
    variantName,
    sku,
    threshold = 10
}: StockAdjustmentCellProps) {
    const [dialogOpen, setDialogOpen] = useState(false);

    const stock = originalStock;
    const isLow = stock <= threshold && stock > 0;
    const isOut = stock <= 0;

    return (
        <>
            <div className="flex items-center justify-end gap-2">
                <span
                    className={`text-lg font-bold tabular-nums ${
                        isOut ? 'text-destructive' : isLow ? 'text-orange-500' : 'text-foreground'
                    }`}
                >
                    {stock}
                </span>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => setDialogOpen(true)}
                            className="h-7 w-7 opacity-60 hover:opacity-100"
                            aria-label={`Adjust stock for ${productName} ${variantName}`}
                        >
                            <Edit3 className="h-3.5 w-3.5" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Adjust stock level</p>
                    </TooltipContent>
                </Tooltip>
            </div>

            <StockAdjustmentDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                variantId={variantId}
                currentStock={originalStock}
                productName={productName}
                variantName={variantName}
                sku={sku}
                threshold={threshold}
            />
        </>
    );
}
