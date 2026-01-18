
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
import { CreditCard, Wallet, Banknote, User } from "lucide-react";
import { cn } from "@/lib/utils";

export default function SalesControls({
    paymentMethod,
    setPaymentMethod,
    customerName,
    setCustomerName,
    activeTab,
    setActiveTab,
    overallDiscount,
    setOverallDiscount,
    discountType,
    setDiscountType,
    tabsCount = 9,
    bills = []
}) {
    return (
        <div className="bg-card rounded-xl shadow-sm border border-border p-5 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Customer Name */}
                <div className="space-y-2">
                    <Label htmlFor="customer" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Customer Details
                    </Label>
                    <div className="relative">
                        <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            id="customer"
                            placeholder="Walk-in Customer"
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                            className="pl-9 bg-background border-border"
                        />
                    </div>
                </div>

                {/* Payment Method */}
                <div className="space-y-2">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Payment Method
                    </Label>
                    <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                        <SelectTrigger className="bg-background border-border">
                            <SelectValue placeholder="Select Payment Method" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="cash">
                                <div className="flex items-center">
                                    <Banknote className="h-4 w-4 mr-2 text-success" />
                                    Cash
                                </div>
                            </SelectItem>
                            <SelectItem value="card">
                                <div className="flex items-center">
                                    <CreditCard className="h-4 w-4 mr-2 text-primary" />
                                    Card
                                </div>
                            </SelectItem>
                            <SelectItem value="upi">
                                <div className="flex items-center">
                                    <Wallet className="h-4 w-4 mr-2 text-warning" />
                                    UPI
                                </div>
                            </SelectItem>
                        </SelectContent>
                    </Select>
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
                                    "flex items-center justify-center w-10 h-10 rounded-lg text-sm font-bold transition-all duration-200",
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
