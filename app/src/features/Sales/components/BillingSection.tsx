import { useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Banknote, CreditCard, Wallet, Loader2, Receipt, User, Percent, DollarSign, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Bill } from '../hooks/useMultiBillState';

interface BillingSectionProps {
    currency: string;
    customers: any[];
    paymentMethods: any[];
    currentBill: Bill;
    updateBill: (updates: Partial<Bill>) => void;
    subtotal: number;
    grandTotal: string;
    onCompleteSale: () => void;
    bills: Bill[];
    activeTab: number;
    setActiveTab: (tab: number) => void;
    tabsCount: number;
    taxResult: any;
    isProcessingSale: boolean;
}

export default function BillingSection({
    currency,
    customers,
    paymentMethods,
    currentBill,
    updateBill,
    subtotal,
    grandTotal,
    onCompleteSale,
    bills,
    activeTab,
    setActiveTab,
    tabsCount,
    taxResult,
    isProcessingSale
}: BillingSectionProps) {
    const isCalculatingTax = currentBill.items.length > 0 && !taxResult;

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key >= '1' && e.key <= '9') {
                e.preventDefault();
                const tabIndex = parseInt(e.key) - 1;
                if (tabIndex < tabsCount) {
                    setActiveTab(tabIndex);
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [setActiveTab, tabsCount]);

    return (
        <div className="space-y-4">
            <div className="bg-card border rounded-lg shadow-sm p-5 space-y-5">
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                        <Label htmlFor="customer-select" className="text-sm font-semibold text-foreground">
                            Customer
                        </Label>
                    </div>
                    <Select value={currentBill.customerId} onValueChange={(val) => updateBill({ customerId: val })}>
                        <SelectTrigger id="customer-select" className="bg-background" aria-label="Select customer">
                            <SelectValue placeholder="Walk-in Customer" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="walk-in">Walk-in Customer</SelectItem>
                            {customers.map((c: any) => (
                                <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <Separator />

                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <Receipt className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                        <Label htmlFor="payment-method" className="text-sm font-semibold text-foreground">
                            Payment Method
                        </Label>
                    </div>
                    <Select value={currentBill.paymentMethod} onValueChange={(val) => updateBill({ paymentMethod: val })}>
                        <SelectTrigger id="payment-method" className="bg-background" aria-label="Select payment method">
                            <SelectValue placeholder="Select method" />
                        </SelectTrigger>
                        <SelectContent>
                            {paymentMethods.map((method: any) => (
                                <SelectItem key={method.id} value={String(method.id)}>
                                    <div className="flex items-center gap-2">
                                        {method.name.toLowerCase() === 'cash' && <Banknote className="h-4 w-4 text-success" aria-hidden="true" />}
                                        {method.name.toLowerCase() === 'card' && <CreditCard className="h-4 w-4 text-primary" aria-hidden="true" />}
                                        {method.name.toLowerCase() === 'upi' && <Wallet className="h-4 w-4 text-warning" aria-hidden="true" />}
                                        <span>{method.name}</span>
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <div className="flex items-center gap-2">
                        <Label className="text-xs text-muted-foreground">Payment Type</Label>
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <HelpCircle className="h-3 w-3 text-muted-foreground" aria-label="Payment type help" />
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p className="text-xs max-w-[200px]">Full: Complete payment now. Partial: Pay part now, rest later.</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                    <div className="flex border border-border rounded-lg overflow-hidden bg-background">
                        <button
                            onClick={() => updateBill({ paymentType: 'full' })}
                            className={cn(
                                "flex-1 px-4 py-2 text-sm font-semibold transition-colors",
                                currentBill.paymentType === 'full'
                                    ? "bg-primary text-primary-foreground"
                                    : "text-muted-foreground hover:bg-muted"
                            )}
                            aria-pressed={currentBill.paymentType === 'full'}
                            aria-label="Full payment"
                        >
                            Full Payment
                        </button>
                        <button
                            onClick={() => updateBill({ paymentType: 'partial' })}
                            className={cn(
                                "flex-1 px-4 py-2 text-sm font-semibold transition-colors border-l border-border",
                                currentBill.paymentType === 'partial'
                                    ? "bg-primary text-primary-foreground"
                                    : "text-muted-foreground hover:bg-muted"
                            )}
                            aria-pressed={currentBill.paymentType === 'partial'}
                            aria-label="Partial payment"
                        >
                            Partial Payment
                        </button>
                    </div>
                </div>

                <Separator />

                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <Percent className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                        <Label htmlFor="discount-amount" className="text-sm font-semibold text-foreground">
                            Discount
                        </Label>
                    </div>
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium pointer-events-none">
                                {currentBill.discountType === 'fixed' ? currency : '%'}
                            </div>
                            <Input
                                id="discount-amount"
                                type="text"
                                placeholder="0.00"
                                value={currentBill.overallDiscount || ''}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    if (val === "" || /^\d*\.?\d*$/.test(val)) {
                                        updateBill({ overallDiscount: val === "" ? 0 : parseFloat(val) });
                                    }
                                }}
                                className="pl-8 bg-background"
                                aria-label="Discount amount"
                            />
                        </div>
                        <div className="flex border border-border rounded-lg overflow-hidden bg-background">
                            <button
                                onClick={() => updateBill({ discountType: 'fixed' })}
                                className={cn(
                                    "px-4 py-2 text-sm font-semibold transition-colors",
                                    currentBill.discountType === 'fixed'
                                        ? "bg-primary text-primary-foreground"
                                        : "text-muted-foreground hover:bg-muted"
                                )}
                                aria-pressed={currentBill.discountType === 'fixed'}
                                aria-label="Fixed discount"
                            >
                                <DollarSign className="h-4 w-4" aria-hidden="true" />
                            </button>
                            <button
                                onClick={() => updateBill({ discountType: 'percentage' })}
                                className={cn(
                                    "px-4 py-2 text-sm font-semibold transition-colors border-l border-border",
                                    currentBill.discountType === 'percentage'
                                        ? "bg-primary text-primary-foreground"
                                        : "text-muted-foreground hover:bg-muted"
                                )}
                                aria-pressed={currentBill.discountType === 'percentage'}
                                aria-label="Percentage discount"
                            >
                                <Percent className="h-4 w-4" aria-hidden="true" />
                            </button>
                        </div>
                    </div>
                </div>

                <Separator />

                <div className="space-y-4 pt-2">
                    <div className="space-y-2">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground">Subtotal</span>
                            <span className="font-medium tabular-nums">{currency}{subtotal.toFixed(2)}</span>
                        </div>
                        {isCalculatingTax && (
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">Tax</span>
                                <div className="flex items-center gap-2">
                                    <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" aria-hidden="true" />
                                    <span className="text-xs text-muted-foreground">Calculating...</span>
                                </div>
                            </div>
                        )}
                        {taxResult?.total_tax > 0 && (
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">Tax</span>
                                <span className="font-medium tabular-nums text-success">{currency}{taxResult.total_tax.toFixed(2)}</span>
                            </div>
                        )}
                        <Separator />
                        <div className="flex justify-between items-center">
                            <span className="text-lg font-semibold">Total</span>
                            <span className="text-2xl font-bold tabular-nums" aria-live="polite">{currency}{grandTotal}</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                            <Label htmlFor="amount-tendered" className="text-sm font-medium text-muted-foreground">
                                Tendered
                            </Label>
                            <div className="relative">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium pointer-events-none">{currency}</div>
                                <Input
                                    id="amount-tendered"
                                    type="text"
                                    placeholder="0.00"
                                    value={currentBill.amountTendered || ''}
                                    onChange={(e) => updateBill({ amountTendered: e.target.value })}
                                    className="pl-8 bg-background font-semibold text-base"
                                    aria-label="Amount tendered by customer"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-muted-foreground">
                                {parseFloat(currentBill.amountTendered || '0') >= parseFloat(grandTotal) ? "Change" : "Balance"}
                            </Label>
                            <div className={cn(
                                "h-10 px-3 flex items-center justify-between rounded-lg border text-base font-bold transition-colors tabular-nums",
                                parseFloat(currentBill.amountTendered || '0') >= parseFloat(grandTotal)
                                    ? "bg-success/10 text-success border-success/30"
                                    : "bg-muted text-muted-foreground border-border"
                            )}
                                aria-live="polite"
                                aria-label={`${parseFloat(currentBill.amountTendered || '0') >= parseFloat(grandTotal) ? 'Change' : 'Balance'}: ${currency}${Math.abs(parseFloat(grandTotal) - parseFloat(currentBill.amountTendered || '0')).toFixed(2)}`}
                            >
                                <span className="text-xs opacity-70">{currency}</span>
                                <span>{Math.abs(parseFloat(grandTotal) - parseFloat(currentBill.amountTendered || '0')).toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    <Button
                        onClick={onCompleteSale}
                        className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-base shadow-lg shadow-primary/20"
                        disabled={parseFloat(grandTotal) <= 0 || isProcessingSale}
                        aria-label="Complete sale and process payment"
                    >
                        {isProcessingSale ? (
                            <>
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden="true" />
                                Processing...
                            </>
                        ) : (
                            <>
                                <Receipt className="mr-2 h-5 w-5" aria-hidden="true" />
                                Complete Sale
                            </>
                        )}
                    </Button>
                </div>
            </div>

            <div className="bg-card border rounded-lg shadow-sm p-4 space-y-3">
                <div className="flex items-center justify-between">
                    <Label className="text-sm font-semibold text-foreground">Active Bills</Label>
                    <span className="text-xs text-muted-foreground">Ctrl+1-9 to switch</span>
                </div>
                <div className="flex flex-wrap gap-2">
                    {Array.from({ length: tabsCount }).map((_, idx: number) => {
                        const bill = bills[idx];
                        const hasItems = bill?.items?.length > 0;
                        const isActive = activeTab === idx;
                        const itemCount = bill?.items?.length || 0;
                        const billTotal = bill?.items?.reduce((sum: number, item: any) => {
                            const lineSubtotal = (item.pricePerUnit ?? item.mrp) * item.quantity;
                            const lineDiscount = item.discountType === 'percentage'
                                ? (lineSubtotal * Math.max(0, Math.min(100, item.discountValue || 0))) / 100
                                : Math.max(0, Math.min(lineSubtotal, item.discountValue || 0));
                            return sum + Math.max(0, lineSubtotal - lineDiscount);
                        }, 0) || 0;

                        return (
                            <TooltipProvider key={idx}>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <button
                                            onClick={() => setActiveTab(idx)}
                                            className={cn(
                                                "flex flex-col items-center justify-center py-1 px-2 rounded-lg text-xs transition-all duration-200 border-2",
                                                isActive
                                                    ? "bg-primary text-primary-foreground border-primary shadow-md scale-105"
                                                    : hasItems
                                                        ? "bg-warning/10 text-warning border-warning/30 hover:bg-warning/20"
                                                        : "bg-muted text-muted-foreground border-transparent hover:bg-muted/80"
                                            )}
                                            aria-label={`Bill ${idx + 1}${hasItems ? ` with ${itemCount} items` : ' empty'}`}
                                            aria-pressed={isActive}
                                        >
                                            <span className="font-bold">{idx + 1}</span>
                                        </button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <div className="text-xs">
                                            <p className="font-semibold">Bill #{idx + 1}</p>
                                            {hasItems ? (
                                                <p className="text-muted-foreground">{itemCount} items · {currency}{billTotal.toFixed(2)}</p>
                                            ) : (
                                                <p className="text-muted-foreground">Empty</p>
                                            )}
                                        </div>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
