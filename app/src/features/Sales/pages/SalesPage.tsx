import { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useCurrency } from "@/hooks/useCurrency";
import SalesTable from '../components/SalesTable';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Banknote, CreditCard, Wallet, Loader2, Receipt, User, Percent, DollarSign, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useGetVariantsQuery } from "@/services/productsApi";
import { useGetPaymentMethodsQuery, useCreateSaleMutation } from "@/services/salesApi";
import { useGetCustomersQuery } from "@/services/customersApi";
import { useCalculateTaxMutation } from "@/services/taxesApi";
import { toast } from "sonner";


interface SaleItem {
    id: number; // This is sometimes treated as product ID or variant ID? Should be unique in cart?
    // Using a composite key or just pushing to array.
    productId?: number;
    variantId?: number;
    name: string;
    sku: string;
    mrp: number;
    pricePerUnit: number;
    discountType: 'amount' | 'percentage';
    discountValue: number;
    quantity: number;
    maxStock: number;
    product_name?: string;
    variant_name?: string;
}

function parseCustomerId(value: string): number | undefined {
    if (!value || value === 'walk-in') {
        return undefined;
    }
    const parsed = Number.parseInt(value, 10);
    return Number.isNaN(parsed) ? undefined : parsed;
}

export default function SalesPage() {
    const currency = useCurrency();
    const [activeTab, setActiveTab] = useState(0);
    const tabsCount = 9; // Maximum concurrent bills

    // State for multiple bills
    const [bills, setBills] = useState(Array.from({ length: tabsCount }, () => ({
        items: [] as SaleItem[],
        customerId: '',
        discountType: 'fixed', // 'fixed' | 'percentage'
        overallDiscount: 0,
        paymentMethod: '',
        paymentType: 'full', // 'full' | 'partial'
        amountTendered: '',
        searchTerm: '',
        quantity: 1,
        selectedPrice: 0,
        selectedDiscountType: 'amount' as 'amount' | 'percentage',
        selectedDiscountValue: 0,
        selectedProduct: null as any,
        selectedVariant: '',
        taxResult: null as any // Store calculation result
    })));

    // Helper to update current bill
    const updateBill = (updates: any) => {
        setBills(prev => {
            const newBills = [...prev];
            newBills[activeTab] = { ...newBills[activeTab], ...updates };
            return newBills;
        });
    };

    const currentBill = bills[activeTab];

    const { data: variantsData } = useGetVariantsQuery({
        limit: 1000
    });
    const variants = variantsData?.variants || [];

    const { data: customersData } = useGetCustomersQuery({ limit: 1000 }); // Simplified for demo
    const customers = customersData?.customers || [];

    const { data: paymentMethodsData } = useGetPaymentMethodsQuery(undefined);
    const paymentMethods: any[] = paymentMethodsData || [];

    const [createSale] = useCreateSaleMutation();
    const [calculateTax] = useCalculateTaxMutation();

    const calculateItemSubtotal = (item: SaleItem) => item.pricePerUnit * item.quantity;
    const calculateItemDiscountAmount = (item: SaleItem) => {
        const lineSubtotal = calculateItemSubtotal(item);
        if (item.discountType === 'percentage') {
            const pct = Math.max(0, Math.min(100, item.discountValue || 0));
            return (lineSubtotal * pct) / 100;
        }
        return Math.max(0, Math.min(lineSubtotal, item.discountValue || 0));
    };
    const calculateItemTotal = (item: SaleItem) => Math.max(0, calculateItemSubtotal(item) - calculateItemDiscountAmount(item));

    // Trigger tax calculation when cart changes
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (currentBill.items.length === 0) {
                if (currentBill.taxResult) updateBill({ taxResult: null });
                return;
            }

            const invoice = {
                items: currentBill.items.map(item => ({
                    product_id: item.productId || item.id,
                    variant_id: item.variantId,
                    quantity: item.quantity,
                    price: item.pricePerUnit,
                    product_name: item.product_name || item.name,
                    variant_name: item.variant_name
                })),
                discount_total: currentBill.discountType === 'fixed'
                    ? parseFloat(String(currentBill.overallDiscount || 0))
                    : 0 // If percentage, backend logic handles it differently or we compute amount here?
            };

            const lineDiscountTotal = currentBill.items.reduce((sum, item) => sum + calculateItemDiscountAmount(item), 0);

            // Include line-level discounts and optional overall discount in one total for tax engine.
            invoice.discount_total += lineDiscountTotal;
            if (currentBill.discountType === 'percentage') {
                const subtotal = currentBill.items.reduce((sum, item) => sum + calculateItemTotal(item), 0);
                invoice.discount_total += (subtotal * (parseFloat(String(currentBill.overallDiscount || 0)) / 100));
            }

            try {
                const result = await calculateTax({
                    invoice,
                    customerId: parseCustomerId(currentBill.customerId)
                }).unwrap();
                updateBill({ taxResult: result });
            } catch (err) {
                console.error("Tax calculation failed", err);
            }
        }, 500); // Debounce

        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        currentBill.items,
        currentBill.customerId,
        currentBill.overallDiscount,
        currentBill.discountType
    ]);



    const handleDirectAddFromVariant = (variant: any) => {
        const mrp = variant.price || variant.mrp || 1;
        const itemToAdd: SaleItem = {
            id: variant.id,
            productId: variant.product_id,
            variantId: variant.id,
            name: `${variant.product_name} - ${variant.name}`,
            product_name: variant.product_name,
            variant_name: variant.name,
            sku: variant.sku,
            mrp,
            pricePerUnit: mrp,
            discountType: 'amount',
            discountValue: 0,
            quantity: 1,
            maxStock: variant.stock
        };

        if (1 > itemToAdd.maxStock) {
            toast.error(`Out of stock.`);
            return;
        }

        const existingItemIndex = currentBill.items.findIndex(i => i.variantId === itemToAdd.variantId);
        let newItems;
        if (existingItemIndex > -1) {
            newItems = [...currentBill.items];
            const newQty = newItems[existingItemIndex].quantity + 1;
            if (newQty > itemToAdd.maxStock) {
                toast.error(`Cannot exceed stock limit.`);
                return;
            }
            newItems[existingItemIndex].quantity = newQty;
        } else {
            newItems = [...currentBill.items, itemToAdd];
        }

        updateBill({
            items: newItems,
            searchTerm: '',
            selectedProduct: null,
            selectedVariant: '',
            quantity: 1,
            selectedPrice: 0,
            selectedDiscountType: 'amount',
            selectedDiscountValue: 0
        });
    };

    const handleUpdateQuantity = (index: number, newQty: number) => {
        if (newQty < 1) return;
        const newItems = [...currentBill.items];
        if (newQty > newItems[index].maxStock) {
            toast.error(`Cannot exceed stock limit.`);
            return;
        }
        newItems[index].quantity = newQty;
        updateBill({ items: newItems });
    };

    const handleRemoveItem = (index: number) => {
        const newItems = [...currentBill.items];
        newItems.splice(index, 1);
        updateBill({ items: newItems });
    };

    const handleUpdatePrice = (index: number, newPrice: number) => {
        const safePrice = Number.isFinite(newPrice) ? newPrice : 1;
        const newItems = [...currentBill.items];
        const item = newItems[index];
        const clamped = Math.max(1, Math.min(safePrice, item.mrp));
        item.pricePerUnit = clamped;
        updateBill({ items: newItems });
    };

    const handleUpdateItemDiscount = (index: number, updates: Partial<Pick<SaleItem, 'discountType' | 'discountValue'>>) => {
        const newItems = [...currentBill.items];
        const item = newItems[index];
        newItems[index] = { ...item, ...updates };
        updateBill({ items: newItems });
    };

    // Use backend results if available, else fallback
    const taxResult = currentBill.taxResult || {};
    const subtotal = currentBill.items.reduce((sum, item) => sum + calculateItemTotal(item), 0);
    // If tax result exists, it has breakdown.
    // grand_total from tax engine includes taxes.
    // If exclusive, grand_total = subtotal - discount + tax.
    // If inclusive, grand_total = subtotal - discount.

    // We should trust backend grand_total if available.
    // But fallback to simple calc for immediate feedback (though debounce makes it laggy).
    // Simple fallback:
    const discountAmount = currentBill.discountType === 'fixed'
        ? (parseFloat(String(currentBill.overallDiscount)) || 0)
        : (subtotal * (parseFloat(String(currentBill.overallDiscount)) || 0) / 100);

    const fallbackGrandTotal = Math.max(0, subtotal - discountAmount).toFixed(2);

    const grandTotal = taxResult.grand_total !== undefined
        ? taxResult.grand_total.toFixed(2)
        : fallbackGrandTotal;

    const [isProcessingSale, setIsProcessingSale] = useState(false);

    const onCompleteSale = async () => {
        if (currentBill.items.length === 0) {
            toast.error('Cart is empty');
            return;
        }
        if (!currentBill.paymentMethod) {
            toast.error('Please select a payment method');
            return;
        }

        setIsProcessingSale(true);

        const saleData = {
            items: currentBill.items.map(item => ({
                variantId: item.variantId || item.id, // Assuming id is variantId for simple products too or handle backend
                quantity: item.quantity,
                pricePerUnit: item.pricePerUnit,
                discount: calculateItemDiscountAmount(item)
            })),
            customerId: parseCustomerId(currentBill.customerId) ?? null,
            discount: discountAmount,
            payments: [
                {
                    paymentMethodId: parseInt(currentBill.paymentMethod),
                    amount: currentBill.paymentType === 'full' ? parseFloat(grandTotal) : parseFloat(currentBill.amountTendered || '0')
                }
            ],
            taxMode: 'exclusive', // Default
            billTaxIds: [],
            fulfillment_status: 'pending'
        };

        try {
            await createSale(saleData).unwrap();
            toast.success('Sale completed successfully!', {
                description: `Total: ${currency}${grandTotal}`,
                duration: 3000
            });
            // Reset current bill
            updateBill({
                items: [],
                customerId: '',
                overallDiscount: 0,
                amountTendered: '',
                paymentMethod: '',
                taxResult: null
            });
        } catch (err: any) {
            console.error(err);
            toast.error('Failed to complete sale', {
                description: err?.data?.error || 'Please try again or contact support'
            });
        } finally {
            setIsProcessingSale(false);
        }
    };


    return (
        <div className="h-[calc(100vh-7rem)] p-4 flex flex-col gap-4 overflow-hidden">

            <div className="flex flex-col lg:flex-row gap-4 h-full overflow-hidden">
                {/* Left Side: Product Selection & Cart */}
                <div className="flex-1 flex flex-col gap-4 overflow-hidden">
                    <SalesTable
                        items={currentBill.items}
                        variants={variants}
                        searchTerm={currentBill.searchTerm}
                        onSearchChange={(value) => updateBill({
                            searchTerm: value,
                            selectedProduct: null,
                            selectedVariant: '',
                            selectedPrice: 0,
                            selectedDiscountType: 'amount',
                            selectedDiscountValue: 0
                        })}
                        onDirectAdd={handleDirectAddFromVariant}
                        updateQuantity={handleUpdateQuantity}
                        updatePrice={handleUpdatePrice}
                        updateDiscount={handleUpdateItemDiscount}
                        removeItem={handleRemoveItem}
                        total={subtotal}
                    />
                </div>

                {/* Right Side: Billing & Checkout */}
                <div className="w-full lg:w-[380px] flex flex-col gap-4 overflow-y-auto">
                    <BillingSection
                        currency={currency}
                        customers={customers}
                        paymentMethods={paymentMethods}
                        currentBill={currentBill}
                        updateBill={updateBill}
                        subtotal={subtotal}
                        grandTotal={grandTotal}
                        onCompleteSale={onCompleteSale}
                        bills={bills}
                        activeTab={activeTab}
                        setActiveTab={setActiveTab}
                        tabsCount={tabsCount}
                        taxResult={taxResult}
                        isProcessingSale={isProcessingSale}
                    />
                </div>
            </div>
        </div>
    );
}

