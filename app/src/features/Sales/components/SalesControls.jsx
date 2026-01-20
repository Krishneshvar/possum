import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
// Tabs imports removed as we use custom buttons for bill switching
import { CreditCard, Wallet, Banknote, User, Search, Loader2, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useGetCustomersQuery } from "@/services/customersApi";
import { useGetPaymentMethodsQuery } from "@/services/salesApi";

// Helper hook for debouncing
function useLocalDebounce(value, delay) {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(handler);
    }, [value, delay]);
    return debouncedValue;
}

export default function SalesControls({
    paymentMethod,
    setPaymentMethod,
    customerName,
    setCustomerName,
    setCustomerId,
    activeTab,
    setActiveTab,
    overallDiscount,
    setOverallDiscount,
    discountType,
    setDiscountType,
    tabsCount = 9,
    bills = [],
    paymentType,
    setPaymentType,
    amountTendered,
    setAmountTendered,
    grandTotal = 0,
    onCompleteSale
}) {
    // --- Customer Search Logic ---
    const [searchTerm, setSearchTerm] = useState(customerName || "");
    const [isOpen, setIsOpen] = useState(false);
    const [focusedIndex, setFocusedIndex] = useState(-1);
    const wrapperRef = useRef(null);
    const inputRef = useRef(null);

    const debouncedSearch = useLocalDebounce(searchTerm, 300);

    const { data, isLoading, isFetching } = useGetCustomersQuery(
        { searchTerm: debouncedSearch || "" }
    );

    const customers = data?.customers || [];

    // Sync searchTerm with customerName prop (when switching tabs)
    useEffect(() => {
        setSearchTerm(customerName || "");
    }, [customerName, activeTab]);

    useEffect(() => {
        function handleClickOutside(event) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelect = (customer) => {
        setCustomerName(customer.name);
        if (setCustomerId) setCustomerId(customer.id);
        setSearchTerm(customer.name);
        setIsOpen(false);
        setFocusedIndex(-1);
    };

    const handleKeyDown = (e) => {
        if (!isOpen) {
            if (e.key === 'ArrowDown') setIsOpen(true);
            return;
        }

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setFocusedIndex(prev => Math.min(prev + 1, customers.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setFocusedIndex(prev => Math.max(prev - 1, -1));
        } else if (e.key === 'Enter') {
            if (focusedIndex >= 0 && customers[focusedIndex]) {
                e.preventDefault();
                handleSelect(customers[focusedIndex]);
            }
        } else if (e.key === 'Escape') {
            setIsOpen(false);
        }
    };

    // Switching payment types now defaults to 0 as per request
    const handlePaymentTypeChange = (type) => {
        setPaymentType(type);
        setAmountTendered(0);
    };

    const handleAmountChange = (e) => {
        const val = e.target.value;
        if (val === "" || /^\d*\.?\d*$/.test(val)) {
            let numVal = val === "" ? 0 : parseFloat(val);

            // If partial, must be LESS than grand total
            if (paymentType === 'partial' && numVal >= grandTotal && grandTotal > 0) {
                // Cap it to just below grand total
                numVal = grandTotal - 0.01;
            }

            setAmountTendered(numVal);
        }
    };

    // --- Payment Methods Logic ---
    const { data: paymentMethodsData } = useGetPaymentMethodsQuery();
    const paymentMethods = paymentMethodsData || [];

    // Set default payment method if not set
    useEffect(() => {
        if (!paymentMethod && paymentMethods.length > 0) {
            // Default to Cash if available, otherwise first one
            const cashMethod = paymentMethods.find(m => m.name.toLowerCase() === 'cash');
            setPaymentMethod(cashMethod ? String(cashMethod.id) : String(paymentMethods[0].id));
        }
    }, [paymentMethods, paymentMethod, setPaymentMethod]);

    return (
        <div className="bg-card rounded-xl shadow-sm border border-border p-5 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Customer Name */}
                <div className="space-y-2">
                    <Label htmlFor="customer" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Customer Details
                    </Label>
                    <div className="relative" ref={wrapperRef}>
                        <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground z-10" />
                        <Input
                            id="customer"
                            ref={inputRef}
                            placeholder="Walk-in Customer"
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setCustomerName(e.target.value); // Keep sync for walk-in
                                setIsOpen(true);
                            }}
                            onFocus={() => setIsOpen(true)}
                            onKeyDown={handleKeyDown}
                            className="pl-9 bg-background border-border"
                        />
                        {(isLoading || isFetching) && (
                            <div className="absolute right-3 top-2.5">
                                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                            </div>
                        )}

                        {/* Dropdown Results */}
                        {isOpen && (customers.length > 0 || searchTerm.length > 0) && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-popover rounded-md shadow-xl border border-border max-h-[250px] overflow-auto z-50 p-1">
                                {customers.length === 0 && !isLoading && !isFetching ? (
                                    <div className="p-3 text-center text-sm text-muted-foreground">
                                        No customers found.
                                    </div>
                                ) : (
                                    <div className="space-y-1">
                                        {customers.map((c, index) => (
                                            <button
                                                key={c.id}
                                                onClick={() => handleSelect(c)}
                                                className={cn(
                                                    "w-full flex items-center justify-between p-2 rounded-md transition-colors text-left outline-none",
                                                    index === focusedIndex ? "bg-accent text-accent-foreground" : "hover:bg-accent"
                                                )}
                                            >
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-medium text-sm text-foreground truncate">{c.name}</div>
                                                    <div className="text-xs text-muted-foreground">{c.phone || c.email || 'No contact info'}</div>
                                                </div>
                                                {c.id && <div className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground ml-2">ID: {c.id}</div>}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Payment Method */}
                <div className="space-y-2">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Payment Method
                    </Label>
                    <div className="flex gap-2">
                        <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                            <SelectTrigger className="bg-background border-border flex-1">
                                <SelectValue placeholder="Method" />
                            </SelectTrigger>
                            <SelectContent>
                                {paymentMethods.map((method) => (
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
                                onClick={() => handlePaymentTypeChange('full')}
                                className={cn(
                                    "px-3 text-xs font-bold transition-colors border-r border-border",
                                    paymentType === 'full' ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
                                )}
                            >
                                Full
                            </button>
                            <button
                                onClick={() => handlePaymentTypeChange('partial')}
                                className={cn(
                                    "px-3 text-xs font-bold transition-colors",
                                    paymentType === 'partial' ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
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
                                {discountType === 'fixed' ? '₹' : '%'}
                            </div>
                            <Input
                                type="text"
                                placeholder="0.00"
                                value={overallDiscount || ''}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    if (val === "" || /^\d*\.?\d*$/.test(val)) {
                                        setOverallDiscount(val === "" ? 0 : parseFloat(val));
                                    }
                                }}
                                className="pl-7 bg-background border-border"
                            />
                        </div>
                        <div className="flex border border-border rounded-lg overflow-hidden bg-background">
                            <button
                                onClick={() => setDiscountType('fixed')}
                                className={cn(
                                    "px-3 py-2 text-xs font-bold transition-colors",
                                    discountType === 'fixed' ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
                                )}
                            >
                                Fixed
                            </button>
                            <button
                                onClick={() => setDiscountType('percentage')}
                                className={cn(
                                    "px-3 py-2 text-xs font-bold transition-colors",
                                    discountType === 'percentage' ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
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
                <div className="col-span-4 space-y-2">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Amount Tendered
                    </Label>
                    <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium">₹</div>
                        <Input
                            type="text"
                            placeholder="0.00"
                            value={amountTendered || ''}
                            onChange={handleAmountChange}
                            className="pl-7 bg-background border-border font-bold text-lg text-foreground focus:ring-primary"
                        />
                    </div>
                </div>
                <div className="col-span-4 space-y-2">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        {parseFloat(amountTendered || 0) >= parseFloat(grandTotal) ? "Change" : "Balance Due"}
                    </Label>
                    <div className={cn(
                        "h-11 px-3 flex items-center justify-between rounded-md border text-lg font-bold transition-colors",
                        parseFloat(amountTendered || 0) >= parseFloat(grandTotal)
                            ? "bg-success/10 text-success border-success/20"
                            : "bg-destructive/10 text-destructive border-destructive/20"
                    )}>
                        <span className="text-xs opacity-70">₹</span>
                        <span>{Math.abs(parseFloat(grandTotal) - parseFloat(amountTendered || 0)).toFixed(2)}</span>
                    </div>
                </div>
                <div className="col-span-4">
                    {/* Complete Sale Button */}
                    <Button
                        onClick={onCompleteSale}
                        className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-md shadow-primary/20"
                        disabled={grandTotal <= 0}
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
                    {Array.from({ length: tabsCount }).map((_, idx) => {
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
        </div>
    );
}
