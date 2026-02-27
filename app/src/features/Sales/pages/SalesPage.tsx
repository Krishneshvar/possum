import { useState, useEffect } from 'react';
import { useCurrency } from "@/hooks/useCurrency";
import SalesTable from '../components/SalesTable';
import BillingSection from '../components/BillingSection';
import { useGetVariantsQuery } from "@/services/productsApi";
import { useGetPaymentMethodsQuery, useCreateSaleMutation } from "@/services/salesApi";
import { useGetCustomersQuery } from "@/services/customersApi";
import { useCalculateTaxMutation } from "@/services/taxesApi";
import { toast } from "sonner";
import { useMultiBillState, type SaleItem } from '../hooks/useMultiBillState';
import { calculateItemDiscountAmount, calculateItemTotal, calculateCartSubtotal, calculateOverallDiscount } from '../utils/salesCalculations';

function parseCustomerId(value: string): number | undefined {
    if (!value || value === 'walk-in') {
        return undefined;
    }
    const parsed = Number.parseInt(value, 10);
    return Number.isNaN(parsed) ? undefined : parsed;
}

export default function SalesPage() {
    const currency = useCurrency();
    const { activeTab, setActiveTab, bills, currentBill, updateBill, resetCurrentBill, tabsCount } = useMultiBillState(9);

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



    // Trigger tax calculation when cart changes
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (currentBill.items.length === 0) {
                if (currentBill.taxResult) updateBill({ taxResult: null });
                return;
            }

            let grossTotal = 0;
            const tempItems = currentBill.items.map(item => {
                const lineTotal = item.pricePerUnit * item.quantity;
                const lineDiscount = calculateItemDiscountAmount(item);
                const netLineTotal = Math.max(0, lineTotal - lineDiscount);
                grossTotal += netLineTotal;
                return { ...item, netLineTotal };
            });

            let distributedGlobalDiscount = 0;
            const globalDiscountToDistribute = calculateOverallDiscount(grossTotal, currentBill.discountType, currentBill.overallDiscount);

            const invoiceItems = tempItems.map((item, i) => {
                let itemGlobalDiscount = 0;
                if (grossTotal > 0 && globalDiscountToDistribute > 0) {
                    if (i === tempItems.length - 1) {
                        itemGlobalDiscount = globalDiscountToDistribute - distributedGlobalDiscount;
                    } else {
                        itemGlobalDiscount = (item.netLineTotal / grossTotal) * globalDiscountToDistribute;
                        distributedGlobalDiscount += itemGlobalDiscount;
                    }
                }
                const finalTaxableAmount = Math.max(0, item.netLineTotal - itemGlobalDiscount);
                const effectiveUnitPrice = item.quantity > 0 ? finalTaxableAmount / item.quantity : 0;

                return {
                    product_id: item.productId || item.id,
                    variant_id: item.variantId,
                    quantity: item.quantity,
                    price: effectiveUnitPrice,
                    product_name: item.product_name || item.name,
                    variant_name: item.variant_name
                };
            });

            const invoice = {
                items: invoiceItems,
                discount_total: 0
            };

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

    const taxResult = currentBill.taxResult || {};
    const subtotal = calculateCartSubtotal(currentBill.items);
    const discountAmount = calculateOverallDiscount(subtotal, currentBill.discountType, currentBill.overallDiscount);
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

        const tenderedAmt = parseFloat(currentBill.amountTendered || '0');
        const grandTotalNum = parseFloat(grandTotal);

        if (!currentBill.amountTendered || isNaN(tenderedAmt)) {
            toast.error('Please enter the tendered amount');
            return;
        }

        if (currentBill.paymentType === 'full' && tenderedAmt < grandTotalNum) {
            toast.error(`Tendered amount must be at least ${currency}${grandTotal} for a full payment.`);
            return;
        }

        if (currentBill.paymentType === 'partial' && tenderedAmt <= 0) {
            toast.error('Please enter a valid amount for partial payment.');
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
            resetCurrentBill();
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
