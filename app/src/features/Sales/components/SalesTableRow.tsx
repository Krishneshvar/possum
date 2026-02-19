import { TableCell, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useCurrency } from "@/hooks/useCurrency";
import { type KeyboardEvent as ReactKeyboardEvent } from "react";

interface SalesTableRowProps {
    item: any;
    index: number;
    updateQuantity: (index: number, quantity: number) => void;
    updatePrice: (index: number, price: number) => void;
    updateDiscount: (index: number, updates: { discountType?: 'amount' | 'percentage'; discountValue?: number }) => void;
    removeItem: (index: number) => void;
    onCellArrowNav: (e: ReactKeyboardEvent<HTMLElement>, row: number, col: number) => void;
}

export default function SalesTableRow({
    item,
    index,
    updateQuantity,
    updatePrice,
    updateDiscount,
    removeItem,
    onCellArrowNav
}: SalesTableRowProps) {
    const currency = useCurrency();

    const rowIndex = index + 1;
    const lineSubtotal = item.pricePerUnit * item.quantity;
    const lineDiscount = item.discountType === 'percentage'
        ? (lineSubtotal * Math.max(0, Math.min(100, item.discountValue || 0))) / 100
        : Math.max(0, Math.min(lineSubtotal, item.discountValue || 0));
    const lineTotal = Math.max(0, lineSubtotal - lineDiscount);

    const handleRowKeyDown = (e: ReactKeyboardEvent<HTMLTableRowElement>) => {
        if (e.key === 'Delete') {
            e.preventDefault();
            removeItem(index);
        }
    };

    return (
        <TableRow onKeyDown={handleRowKeyDown}>
            <TableCell className="border border-border text-center font-medium tabular-nums">{index + 1}</TableCell>
            <TableCell className="border border-border">
                <div
                    tabIndex={0}
                    data-nav-row={rowIndex}
                    data-nav-col={1}
                    onKeyDown={(e) => onCellArrowNav(e, rowIndex, 1)}
                    className="outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm px-1"
                >
                    <div className="font-medium text-foreground">{item.product_name || item.name}</div>
                    <div className="text-xs text-muted-foreground">
                        {item.variant_name && <span>{item.variant_name} · </span>}
                        <span>{item.sku}</span>
                    </div>
                </div>
            </TableCell>
            <TableCell className="border border-border">
                <Input
                    type="number"
                    min="1"
                    max={item.maxStock}
                    className="h-9 w-16 text-center mx-auto"
                    value={item.quantity}
                    onChange={(e) => updateQuantity(index, parseInt(e.target.value, 10) || 1)}
                    aria-label={`Quantity for ${item.product_name || item.name}`}
                    data-nav-row={rowIndex}
                    data-nav-col={2}
                    onKeyDown={(e) => onCellArrowNav(e, rowIndex, 2)}
                />
            </TableCell>
            <TableCell className="border border-border">
                <Input
                    type="number"
                    min="1"
                    max={item.mrp}
                    className="h-9 text-right"
                    value={item.pricePerUnit}
                    onChange={(e) => updatePrice(index, parseFloat(e.target.value))}
                    aria-label={`Price for ${item.product_name || item.name}`}
                    data-nav-row={rowIndex}
                    data-nav-col={3}
                    onKeyDown={(e) => onCellArrowNav(e, rowIndex, 3)}
                />
            </TableCell>
            <TableCell className="border border-border">
                <div className="flex items-center gap-1">
                    <Input
                        type="number"
                        min="0"
                        max={item.discountType === 'percentage' ? 100 : lineSubtotal}
                        value={item.discountValue || 0}
                        onChange={(e) => updateDiscount(index, { discountValue: Math.max(0, parseFloat(e.target.value) || 0) })}
                        className="h-9 text-right flex-1 min-w-0"
                        aria-label={`Discount for ${item.product_name || item.name}`}
                        data-nav-row={rowIndex}
                        data-nav-col={4}
                        onKeyDown={(e) => onCellArrowNav(e, rowIndex, 4)}
                    />
                    <div className="flex shrink-0 rounded border border-border overflow-hidden">
                        <Button
                            type="button"
                            size="sm"
                            variant={item.discountType === 'amount' ? 'default' : 'ghost'}
                            className="h-9 rounded-none px-2 min-w-[32px]"
                            onClick={() => updateDiscount(index, { discountType: 'amount' })}
                            data-nav-row={rowIndex}
                            data-nav-col={4}
                            onKeyDown={(e) => onCellArrowNav(e, rowIndex, 4)}
                        >
                            {currency}
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            variant={item.discountType === 'percentage' ? 'default' : 'ghost'}
                            className="h-9 rounded-none border-l border-border px-2 min-w-[32px]"
                            onClick={() => updateDiscount(index, { discountType: 'percentage' })}
                            data-nav-row={rowIndex}
                            data-nav-col={4}
                            onKeyDown={(e) => onCellArrowNav(e, rowIndex, 4)}
                        >
                            %
                        </Button>
                    </div>
                </div>
            </TableCell>
            <TableCell className="border border-border text-right font-semibold tabular-nums">
                <span
                    tabIndex={0}
                    data-nav-row={rowIndex}
                    data-nav-col={5}
                    onKeyDown={(e) => onCellArrowNav(e, rowIndex, 5)}
                    className="outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm px-1"
                >
                    {currency}{lineTotal.toFixed(2)}
                </span>
            </TableCell>
        </TableRow>
    );
}
