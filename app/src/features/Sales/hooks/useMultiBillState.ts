/**
 * Multi-Bill State Management Hook
 * Extracts complex state logic from SalesPage component
 */
import { useState } from 'react';

export interface SaleItem {
    id: number;
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

export interface Bill {
    items: SaleItem[];
    customerId: string;
    discountType: 'fixed' | 'percentage';
    overallDiscount: number;
    paymentMethod: string;
    paymentType: 'full' | 'partial';
    amountTendered: string;
    searchTerm: string;
    quantity: number;
    selectedPrice: number;
    selectedDiscountType: 'amount' | 'percentage';
    selectedDiscountValue: number;
    selectedProduct: any;
    selectedVariant: string;
    taxResult: any;
}

const createEmptyBill = (): Bill => ({
    items: [],
    customerId: '',
    discountType: 'fixed',
    overallDiscount: 0,
    paymentMethod: '',
    paymentType: 'full',
    amountTendered: '',
    searchTerm: '',
    quantity: 1,
    selectedPrice: 0,
    selectedDiscountType: 'amount',
    selectedDiscountValue: 0,
    selectedProduct: null,
    selectedVariant: '',
    taxResult: null
});

export function useMultiBillState(tabsCount: number = 9) {
    const [activeTab, setActiveTab] = useState(0);
    const [bills, setBills] = useState<Bill[]>(
        Array.from({ length: tabsCount }, createEmptyBill)
    );

    const currentBill = bills[activeTab];

    const updateBill = (updates: Partial<Bill>) => {
        setBills(prev => {
            const newBills = [...prev];
            newBills[activeTab] = { ...newBills[activeTab], ...updates };
            return newBills;
        });
    };

    const resetCurrentBill = () => {
        updateBill(createEmptyBill());
    };

    return {
        activeTab,
        setActiveTab,
        bills,
        currentBill,
        updateBill,
        resetCurrentBill,
        tabsCount
    };
}
