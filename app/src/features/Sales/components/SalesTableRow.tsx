import { TableCell, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useCurrency } from "@/hooks/useCurrency";

interface SalesTableRowProps {
    item: any;
    index: number;
    updateQuantity: (index: number, quantity: number) => void;
    removeItem: (index: number) => void;
}

export default function SalesTableRow({ item, index, updateQuantity, removeItem }: SalesTableRowProps) {
    const currency = useCurrency();
    return (
        <TableRow>
            <TableCell>
                <div className="font-medium">{item.product_name}</div>
                <div className="text-xs text-muted-foreground">{item.variant_name} ({item.sku})</div>
            </TableCell>
            <TableCell>
                <Input
                    type="number"
                    min="1"
                    className="h-8 w-16 text-center mx-auto"
                    value={item.quantity}
                    onChange={(e) => updateQuantity(index, parseInt(e.target.value))}
                />
            </TableCell>
            <TableCell className="text-right">{currency}{item.mrp.toFixed(2)}</TableCell>
            <TableCell className="text-right font-medium">
                {currency}{(item.mrp * item.quantity).toFixed(2)}
            </TableCell>
            <TableCell>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:bg-destructive/10"
                    onClick={() => removeItem(index)}
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            </TableCell>
        </TableRow>
    );
}