// Sub-component for Billing Section to keep main file cleaner
function BillingSection({
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
}: any) {
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
                {/* Customer Selection */}
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

                {/* Payment Method */}
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
                {/* Overall Discount */}
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

                {/* Summary & Checkout */}
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
                                {parseFloat(currentBill.amountTendered || 0) >= parseFloat(grandTotal) ? "Change" : "Balance"}
                            </Label>
                            <div className={cn(
                                "h-10 px-3 flex items-center justify-between rounded-lg border text-base font-bold transition-colors tabular-nums",
                                parseFloat(currentBill.amountTendered || 0) >= parseFloat(grandTotal)
                                    ? "bg-success/10 text-success border-success/30"
                                    : "bg-muted text-muted-foreground border-border"
                            )}
                                aria-live="polite"
                                aria-label={`${parseFloat(currentBill.amountTendered || 0) >= parseFloat(grandTotal) ? 'Change' : 'Balance'}: ${currency}${Math.abs(parseFloat(grandTotal) - parseFloat(currentBill.amountTendered || 0)).toFixed(2)}`}
                            >
                                <span className="text-xs opacity-70">{currency}</span>
                                <span>{Math.abs(parseFloat(grandTotal) - parseFloat(currentBill.amountTendered || 0)).toFixed(2)}</span>
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
