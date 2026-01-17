
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
    tabsCount = 9
}) {
    return (
        <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-slate-200 dark:border-zinc-800 p-5 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Customer Name */}
                <div className="space-y-2">
                    <Label htmlFor="customer" className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Customer Details
                    </Label>
                    <div className="relative">
                        <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <Input
                            id="customer"
                            placeholder="Walk-in Customer"
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                            className="pl-9 bg-slate-50 dark:bg-zinc-800/50 border-slate-200 dark:border-zinc-700"
                        />
                    </div>
                </div>

                {/* Payment Method */}
                <div className="space-y-2">
                    <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Payment Method
                    </Label>
                    <div className="grid grid-cols-3 gap-2">
                        <Button
                            variant={paymentMethod === 'cash' ? 'default' : 'outline'}
                            className={cn("h-10 px-2", paymentMethod === 'cash' && "bg-emerald-600 hover:bg-emerald-700 text-white")}
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
                    <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Active Bill
                    </Label>
                    <span className="text-xs text-slate-400">
                        Tab {activeTab + 1}
                    </span>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                    {Array.from({ length: tabsCount }).map((_, idx) => (
                        <button
                            key={idx}
                            onClick={() => setActiveTab(idx)}
                            className={cn(
                                "flex items-center justify-center w-10 h-10 rounded-lg text-sm font-bold transition-all duration-200",
                                activeTab === idx
                                    ? "bg-blue-600 text-white shadow-md shadow-blue-200 dark:shadow-blue-900/20 scale-105"
                                    : "bg-slate-100 dark:bg-zinc-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-zinc-700 hover:scale-105"
                            )}
                        >
                            {idx + 1}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
