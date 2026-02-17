import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { useCreateReturnMutation } from '@/services/returnsApi';
import { toast } from 'sonner';
import { useCurrency } from '@/hooks/useCurrency';

interface CreateReturnDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    sale: any;
    onSuccess: () => void;
}

export default function CreateReturnDialog({ open, onOpenChange, sale, onSuccess }: CreateReturnDialogProps) {
    const currency = useCurrency();
    const [selectedItems, setSelectedItems] = useState<any>({});
    const [reason, setReason] = useState('');
    const [createReturn, { isLoading }] = useCreateReturnMutation();

    const handleQuantityChange = (itemId: number, value: string, maxQty: number) => {
        const qty = parseInt(value) || 0;
        if (qty < 0) return;
        if (qty > maxQty) {
            toast.error(`Cannot return more than purchased quantity (${maxQty})`);
            return;
        }

        setSelectedItems((prev: any) => {
            if (qty === 0) {
                const { [itemId]: _, ...rest } = prev;
                return rest;
            }
            return { ...prev, [itemId]: qty };
        });
    };

    const handleCheckboxChange = (itemId: number, checked: boolean, maxQty: number) => {
        if (checked) {
            setSelectedItems((prev: any) => ({ ...prev, [itemId]: maxQty }));
        } else {
            setSelectedItems((prev: any) => {
                const { [itemId]: _, ...rest } = prev;
                return rest;
            });
        }
    };

    const handleSubmit = async () => {
        const itemsToReturn = Object.entries(selectedItems).map(([itemId, quantity]) => ({
            saleItemId: parseInt(itemId),
            quantity: Number(quantity)
        }));

        if (itemsToReturn.length === 0) {
            toast.error('Select at least one item to return');
            return;
        }

        try {
            await createReturn({
                saleId: sale.id,
                items: itemsToReturn,
                reason
            }).unwrap();
            toast.success('Return processed successfully');
            onSuccess();
            onOpenChange(false);
        } catch (err: any) {
            toast.error(err?.data?.error || 'Failed to process return');
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Create Return</DialogTitle>
                    <DialogDescription>
                        Select items to return from Invoice #{sale?.invoice_number}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                        {sale?.items?.map((item: any) => {
                            const returnedQty = item.returned_quantity || 0;
                            const availableQty = item.quantity - returnedQty;
                            const isSelected = !!selectedItems[item.id];

                            if (availableQty <= 0) return null;

                            return (
                                <div key={item.id} className="flex items-center space-x-3 border p-3 rounded-md">
                                    <Checkbox
                                        id={`item-${item.id}`}
                                        checked={isSelected}
                                        onCheckedChange={(checked: boolean) => handleCheckboxChange(item.id, checked, availableQty)}
                                    />
                                    <div className="flex-1 space-y-1">
                                        <Label htmlFor={`item-${item.id}`} className="text-sm font-medium leading-none">
                                            {item.product_name} - {item.variant_name}
                                        </Label>
                                        <p className="text-xs text-muted-foreground">
                                            Sold at {currency}{item.price_per_unit} x {item.quantity}
                                        </p>
                                    </div>
                                    {isSelected && (
                                        <Input
                                            type="number"
                                            className="w-20 h-8"
                                            value={selectedItems[item.id]}
                                            onChange={(e) => handleQuantityChange(item.id, e.target.value, availableQty)}
                                            min="1"
                                            max={availableQty}
                                        />
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="reason">Reason for Return</Label>
                        <Textarea
                            id="reason"
                            placeholder="e.g. Defective, Wrong item, etc."
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={isLoading}>
                        {isLoading ? 'Processing...' : 'Confirm Return'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
