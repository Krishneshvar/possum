
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
                    <div className="grid grid-cols-3 gap-2">
                        <Button
                            variant={paymentMethod === 'cash' ? 'default' : 'outline'}
                            className={cn("h-10 px-2", paymentMethod === 'cash' && "bg-success hover:bg-success/90 text-white")}
                            onClick={() => setPaymentMethod('cash')}
                        >
                            <Banknote className="h-4 w-4 mr-1.5" />
                            Cash
                        </Button>
                        <Button
                            variant={paymentMethod === 'card' ? 'default' : 'outline'}
                            className="h-10 px-2"
                            onClick={() => setPaymentMethod('card')}
                        >
                            <CreditCard className="h-4 w-4 mr-1.5" />
                            Card
                        </Button>
                        <Button
                            variant={paymentMethod === 'upi' ? 'default' : 'outline'}
                            className="h-10 px-2"
                            onClick={() => setPaymentMethod('upi')}
                        >
                            <Wallet className="h-4 w-4 mr-1.5" />
                            UPI
                        </Button>
                    </div>
                </div>
            </div>

            {/* Bill Tabs */}
            <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Active Bill
                    </Label>
                    <span className="text-xs text-muted-foreground">
                        Tab {activeTab + 1}
                    </span>
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
