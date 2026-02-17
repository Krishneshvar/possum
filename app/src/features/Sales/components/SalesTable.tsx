import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Package } from "lucide-react";
import SalesTableRow from "./SalesTableRow";
import { useCurrency } from "@/hooks/useCurrency";

interface SalesTableProps {
    items: any[];
    updateQuantity: (index: number, quantity: number) => void;
    removeItem: (index: number) => void;
    total: number;
}

export default function SalesTable({ items, updateQuantity, removeItem, total }: SalesTableProps) {
    const currency = useCurrency();
    return (
        <div className="flex-1 border rounded-md overflow-hidden flex flex-col bg-background shadow-sm">
            <div className="overflow-auto flex-1 max-h-[400px]">
                <Table>
                    <TableHeader className="bg-muted sticky top-0 z-10">
                        <TableRow>
                            <TableHead>Product</TableHead>
                            <TableHead className="w-[100px] text-center">Qty</TableHead>
                            <TableHead className="text-right">Price</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {items.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-48 text-center text-muted-foreground">
                                    <div className="flex flex-col items-center gap-2">
                                        <Package className="h-8 w-8 opacity-20" />
                                        <p>Cart is empty</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            items.map((item, index) => (
                                <SalesTableRow
                                    key={`${item.id}-${index}`}
                                    item={item}
                                    index={index}
                                    updateQuantity={updateQuantity}
                                    removeItem={removeItem}
                                />
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
            <div className="p-4 bg-muted/30 border-t flex justify-between items-center">
                <span className="font-semibold text-lg text-muted-foreground">Subtotal</span>
                <span className="font-bold text-2xl text-foreground">{currency}{total.toFixed(2)}</span>
            </div>
        </div>
    );
}
