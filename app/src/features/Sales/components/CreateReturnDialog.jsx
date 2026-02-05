import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCreateReturnMutation } from '@/services/returnsApi';
import { useCurrency } from "@/hooks/useCurrency";
import { Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useGetMeQuery } from '@/services/authApi';

export default function CreateReturnDialog({ open, onOpenChange, sale }) {
    const currency = useCurrency();
    const [createReturn, { isLoading }] = useCreateReturnMutation();
    const { data: user } = useGetMeQuery();

    const [returnItems, setReturnItems] = useState({});
    const [reason, setReason] = useState('');
    const [error, setError] = useState(null);

    // Initialize state when modal opens or sale changes
    useEffect(() => {
        if (open) {
            setReturnItems({});
            setReason('');
            setError(null);
        }
    }, [open, sale]);

    if (!sale) return null;

    const handleQuantityChange = (itemId, value) => {
        const qty = parseInt(value) || 0;
        setReturnItems(prev => ({
            ...prev,
            [itemId]: qty
        }));
    };

    const calculateRefundAmount = () => {
        // 1. Calculate the "Gross Bill Total" (sum of all lines after line-level discounts, ignoring tax additions)
        const billItemsSubtotal = sale.items.reduce((sum, si) => {
            return sum + (si.price_per_unit * si.quantity - si.discount_amount);
        }, 0);

        // 2. Calculate the refund for each selected item
        let total = 0;
        sale.items.forEach(item => {
            const returnQty = returnItems[item.id] || 0;
            if (returnQty > 0) {
                const lineSubtotal = (item.price_per_unit * item.quantity - item.discount_amount);
                const lineGlobalDiscount = billItemsSubtotal > 0 ? (lineSubtotal / billItemsSubtotal) * sale.discount : 0;
                const lineNetPaid = lineSubtotal - lineGlobalDiscount;
                const itemRefund = (lineNetPaid / item.quantity) * returnQty;
                total += itemRefund;
            }
        });
        return total;
    };

    const handleSubmit = async () => {
        try {
            const itemsToReturn = Object.entries(returnItems)
                .filter(([_, qty]) => qty > 0)
                .map(([itemId, qty]) => ({
                    saleItemId: parseInt(itemId),
                    quantity: qty
                }));

            if (itemsToReturn.length === 0) {
                setError("Please select at least one item to return.");
                return;
            }

            await createReturn({
                saleId: sale.id,
                items: itemsToReturn,
                reason,
                userId: user?.id
            }).unwrap();

            toast.success("Return processed successfully");
            onOpenChange(false);
        } catch (err) {
            console.error(err);
            setError(err.data?.error || "Failed to process return");
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Process Return - Invoice {sale.invoice_number}</DialogTitle>
                    <DialogDescription>
                        Select items and quantities to return. Inventory will be updated automatically.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto py-4">
                    {error && (
                        <Alert variant="destructive" className="mb-4">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Product</TableHead>
                                <TableHead className="text-right">Sold Price</TableHead>
                                <TableHead className="text-center">Sold Qty</TableHead>
                                {/* We don't have 'returned quantity' in sale.items from the simpler query usually, 
                                    unless we enhanced the sale query. Assuming we might check available quantity separately 
                                    or just rely on backend validation for now if 'returned_quantity' isn't in item.
                                    Actually the backend service does check: `saleItem.quantity - alreadyReturned`.
                                    The frontend doesn't know 'alreadyReturned' unless we fetch it. 
                                    
                                    For now providing input maxed at sold qty. Backend will error if exceeding. 
                                */}
                                <TableHead className="w-[100px] text-center">Return Qty</TableHead>
                                <TableHead className="text-right">Refund</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sale.items.map((item) => {
                                const returnQty = returnItems[item.id] || 0;

                                const billItemsSubtotal = sale.items.reduce((sum, si) => sum + (si.price_per_unit * si.quantity - si.discount_amount), 0);
                                const lineSubtotal = (item.price_per_unit * item.quantity - item.discount_amount);
                                const lineGlobalDiscount = billItemsSubtotal > 0 ? (lineSubtotal / billItemsSubtotal) * sale.discount : 0;
                                const lineNetPaid = lineSubtotal - lineGlobalDiscount;
                                const unitNetPaid = lineNetPaid / item.quantity;

                                const refundAmount = unitNetPaid * returnQty;

                                return (
                                    <TableRow key={item.id}>
                                        <TableCell>
                                            <div className="font-medium">{item.variant_name}</div>
                                            <div className="text-xs text-muted-foreground">{item.sku}</div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex flex-col items-end">
                                                <span>{currency}{unitNetPaid.toFixed(2)}</span>
                                                <span className="text-[10px] text-muted-foreground italic">Unit Paid</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center">{item.quantity}</TableCell>
                                        <TableCell>
                                            <Input
                                                type="number"
                                                min="0"
                                                max={item.quantity}
                                                className="h-8 w-20 text-center mx-auto"
                                                value={returnItems[item.id] || ''}
                                                onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                                            />
                                        </TableCell>
                                        <TableCell className="text-right font-medium">
                                            {returnQty > 0 ? `${currency}${refundAmount.toFixed(2)}` : '-'}
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>

                    <div className="mt-6 space-y-2">
                        <Label>Reason for Return</Label>
                        <Textarea
                            placeholder="e.g. Defective item, Customer changed mind..."
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                        />
                    </div>
                </div>

                <DialogFooter className="border-t pt-4">
                    <div className="flex items-center justify-between w-full">
                        <div className="text-lg font-bold">
                            Total Refund: <span className="text-destructive">{currency}{calculateRefundAmount().toFixed(2)}</span>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                            <Button variant="destructive" onClick={handleSubmit} disabled={isLoading}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Confirm Return
                            </Button>
                        </div>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
