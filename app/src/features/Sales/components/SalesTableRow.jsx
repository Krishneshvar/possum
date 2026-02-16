import React, { memo } from "react";
import { TableRow, TableCell } from "@/components/ui/table";
import { Input } from "@/components/ui/input";

const SalesTableRow = memo(({
    item,
    index,
    updateQuantity,
    updatePrice,
    updateDiscount,
    currency,
    qtyRefs,
    priceRefs,
    discountRefs,
    onQtyKeyDown,
    onPriceKeyDown,
    onDiscountKeyDown
}) => {
    return (
        <TableRow
            data-row-id={item.id}
            className="border-border hover:bg-muted/50 transition-colors group"
        >
            <TableCell
                tabIndex={0}
                data-grid-cell
                className="text-center font-medium text-muted-foreground text-xs sticky left-0 z-20 bg-background shadow-[1px_0_0_0_hsl(var(--border))] border-r border-border focus:ring-2 focus:ring-inset focus:ring-primary focus:z-50 focus:outline-none"
            >
                {index + 1}
            </TableCell>
            <TableCell
                tabIndex={0}
                data-grid-cell
                className="border-r border-border focus:ring-2 focus:ring-inset focus:ring-primary focus:z-50 focus:outline-none"
            >
                <div className="font-medium text-foreground">{item.name}</div>
                <div className="text-xs text-muted-foreground">{item.sku || 'SKU-000'}</div>
            </TableCell>
            <TableCell
                className="border-r border-border focus-within:ring-2 focus-within:ring-inset focus-within:ring-primary focus-within:z-50 focus-within:outline-none p-0"
            >
                <div className="flex items-center justify-center h-full w-full">
                    <Input
                        ref={(el) => {
                            if (qtyRefs && qtyRefs.current) {
                                qtyRefs.current[item.id] = el;
                            }
                        }}
                        data-row-id={item.id}
                        type="text"
                        value={item.quantity || ''}
                        onChange={(e) => {
                            const val = e.target.value;
                            if (val === "" || /^\d+$/.test(val)) {
                                updateQuantity(item.id, val === "" ? "" : parseInt(val));
                            }
                        }}
                        onKeyDown={(e) => onQtyKeyDown(e, item.id)}
                        className="w-full h-12 text-center bg-transparent border-none focus-visible:ring-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none transition-colors"
                    />
                </div>
            </TableCell>
            <TableCell
                className="text-right font-medium border-r border-border focus-within:ring-2 focus-within:ring-inset focus-within:ring-primary focus-within:z-50 focus-within:outline-none p-0"
            >
                <div className="flex items-center justify-end h-full w-full px-2 gap-1">
                    <span className="text-muted-foreground text-xs">{currency}</span>
                    <Input
                        ref={(el) => {
                            if (priceRefs && priceRefs.current) {
                                priceRefs.current[item.id] = el;
                            }
                        }}
                        data-row-id={item.id}
                        type="text"
                        value={item.price || ''}
                        onChange={(e) => {
                            const val = e.target.value;
                            if (val === "" || /^\d*\.?\d*$/.test(val)) {
                                updatePrice(item.id, val === "" ? "" : parseFloat(val));
                            }
                        }}
                        onKeyDown={(e) => onPriceKeyDown(e, item.id)}
                        className="w-full h-12 border-none p-0 text-right bg-transparent focus-visible:ring-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                </div>
            </TableCell>
            <TableCell
                tabIndex={0}
                data-grid-cell
                className="text-right font-medium text-muted-foreground border-r border-border focus:ring-2 focus:ring-inset focus:ring-primary focus:z-50 focus:outline-none"
            >
                {currency}{(parseFloat(item.mrp) || 0).toFixed(2)}
            </TableCell>
            <TableCell
                className="text-right font-medium border-r border-border focus-within:ring-2 focus-within:ring-inset focus-within:ring-primary focus-within:z-50 focus-within:outline-none p-0"
            >
                <div className="flex items-center justify-end h-full w-full px-2 gap-1">
                    <span className="text-muted-foreground text-xs">{currency}</span>
                    <Input
                        ref={(el) => {
                            if (discountRefs && discountRefs.current) {
                                discountRefs.current[item.id] = el;
                            }
                        }}
                        data-row-id={item.id}
                        type="text"
                        value={item.discount || ''}
                        onChange={(e) => {
                            const val = e.target.value;
                            if (val === "" || /^\d*\.?\d*$/.test(val)) {
                                updateDiscount(item.id, val === "" ? "" : parseFloat(val));
                            }
                        }}
                        onKeyDown={(e) => onDiscountKeyDown(e, item.id)}
                        className="w-full h-12 border-none p-0 text-right bg-transparent focus-visible:ring-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                </div>
            </TableCell>
            <TableCell
                tabIndex={0}
                data-grid-cell
                className="text-right font-bold text-foreground focus:ring-2 focus:ring-inset focus:ring-primary focus:z-50 focus:outline-none"
            >
                {currency}{(((parseFloat(item.price) || 0) * (parseInt(item.quantity) || 0)) - (parseFloat(item.discount) || 0)).toFixed(2)}
            </TableCell>
        </TableRow>
    );
});

SalesTableRow.displayName = "SalesTableRow";

export default SalesTableRow;
