import { ChangeEvent, useState, useEffect } from 'react';
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
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useCreateReturnMutation } from '@/services/returnsApi';
import { toast } from 'sonner';
import { useCurrency } from '@/hooks/useCurrency';
import { AlertCircle, Package, DollarSign } from 'lucide-react';
import CurrencyText from '@/components/common/CurrencyText';

interface SaleReturnableItem {
    id: number;
    product_name?: string;
    variant_name?: string;
    quantity: number;
    returned_quantity?: number;
    price_per_unit: number;
}

interface SaleForReturn {
    id: number;
    invoice_number: string;
    items: SaleReturnableItem[];
}

interface CreateReturnDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    sale: SaleForReturn | null | undefined;
    onSuccess: () => void;
}

export default function CreateReturnDialog({ open, onOpenChange, sale, onSuccess }: CreateReturnDialogProps) {
    const currency = useCurrency();
    const [selectedItems, setSelectedItems] = useState<Record<number, number>>({});
    const [reason, setReason] = useState('');
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [createReturn, { isLoading }] = useCreateReturnMutation();

    const totalRefundEstimate = Object.entries(selectedItems).reduce((sum, [itemId, quantity]) => {
        const item = sale?.items?.find((i) => i.id === Number(itemId));
        if (item) {
            return sum + (item.price_per_unit * Number(quantity));
        }
        return sum;
    }, 0);

    useEffect(() => {
        if (!open) {
            setSelectedItems({});
            setReason('');
            setErrors({});
        }
    }, [open]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.key === 'Enter' && open && !isLoading) {
                e.preventDefault();
                handleSubmit();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [open, isLoading, selectedItems, reason]);

    const handleQuantityChange = (itemId: number, value: string, maxQty: number) => {
        const qty = parseInt(value) || 0;
        if (qty < 0) return;
        if (qty > maxQty) {
            setErrors(prev => ({ ...prev, [itemId]: `Cannot exceed ${maxQty} items` }));
            return;
        }

        setErrors(prev => {
            const next = { ...prev };
            delete next[itemId];
            return next;
        });

        setSelectedItems((prev) => {
            if (qty === 0) {
                const { [itemId]: _, ...rest } = prev;
                return rest;
            }
            return { ...prev, [itemId]: qty };
        });
    };

    const handleCheckboxChange = (itemId: number, checked: boolean, maxQty: number) => {
        if (checked) {
            setSelectedItems((prev) => ({ ...prev, [itemId]: maxQty }));
        } else {
            setSelectedItems((prev) => {
                const { [itemId]: _, ...rest } = prev;
                return rest;
            });
        }
    };

    const handleSubmit = async () => {
        const newErrors: Record<string, string> = {};

        const itemsToReturn = Object.entries(selectedItems).map(([itemId, quantity]) => ({
            saleItemId: Number(itemId),
            quantity: Number(quantity)
        }));

        if (itemsToReturn.length === 0) {
            newErrors.items = 'Please select at least one item to return';
        }

        if (!reason.trim()) {
            newErrors.reason = 'Please provide a reason for the return';
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        try {
            if (!sale?.id) {
                setErrors((prev) => ({ ...prev, items: 'Sale details are unavailable.' }));
                return;
            }

            await createReturn({
                saleId: sale.id,
                items: itemsToReturn,
                reason: reason.trim()
            }).unwrap();
            toast.success('Return processed successfully');
            onSuccess();
            onOpenChange(false);
        } catch (err: unknown) {
            const apiError = err as { data?: { error?: string } };
            toast.error(apiError?.data?.error || 'Failed to process return');
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Process Return</DialogTitle>
                    <DialogDescription>
                        Select items to return from Invoice <span className="font-mono font-semibold">#{sale?.invoice_number}</span>
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto space-y-4 py-2">
                    {/* Refund Summary Card */}
                    <Card className="border-primary/20 bg-primary/5">
                        <CardContent>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <DollarSign className="h-5 w-5 text-primary" />
                                    <div>
                                        <p className="text-sm text-muted-foreground">Estimated Refund Amount</p>
                                        <p className="text-2xl font-bold text-primary">
                                            <CurrencyText value={totalRefundEstimate} />
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-muted-foreground">Items Selected</p>
                                    <p className="text-xl font-semibold">{Object.keys(selectedItems).length}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {errors.items && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{errors.items}</AlertDescription>
                        </Alert>
                    )}

                    {/* Items List */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-muted-foreground" />
                            <Label className="text-sm font-semibold">Select Items to Return</Label>
                        </div>
                        <div className="space-y-2 max-h-[300px] overflow-y-auto">
                            {sale?.items?.map((item) => {
                                const returnedQty = item.returned_quantity || 0;
                                const availableQty = item.quantity - returnedQty;
                                const isSelected = !!selectedItems[item.id];

                                if (availableQty <= 0) return null;

                                return (
                                    <Card
                                        key={item.id}
                                        className={`border transition-colors cursor-pointer ${isSelected ? 'border-primary bg-primary/5' : 'border-border'
                                            }`}
                                        onClick={() => handleCheckboxChange(item.id, !isSelected, availableQty)}
                                    >
                                        <CardContent className="">
                                            <div className="flex items-start gap-3">
                                                <Checkbox
                                                    id={`item-${item.id}`}
                                                    checked={isSelected}
                                                    onCheckedChange={(checked: boolean) => handleCheckboxChange(item.id, checked, availableQty)}
                                                    aria-label={`Select ${item.product_name} - ${item.variant_name}`}
                                                    className="mt-1"
                                                    onClick={(e: React.MouseEvent) => e.stopPropagation()}
                                                />
                                                <div className="flex-1 space-y-2">
                                                    <div>
                                                        <Label
                                                            htmlFor={`item-${item.id}`}
                                                            className="text-sm font-semibold cursor-pointer"
                                                            onClick={(e: React.MouseEvent) => e.stopPropagation()}
                                                        >
                                                            {item.product_name ?? 'Unknown product'}
                                                        </Label>
                                                        <p className="text-xs text-muted-foreground">{item.variant_name ?? 'Unknown variant'}</p>
                                                    </div>
                                                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                                        <span>Price: {currency}{item.price_per_unit.toFixed(2)}</span>
                                                        <Separator orientation="vertical" className="h-3" />
                                                        <span>Available: {availableQty} of {item.quantity}</span>
                                                        {returnedQty > 0 && (
                                                            <>
                                                                <Separator orientation="vertical" className="h-3" />
                                                                <span className="text-destructive">Returned: {returnedQty}</span>
                                                            </>
                                                        )}
                                                    </div>
                                                    {isSelected && (
                                                        <div className="flex items-center gap-2 pt-1" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                                                            <Label htmlFor={`qty-${item.id}`} className="text-xs font-medium">
                                                                Quantity:
                                                            </Label>
                                                            <Input
                                                                id={`qty-${item.id}`}
                                                                type="number"
                                                                className="w-24 h-8 text-sm"
                                                                value={selectedItems[item.id]}
                                                                onChange={(e: ChangeEvent<HTMLInputElement>) => handleQuantityChange(item.id, e.target.value, availableQty)}
                                                                min="1"
                                                                max={availableQty}
                                                                aria-label={`Quantity to return for ${item.product_name}`}
                                                                aria-describedby={errors[item.id] ? `error-${item.id}` : undefined}
                                                            />
                                                            <span className="text-sm font-semibold text-primary">
                                                                = <CurrencyText value={item.price_per_unit * selectedItems[item.id]} />
                                                            </span>
                                                        </div>
                                                    )}
                                                    {errors[item.id] && (
                                                        <p id={`error-${item.id}`} className="text-xs text-destructive" role="alert">
                                                            {errors[item.id]}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    </div>

                    {/* Reason Field */}
                    <div className="space-y-2">
                        <Label htmlFor="reason" className="text-sm font-semibold">
                            Reason for Return <span className="text-destructive">*</span>
                        </Label>
                        <Textarea
                            id="reason"
                            placeholder="e.g., Defective product, Wrong item shipped, Customer changed mind..."
                            value={reason}
                            onChange={(e: ChangeEvent<HTMLTextAreaElement>) => {
                                const nextValue = e.target.value;
                                setReason(nextValue);
                                if (errors.reason && nextValue.trim()) {
                                    setErrors(prev => {
                                        const next = { ...prev };
                                        delete next.reason;
                                        return next;
                                    });
                                }
                            }}
                            className={errors.reason ? 'border-destructive' : ''}
                            rows={3}
                            maxLength={500}
                            aria-required="true"
                            aria-invalid={!!errors.reason}
                            aria-describedby={errors.reason ? 'reason-error' : undefined}
                        />
                        {errors.reason && (
                            <p id="reason-error" className="text-xs text-destructive" role="alert">
                                {errors.reason}
                            </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                            This information is required for audit and record-keeping purposes.
                        </p>
                    </div>
                </div>

                <DialogFooter className="gap-2">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isLoading}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={isLoading || Object.keys(selectedItems).length === 0}
                        className="min-w-[140px]"
                    >
                        {isLoading ? 'Processing...' : `Confirm Return`}
                    </Button>
                </DialogFooter>
                <p className="text-xs text-center text-muted-foreground pb-2">
                    Press <kbd className="px-1.5 py-0.5 text-xs font-semibold bg-muted rounded">Ctrl+Enter</kbd> to submit
                </p>
            </DialogContent>
        </Dialog>
    );
}
