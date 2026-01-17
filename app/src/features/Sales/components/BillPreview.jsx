
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Receipt, Printer } from "lucide-react";

export default function BillPreview({ items, customerName, paymentMethod, total, tax = 0, date }) {
    const displayDate = date ? new Date(date).toLocaleString() : new Date().toLocaleString();
    const subtotal = total; // Assuming total includes everything for now, or total is subtotal. Let's assume passed total is final.
    // Actually, usually Total = Subtotal + Tax.
    // I'll assume the passed 'items' contain prices.
    // I will calculate subtotal from items to be sure.

    const calculatedSubtotal = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const calculatedTax = calculatedSubtotal * 0.18; // Mock 18% GST
    const finalTotal = calculatedSubtotal + calculatedTax;

    return (
        <div className="flex flex-col h-full bg-slate-50 dark:bg-black/20 p-4 rounded-xl">
            <div className="flex items-center justify-between mb-4 px-2">
                <h2 className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <Receipt className="w-5 h-5" />
                    Bill Review
                </h2>
            </div>

            {/* Receipt Paper */}
            <div className="bg-white dark:bg-zinc-900 shadow-sm rounded-lg flex-1 flex flex-col overflow-hidden border border-slate-200 dark:border-zinc-800 relative">

                {/* Receipt Header */}
                <div className="p-6 pb-4 text-center border-b border-dashed border-slate-200 dark:border-zinc-800">
                    <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto mb-3">
                        P
                    </div>
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white">POSSUM Store</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        123 Commerce Avenue, Tech City
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                        +91 98765 43210
                    </p>
                </div>

                {/* Receipt Body */}
                <div className="flex-1 p-6 overflow-auto font-mono text-sm leading-relaxed">
                    <div className="flex justify-between text-slate-500 text-xs mb-4">
                        <span>{displayDate}</span>
                        <span>#ORD-{Math.floor(Math.random() * 10000)}</span>
                    </div>

                    <div className="space-y-3 mb-6">
                        <div className="flex justify-between text-slate-500 text-xs uppercase tracking-wider font-semibold border-b pb-2">
                            <span>Item</span>
                            <span>Amt</span>
                        </div>
                        {items.length === 0 ? (
                            <div className="text-center py-8 text-slate-400 italic">
                                -- Empty Bill --
                            </div>
                        ) : (
                            items.map((item, i) => (
                                <div key={i} className="flex justify-between group">
                                    <div className="flex-1 pr-4">
                                        <span className="text-slate-700 dark:text-slate-300 font-medium">{item.name}</span>
                                        <div className="text-xs text-slate-400">
                                            {item.quantity} x ₹{item.price.toFixed(2)}
                                        </div>
                                    </div>
                                    <span className="text-slate-800 dark:text-slate-200 font-medium">
                                        ₹{(item.quantity * item.price).toFixed(2)}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="border-t border-dashed border-slate-300 dark:border-zinc-700 pt-4 space-y-2">
                        <div className="flex justify-between text-slate-500">
                            <span>Subtotal</span>
                            <span>₹{calculatedSubtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-slate-500">
                            <span>Tax (18%)</span>
                            <span>₹{calculatedTax.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                {/* Receipt Footer */}
                <div className="p-6 bg-slate-50 dark:bg-zinc-800/50 border-t border-slate-200 dark:border-zinc-800">
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-lg font-bold text-slate-700 dark:text-slate-200">Total</span>
                        <span className="text-2xl font-bold text-blue-600">₹{finalTotal.toFixed(2)}</span>
                    </div>

                    {customerName && (
                        <div className="mb-4 text-xs text-slate-500 text-right">
                            Using {paymentMethod.toUpperCase()} • Customer: {customerName}
                        </div>
                    )}

                    <div className="flex gap-3">
                        <Button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white h-12 text-base shadow-lg shadow-blue-200 dark:shadow-blue-900/20">
                            Print Application
                        </Button>
                        <Button variant="outline" size="icon" className="h-12 w-12 border-slate-200 dark:border-zinc-700">
                            <Printer className="h-5 w-5 text-slate-600" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
