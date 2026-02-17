import { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { useCurrency } from "@/hooks/useCurrency";
import SalesControls from '../components/SalesControls';
import SalesTable from '../components/SalesTable';
import ProductSelector from '../components/ProductSelector';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Banknote, CreditCard, Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useGetProductsQuery } from "@/services/productsApi";
import { useGetPaymentMethodsQuery, useCreateSaleMutation } from "@/services/salesApi";
import { useGetCustomersQuery } from "@/services/customersApi";
import { useCalculateTaxMutation } from "@/services/taxesApi";
import { toast } from "sonner";
import SalesHistoryPage from "./SalesHistoryPage";

interface SaleItem {
    id: number; // This is sometimes treated as product ID or variant ID? Should be unique in cart?
    // Using a composite key or just pushing to array.
    productId?: number;
    variantId?: number;
    name: string;
    sku: string;
    mrp: number;
    quantity: number;
    maxStock: number;
    product_name?: string;
    variant_name?: string;
}

export default function SalesPage() {
    const currency = useCurrency();
    const [view, setView] = useState<'cart' | 'history'>('cart');
    const [activeTab, setActiveTab] = useState(0);
    const tabsCount = 3; // Maximum concurrent bills

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

    const { data: productsData } = useGetProductsQuery({
        searchTerm: currentBill.searchTerm.length > 2 ? currentBill.searchTerm : undefined,
        limit: 10
    });
    const products = productsData?.products || [];

    const { data: customersData } = useGetCustomersQuery({ limit: 1000 }); // Simplified for demo
    const customers = customersData?.customers || [];

    const { data: paymentMethodsData } = useGetPaymentMethodsQuery(undefined);
    const paymentMethods: any[] = paymentMethodsData || [];

    const [createSale] = useCreateSaleMutation();
    const [calculateTax] = useCalculateTaxMutation();

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
                    price: item.mrp,
                    product_name: item.product_name || item.name,
                    variant_name: item.variant_name
                })),
                discount_total: currentBill.discountType === 'fixed'
                    ? parseFloat(String(currentBill.overallDiscount || 0))
                    : 0 // If percentage, backend logic handles it differently or we compute amount here?
            };

            // If percentage discount, apply it to subtotal locally before sending?
            // Backend tax engine distributes 'discount_total'.
            // If type is percentage, calculate total discount amount first.
            if (currentBill.discountType === 'percentage') {
                const subtotal = currentBill.items.reduce((sum, item) => sum + (item.mrp * item.quantity), 0);
                invoice.discount_total = (subtotal * (parseFloat(String(currentBill.overallDiscount || 0)) / 100));
            }

            try {
                const result = await calculateTax({
                    invoice,
                    customerId: currentBill.customerId ? parseInt(currentBill.customerId) : undefined
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

    const handleAddItem = () => {
        if (!currentBill.selectedProduct) return;

        let itemToAdd: SaleItem = {
            id: currentBill.selectedProduct.id,
            productId: currentBill.selectedProduct.id,
            name: currentBill.selectedProduct.name,
            sku: currentBill.selectedProduct.sku,
            mrp: currentBill.selectedProduct.mrp,
            quantity: currentBill.quantity,
            maxStock: currentBill.selectedProduct.stock,
            product_name: currentBill.selectedProduct.name
        };

        if (currentBill.selectedProduct.variants && currentBill.selectedProduct.variants.length > 0) {
            const variant = currentBill.selectedProduct.variants.find((v: any) => v.id === parseInt(currentBill.selectedVariant));
            if (variant) {
                itemToAdd = {
                    id: variant.id,
                    productId: currentBill.selectedProduct.id,
                    variantId: variant.id,
                    name: `${currentBill.selectedProduct.name} - ${variant.name}`,
                    product_name: currentBill.selectedProduct.name,
                    variant_name: variant.name,
                    sku: variant.sku,
                    mrp: variant.price || variant.mrp, // Ensure price usage
                    quantity: currentBill.quantity,
                    maxStock: variant.stock
                };
            }
        }

        if (itemToAdd.quantity > itemToAdd.maxStock) {
            toast.error(`Only ${itemToAdd.maxStock} units available.`);
            return;
        }

        // Check duplicates by ID (Variant ID or Product ID)
        // If variantId exists, use it. Else use id.
        const existingItemIndex = currentBill.items.findIndex(i =>
            (itemToAdd.variantId && i.variantId === itemToAdd.variantId) ||
            (!itemToAdd.variantId && i.id === itemToAdd.id)
        );

        let newItems;
        if (existingItemIndex > -1) {
            newItems = [...currentBill.items];
            const newQty = newItems[existingItemIndex].quantity + itemToAdd.quantity;
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
            quantity: 1
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

    // Use backend results if available, else fallback
    const taxResult = currentBill.taxResult || {};
    const subtotal = currentBill.items.reduce((sum, item) => sum + (item.mrp * item.quantity), 0);
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

    const onCompleteSale = async () => {
        if (currentBill.items.length === 0) {
            toast.error('Cart is empty');
            return;
        }
        if (!currentBill.paymentMethod) {
            toast.error('Select payment method');
            return;
        }

        const saleData = {
            items: currentBill.items.map(item => ({
                variantId: item.variantId || item.id, // Assuming id is variantId for simple products too or handle backend
                quantity: item.quantity,
                pricePerUnit: item.mrp // Pass current price
            })),
            customerId: currentBill.customerId ? parseInt(currentBill.customerId) : null,
            discount: discountAmount,
            payments: [
                {
                    paymentMethodId: parseInt(currentBill.paymentMethod),
                    amount: currentBill.paymentType === 'full' ? parseFloat(grandTotal) : parseFloat(currentBill.amountTendered || '0')
                }
            ],
            taxMode: 'exclusive', // Default
            billTaxIds: []
        };

        try {
            await createSale(saleData).unwrap();
            toast.success('Sale completed successfully!');
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
            toast.error(err?.data?.error || 'Failed to complete sale');
        }
    };

    if (view === 'history') {
        return (
            <div className="h-[calc(100vh-4rem)] p-4 flex flex-col gap-4">
                <SalesControls view={view} setView={setView} />
                <SalesHistoryPage />
            </div>
        );
    }

    return (
        <div className="h-[calc(100vh-4rem)] p-4 flex flex-col gap-4 overflow-hidden">
            <SalesControls view={view} setView={setView} />

            <div className="flex flex-col lg:flex-row gap-4 h-full overflow-hidden">
                {/* Left Side: Product Selection & Cart */}
                <div className="flex-1 flex flex-col gap-4 overflow-hidden">
                    <ProductSelector
                        searchTerm={currentBill.searchTerm}
                        onSearchChange={(e) => updateBill({ searchTerm: e.target.value })}
                        products={products}
                        selectedProduct={currentBill.selectedProduct}
                        onProductSelect={(id) => {
                            const product = products.find((p: any) => p.id === parseInt(id));
                            updateBill({
                                selectedProduct: product,
                                searchTerm: product?.name || '',
                                selectedVariant: product?.variants?.[0]?.id ? String(product.variants[0].id) : ''
                            });
                        }}
                        selectedVariant={currentBill.selectedVariant}
                        onVariantChange={(val) => updateBill({ selectedVariant: val })}
                        quantity={currentBill.quantity}
                        onQuantityChange={(val) => updateBill({ quantity: val })}
                        onAddItem={handleAddItem}
                        setSearchTerm={(term) => updateBill({ searchTerm: term })}
                    />

                    <SalesTable
                        items={currentBill.items}
                        updateQuantity={handleUpdateQuantity}
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
    taxResult
}: any) {
    return (
        <div className="bg-card border rounded-md shadow-sm p-4 space-y-6">
            <div className="space-y-4">
                {/* Customer Selection */}
                <div className="space-y-2">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Customer
                    </Label>
                    <Select value={currentBill.customerId} onValueChange={(val) => updateBill({ customerId: val })}>
                        <SelectTrigger className="bg-background border-border">
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

                {/* Payment Method */}
                <div className="space-y-2">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Payment Method
                    </Label>
                    <div className="flex gap-2">
                        <Select value={currentBill.paymentMethod} onValueChange={(val) => updateBill({ paymentMethod: val })}>
                            <SelectTrigger className="bg-background border-border flex-1">
                                <SelectValue placeholder="Method" />
                            </SelectTrigger>
                            <SelectContent>
                                {paymentMethods.map((method: any) => (
                                    <SelectItem key={method.id} value={String(method.id)}>
                                        <div className="flex items-center capitalize">
                                            {method.name.toLowerCase() === 'cash' && <Banknote className="h-4 w-4 mr-2 text-success" />}
                                            {method.name.toLowerCase() === 'card' && <CreditCard className="h-4 w-4 mr-2 text-primary" />}
                                            {method.name.toLowerCase() === 'upi' && <Wallet className="h-4 w-4 mr-2 text-warning" />}
                                            {method.name}
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <div className="flex border border-border rounded-md overflow-hidden bg-background h-10">
                            <button
                                onClick={() => updateBill({ paymentType: 'full' })}
                                className={cn(
                                    "px-3 text-xs font-bold transition-colors border-r border-border",
                                    currentBill.paymentType === 'full' ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
                                )}
                            >
                                Full
                            </button>
                            <button
                                onClick={() => updateBill({ paymentType: 'partial' })}
                                className={cn(
                                    "px-3 text-xs font-bold transition-colors",
                                    currentBill.paymentType === 'partial' ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
                                )}
                            >
                                Partial
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                {/* Overall Discount */}
                <div className="space-y-2">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Overall Discount
                    </Label>
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium">
                                {currentBill.discountType === 'fixed' ? currency : '%'}
                            </div>
                            <Input
                                type="text"
                                placeholder="0.00"
                                value={currentBill.overallDiscount || ''}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    if (val === "" || /^\d*\.?\d*$/.test(val)) {
                                        updateBill({ overallDiscount: val === "" ? 0 : parseFloat(val) });
                                    }
                                }}
                                className="pl-7 bg-background border-border"
                            />
                        </div>
                        <div className="flex border border-border rounded-lg overflow-hidden bg-background">
                            <button
                                onClick={() => updateBill({ discountType: 'fixed' })}
                                className={cn(
                                    "px-3 py-2 text-xs font-bold transition-colors",
                                    currentBill.discountType === 'fixed' ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
                                )}
                            >
                                Fixed
                            </button>
                            <button
                                onClick={() => updateBill({ discountType: 'percentage' })}
                                className={cn(
                                    "px-3 py-2 text-xs font-bold transition-colors",
                                    currentBill.discountType === 'percentage' ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
                                )}
                            >
                                %
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Amount Tendered, Balance & COMPLETE ACTION */}
            <div className="grid grid-cols-12 gap-4 pt-4 border-t border-dashed border-border items-end">
                <div className="col-span-12">
                    <div className="flex justify-between items-center text-sm mb-2">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span className="font-medium">{currency}{subtotal.toFixed(2)}</span>
                    </div>
                    {taxResult?.total_tax > 0 && (
                        <div className="flex justify-between items-center text-sm mb-2">
                            <span className="text-muted-foreground">Tax</span>
                            <span className="font-medium">{currency}{taxResult.total_tax.toFixed(2)}</span>
                        </div>
                    )}
                    <div className="flex justify-between items-center text-lg font-bold">
                        <span>Total</span>
                        <span>{currency}{grandTotal}</span>
                    </div>
                </div>

                <div className="col-span-6 space-y-2">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Tendered
                    </Label>
                    <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium">{currency}</div>
                        <Input
                            type="text"
                            placeholder="0.00"
                            value={currentBill.amountTendered || ''}
                            onChange={(e) => updateBill({ amountTendered: e.target.value })}
                            className="pl-7 bg-background border-border font-bold text-lg text-foreground focus:ring-primary"
                        />
                    </div>
                </div>
                <div className="col-span-6 space-y-2">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        {parseFloat(currentBill.amountTendered || 0) >= parseFloat(grandTotal) ? "Change" : "Balance"}
                    </Label>
                    <div className={cn(
                        "h-11 px-3 flex items-center justify-between rounded-md border text-lg font-bold transition-colors",
                        parseFloat(currentBill.amountTendered || 0) >= parseFloat(grandTotal)
                            ? "bg-success/10 text-success border-success/20"
                            : "bg-destructive/10 text-destructive border-destructive/20"
                    )}>
                        <span className="text-xs opacity-70">{currency}</span>
                        <span>{Math.abs(parseFloat(grandTotal) - parseFloat(currentBill.amountTendered || 0)).toFixed(2)}</span>
                    </div>
                </div>
                <div className="col-span-12 mt-2">
                    {/* Complete Sale Button */}
                    <Button
                        onClick={onCompleteSale}
                        className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-md shadow-primary/20"
                        disabled={parseFloat(grandTotal) <= 0}
                    >
                        Complete Sale
                    </Button>
                </div>
            </div>

            {/* Bill Tabs */}
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Active Bill
                    </Label>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                    {Array.from({ length: tabsCount }).map((_, idx: number) => {
                        const hasItems = bills[idx]?.items?.length > 0;
                        const isActive = activeTab === idx;

                        return (
                            <button
                                key={idx}
                                onClick={() => setActiveTab(idx)}
                                className={cn(
                                    "flex items-center justify-center w-8 h-8 rounded-lg text-xs font-bold transition-all duration-200",
                                    isActive
                                        ? "bg-primary text-primary-foreground shadow-md shadow-primary/20 scale-105"
                                        : hasItems
                                            ? "bg-warning/20 text-warning border border-warning/30 hover:bg-warning/30"
                                            : "bg-muted text-muted-foreground hover:bg-muted/80 hover:scale-105"
                                )}
                            >
                                {idx + 1}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div >
    );
}
