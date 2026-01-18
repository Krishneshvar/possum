
import { useState } from 'react';
import { cn } from "@/lib/utils";
import SalesTable from '../components/SalesTable';
import SalesControls from '../components/SalesControls';
import BillPreview from '../components/BillPreview';


// Mock Data for initial view
const MOCK_PRODUCT = {
  id: 'p1',
  name: 'Wireless Headphones',
  quantity: 1,
  price: 2499.00,
  mrp: 2499.00,
  discount: 0,
  sku: 'WH-001'
};

const INITIAL_TAB_STATE = {
  items: [],
  customerName: '',
  paymentMethod: 'cash',
  overallDiscount: 0,
  discountType: 'fixed',
};

// Initialize 9 tabs
const INITIAL_BILLS = Array(9).fill(null).map((_, i) => ({
  ...INITIAL_TAB_STATE,
  id: i,
  // Pre-fill first tab for demonstration
  items: i === 0 ? [MOCK_PRODUCT, { ...MOCK_PRODUCT, id: 'p2', name: 'USB-C Cable', price: 499, mrp: 499, discount: 0, sku: 'CBL-002', quantity: 2 }] : []
}));

export default function SalesPage() {
  const [bills, setBills] = useState(INITIAL_BILLS);
  const [activeTab, setActiveTab] = useState(0);
  const [showPreview, setShowPreview] = useState(true);

  const currentBill = bills[activeTab];

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
    const newItems = currentBill.items.filter(item => item.id !== itemId);
    updateBill({ items: newItems });
  };

  const setPaymentMethod = (method) => updateBill({ paymentMethod: method });
  const setCustomerName = (name) => updateBill({ customerName: name });

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
        sku: product.sku
      };
      updateBill({ items: [...currentBill.items, newItem] });
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
            />
          </div>

          {/* Bottom Left: Controls */}
          <div className="flex-none z-10">
            <SalesControls
              paymentMethod={currentBill.paymentMethod}
              setPaymentMethod={setPaymentMethod}
              customerName={currentBill.customerName}
              setCustomerName={setCustomerName}
              overallDiscount={currentBill.overallDiscount}
              setOverallDiscount={(val) => updateBill({ overallDiscount: val })}
              discountType={currentBill.discountType}
              setDiscountType={(val) => updateBill({ discountType: val })}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              tabsCount={9}
              bills={bills}
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
              total={0} // Calculated inside component
              date={new Date()}
            />
          </div>
        )}
      </div>
    </div>
  );
}
