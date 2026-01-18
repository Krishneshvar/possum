
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
        <div className="flex flex-col h-full bg-muted/30 p-4 rounded-xl">
            <div className="flex items-center justify-between mb-4 px-2">
                <h2 className="font-semibold text-foreground flex items-center gap-2">
                    <Receipt className="w-5 h-5" />
                    Bill Review
                </h2>
            </div>

            {/* Receipt Paper */}
            <div className="bg-card shadow-sm rounded-lg flex-1 flex flex-col overflow-hidden border border-border relative">

                {/* Receipt Header */}
                <div className="p-6 pb-4 text-center border-b border-dashed border-border">
                    <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold text-xl mx-auto mb-3">
                        P
                    </div>
                    <h3 className="font-bold text-lg text-card-foreground">POSSUM Store</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                        123 Commerce Avenue, Tech City
                    </p>
                    <p className="text-xs text-muted-foreground">
                        +91 98765 43210
                    </p>
                </div>

                {/* Receipt Body */}
                <div className="flex-1 p-6 overflow-auto font-mono text-sm leading-relaxed">
                    <div className="flex justify-between text-muted-foreground text-xs mb-4">
                        <span>{displayDate}</span>
                        <span>#ORD-{Math.floor(Math.random() * 10000)}</span>
                    </div>

                    <div className="space-y-3 mb-6">
                        <div className="flex justify-between text-muted-foreground text-xs uppercase tracking-wider font-semibold border-b pb-2">
                            <span>Item</span>
                            <span>Amt</span>
                        </div>
                        {items.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground italic">
                                -- Empty Bill --
                            </div>
                        ) : (
                            items.map((item, i) => (
                                <div key={i} className="flex justify-between group">
                                    <div className="flex-1 pr-4">
                                        <span className="text-foreground font-medium">{item.name}</span>
                                        <div className="text-xs text-muted-foreground">
                                            {item.quantity} x ₹{item.price.toFixed(2)}
                                        </div>
                                    </div>
                                    <span className="text-foreground font-medium">
                                        ₹{(item.quantity * item.price).toFixed(2)}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="border-t border-dashed border-border pt-4 space-y-2">
                        <div className="flex justify-between text-muted-foreground">
                            <span>Subtotal</span>
                            <span>₹{calculatedSubtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-muted-foreground">
                            <span>Tax (18%)</span>
                            <span>₹{calculatedTax.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                {/* Receipt Footer */}
                <div className="p-6 bg-muted/50 border-t border-border">
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-lg font-bold text-foreground">Total</span>
                        <span className="text-2xl font-bold text-primary">₹{finalTotal.toFixed(2)}</span>
                    </div>

                    {customerName && (
                        <div className="mb-4 text-xs text-muted-foreground text-right">
                            Using {paymentMethod.toUpperCase()} • Customer: {customerName}
                        </div>
                    )}

                    <div className="flex gap-3">
                        <Button className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground h-12 text-base shadow-lg shadow-primary/20">
                            Print Application
                        </Button>
                        <Button variant="outline" size="icon" className="h-12 w-12 border-border">
                            <Printer className="h-5 w-5 text-muted-foreground" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
