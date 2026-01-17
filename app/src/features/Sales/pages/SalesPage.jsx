
import { useState } from 'react';
import SalesTable from '../components/SalesTable';
import SalesControls from '../components/SalesControls';
import BillPreview from '../components/BillPreview';
import ProductSelector from '../components/ProductSelector';

// Mock Data for initial view
const MOCK_PRODUCT = {
  id: 'p1',
  name: 'Wireless Headphones',
  quantity: 1,
  price: 2499.00,
  sku: 'WH-001'
};

const INITIAL_TAB_STATE = {
  items: [],
  customerName: '',
  paymentMethod: 'cash',
};

// Initialize 9 tabs
const INITIAL_BILLS = Array(9).fill(null).map((_, i) => ({
  ...INITIAL_TAB_STATE,
  id: i,
  // Pre-fill first tab for demonstration
  items: i === 0 ? [MOCK_PRODUCT, { ...MOCK_PRODUCT, id: 'p2', name: 'USB-C Cable', price: 499, sku: 'CBL-002', quantity: 2 }] : []
}));

export default function SalesPage() {
  const [bills, setBills] = useState(INITIAL_BILLS);
  const [activeTab, setActiveTab] = useState(0);

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
        price: parseFloat(product.price),
        sku: product.sku
      };
      updateBill({ items: [...currentBill.items, newItem] });
    }
  };

  return (
    <div className="h-[calc(100vh-6rem)] w-full flex flex-col gap-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full">
        {/* Left Section: Table + Controls */}
        <div className="lg:col-span-2 flex flex-col gap-4 h-full">
          {/* Top: Product Selector */}
          <div className="flex-none z-30">
            <ProductSelector onProductSelect={addProductToBill} />
          </div>

          {/* Top Left: Dynamic Table */}
          <div className="flex-1 min-h-0">
            <SalesTable
              items={currentBill.items}
              updateQuantity={updateQuantity}
              removeItem={removeItem}
            />
          </div>

          {/* Bottom Left: Controls */}
          <div className="flex-none z-10">
            <SalesControls
              paymentMethod={currentBill.paymentMethod}
              setPaymentMethod={setPaymentMethod}
              customerName={currentBill.customerName}
              setCustomerName={setCustomerName}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              tabsCount={9}
            />
          </div>
        </div>

        {/* Right Section: Bill Preview */}
        <div className="h-full min-h-0 z-0">
          <BillPreview
            items={currentBill.items}
            customerName={currentBill.customerName}
            paymentMethod={currentBill.paymentMethod}
            total={0} // Calculated inside component
            date={new Date()}
          />
        </div>
      </div>
    </div>
  );
}
