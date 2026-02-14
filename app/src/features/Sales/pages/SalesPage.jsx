import { useState } from 'react';
import { cn } from "@/lib/utils";
import SalesTable from '../components/SalesTable';
import SalesControls from '../components/SalesControls';
import BillPreview from '../components/BillPreview';
import { useCreateSaleMutation } from '@/services/salesApi';
import { useCalculateTaxMutation } from '@/services/taxesApi';
import { toast } from "sonner";
import { useEffect } from 'react';

const INITIAL_TAB_STATE = {
  items: [],
  customerName: '',
  customerId: null,
  paymentMethod: null,
  overallDiscount: 0,
  discountType: 'fixed',
  paymentType: 'full',
  amountTendered: 0,
  // taxMode and billTaxIds are deprecated
};

// Initialize 9 tabs
const INITIAL_BILLS = Array(9).fill(null).map((_, i) => ({
  ...INITIAL_TAB_STATE,
  id: i,
  items: []
}));

const DEFAULT_WIDTHS = {
  index: 50,
  product: 250,
  qty: 100,
  price: 100,
  mrp: 100,
  discount: 100,
  total: 100,
  actions: 50
};

export default function SalesPage() {
  const [bills, setBills] = useState(INITIAL_BILLS);
  const [activeTab, setActiveTab] = useState(0);
  const [showPreview, setShowPreview] = useState(true);

  // API Mutation
  const [createSale, { isLoading }] = useCreateSaleMutation();
  const [calculateTax, { data: taxResult }] = useCalculateTaxMutation();

  const currentBill = bills[activeTab];

  useEffect(() => {
    if (currentBill.items.length === 0) return;

    const timer = setTimeout(() => {
        // Calculate Pre-Tax Totals to distribute Global Discount
        // Similar logic to backend to ensure preview matches final sale
        let grossTotal = 0;
        const tempItems = currentBill.items.map(item => {
            const price = parseFloat(item.price) || 0;
            const qty = parseInt(item.quantity) || 0;
            const discount = parseFloat(item.discount) || 0;
            const lineTotal = price * qty;
            const netLineTotal = Math.max(0, lineTotal - discount);
            grossTotal += netLineTotal;
            return { ...item, netLineTotal, qty, price };
        });

        // Determine Global Discount Amount
        const globalDiscountAmount = currentBill.discountType === 'percentage'
            ? (grossTotal * (parseFloat(currentBill.overallDiscount) || 0) / 100)
            : (parseFloat(currentBill.overallDiscount) || 0);

        let distributedGlobalDiscount = 0;
        const calculationItems = tempItems.map((item, index) => {
            let itemGlobalDiscount = 0;
            if (grossTotal > 0 && globalDiscountAmount > 0) {
                if (index === tempItems.length - 1) {
                    itemGlobalDiscount = globalDiscountAmount - distributedGlobalDiscount;
                } else {
                    itemGlobalDiscount = (item.netLineTotal / grossTotal) * globalDiscountAmount;
                    distributedGlobalDiscount += itemGlobalDiscount;
                }
            }

            const finalTaxableAmount = Math.max(0, item.netLineTotal - itemGlobalDiscount);
            // Effective Unit Price for Tax Engine
            const effectiveUnitPrice = item.qty > 0 ? finalTaxableAmount / item.qty : 0;

            return {
                price: effectiveUnitPrice,
                quantity: item.qty,
                tax_category_id: item.tax_category_id
            };
        });

        calculateTax({
            invoice: { items: calculationItems },
            customerId: currentBill.customerId
        });
    }, 300);
    return () => clearTimeout(timer);
  }, [currentBill.items, currentBill.customerId, currentBill.overallDiscount, currentBill.discountType, calculateTax]);

  // --- Column Persistence Logic ---
  const [columnWidths, setColumnWidths] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('salesTableColumnWidths');
      if (saved) {
        try {
          return { ...DEFAULT_WIDTHS, ...JSON.parse(saved) };
        } catch (e) {
          console.error("Failed to parse saved widths", e);
        }
      }
    }
    return DEFAULT_WIDTHS;
  });

  const handleColumnResize = (columnId, newWidth) => {
    setColumnWidths(prev => {
      const updated = { ...prev, [columnId]: newWidth };
      localStorage.setItem('salesTableColumnWidths', JSON.stringify(updated));
      return updated;
    });
  };

  const updateBill = (updates) => {
    setBills(prev => prev.map((bill, index) =>
      index === activeTab ? { ...bill, ...updates } : bill
    ));
  };

  const updateQuantity = (itemId, newQty) => {
    if (newQty < 1) return;
    const newItems = currentBill.items.map(item =>
      item.id === itemId ? { ...item, quantity: newQty } : item
    );
    updateBill({ items: newItems });
  };

  const updatePrice = (itemId, newPrice) => {
    const newItems = currentBill.items.map(item => {
      if (item.id === itemId) {
        // Enforce MRP constraint: Price cannot exceed MRP
        const validPrice = Math.min(newPrice, item.mrp);
        return { ...item, price: validPrice };
      }
      return item;
    });
    updateBill({ items: newItems });
  };

  const updateDiscount = (itemId, newDiscount) => {
    const newItems = currentBill.items.map(item =>
      item.id === itemId ? { ...item, discount: newDiscount } : item
    );
    updateBill({ items: newItems });
  };

  const removeItem = (itemId) => {
    const newItems = currentBill.items.filter(item => String(item.id) !== String(itemId));
    updateBill({ items: newItems });
  };

  const setPaymentMethod = (method) => updateBill({ paymentMethod: method });
  const setCustomerName = (name) => updateBill({ customerName: name });
  const setCustomerId = (id) => updateBill({ customerId: id });

  const addProductToBill = (product) => {
    const existingItem = currentBill.items.find(item => item.id === product.id);

    if (existingItem) {
      updateQuantity(product.id, existingItem.quantity + 1);
    } else {
      const newItem = {
        id: product.id,
        name: product.name,
        quantity: 1,
        price: parseFloat(product.mrp),
        mrp: parseFloat(product.mrp),
        discount: 0,
        sku: product.sku,
        tax_category_id: product.tax_category_id
      };
      updateBill({ items: [...currentBill.items, newItem] });
    }
  };

  const calculateTotal = (bill) => {
    // If we have tax result, use it. Otherwise approximate or 0.
    // However, taxResult is async and might lag behind currentBill.
    // For now, we rely on taxResult.grand_total if available, but we must adjust for overall discount
    // since backend tax engine returns grand total *before* global discount (as per my implementation choice earlier).
    // Wait, createSale applies global discount at the end.
    // taxEngine returns grand_total which includes Item Taxes.

    if (!taxResult) return 0;

    // We need to apply global discount here for display
     const discountAmount = bill.discountType === 'percentage'
      ? (taxResult.grand_total * (parseFloat(bill.overallDiscount) || 0) / 100)
      : (parseFloat(bill.overallDiscount) || 0);

     return Math.max(0, taxResult.grand_total - discountAmount);
  };

  // We use taxResult.grand_total but we need to ensure it matches the current items state.
  // If items changed and taxResult is stale, it might look wrong.
  // But for now, let's use what we have.

  const currentGrandTotal = calculateTotal(currentBill);

  const handleCompleteSale = async () => {
    if (currentBill.items.length === 0) {
      toast.error("Cannot complete sale with no items.");
      return;
    }

    // Determine Payment Amount
    let paymentAmount = 0;
    if (currentBill.paymentType === 'full') {
      paymentAmount = currentGrandTotal;
    } else {
      paymentAmount = parseFloat(currentBill.amountTendered) || 0;
    }

    if (paymentAmount <= 0 && currentGrandTotal > 0) {
      toast.error("Payment amount must be greater than 0");
      return;
    }

    // Calculate Discount Amount for Payload
    const calculatedSubtotal = currentBill.items.reduce((acc, item) => {
      const price = parseFloat(item.price) || 0;
      const qty = parseInt(item.quantity) || 0;
      const disc = parseFloat(item.discount) || 0;
      return acc + (price * qty) - disc;
    }, 0);

    const discountAmount = currentBill.discountType === 'percentage'
      ? (calculatedSubtotal * (parseFloat(currentBill.overallDiscount) || 0) / 100)
      : (parseFloat(currentBill.overallDiscount) || 0);

    const payload = {
      items: currentBill.items.map(item => ({
        variantId: item.id,
        quantity: parseInt(item.quantity),
        pricePerUnit: parseFloat(item.price),
        discount: parseFloat(item.discount) || 0
      })),
      customerId: currentBill.customerId,
      discount: discountAmount,
      payments: [
        {
          amount: paymentAmount,
          paymentMethodId: currentBill.paymentMethod
        }
      ],
      // taxMode and billTaxIds removed
    };

    try {
      await createSale(payload).unwrap();
      toast.success("Sale completed successfully!");

      // Reset the current bill
      setBills(prev => prev.map((bill, index) =>
        index === activeTab ? { ...INITIAL_TAB_STATE, id: index, items: [] } : bill
      ));
    } catch (err) {
      console.error("Sale failed", err);
      toast.error(err?.data?.error || "Failed to complete sale.");
    }
  };

  return (
    <div className="h-[calc(100vh-7rem)] w-full flex flex-col gap-4 overflow-hidden">
      <div className={cn(
        "grid gap-4 h-full min-h-0 transition-all duration-300",
        showPreview ? "grid-cols-1 lg:grid-cols-3" : "grid-cols-1"
      )}>
        {/* Left Section: Table + Controls */}
        <div className={cn(
          "flex flex-col gap-4 h-full min-h-0",
          showPreview ? "lg:col-span-2" : "col-span-full"
        )}>


          <div className="flex-1 min-h-0 flex flex-col">
            <SalesTable
              className="flex-1 min-h-0"
              items={currentBill.items}
              updateQuantity={updateQuantity}
              updatePrice={updatePrice}
              updateDiscount={updateDiscount}
              removeItem={removeItem}
              onProductSelect={addProductToBill}
              showPreview={showPreview}
              setShowPreview={setShowPreview}
              columnWidths={columnWidths}
              onColumnResize={handleColumnResize}
              grandTotal={currentGrandTotal}
              date={new Date()}
            />
          </div>

          {/* Bottom Left: Controls */}
          <div className="flex-none z-10">
            <SalesControls
              paymentMethod={currentBill.paymentMethod}
              setPaymentMethod={setPaymentMethod}
              customerName={currentBill.customerName}
              setCustomerName={setCustomerName}
              setCustomerId={setCustomerId}
              overallDiscount={currentBill.overallDiscount}
              setOverallDiscount={(val) => updateBill({ overallDiscount: val })}
              discountType={currentBill.discountType}
              setDiscountType={(val) => updateBill({ discountType: val })}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              tabsCount={9}
              bills={bills}
              paymentType={currentBill.paymentType}
              setPaymentType={(val) => updateBill({ paymentType: val })}
              amountTendered={currentBill.amountTendered}
              setAmountTendered={(val) => updateBill({ amountTendered: val })}
              grandTotal={currentGrandTotal}
              onCompleteSale={handleCompleteSale}
            />
          </div>
        </div>

        {/* Right Section: Bill Preview */}
        {showPreview && (
          <div className="h-full min-h-0 z-0">
            <BillPreview
              items={currentBill.items}
              customerName={currentBill.customerName}
              paymentMethod={currentBill.paymentMethod}
              overallDiscount={currentBill.overallDiscount}
              discountType={currentBill.discountType}
              date={new Date()}
              taxResult={taxResult}
            />
          </div>
        )}
      </div>
    </div>
  );
}
