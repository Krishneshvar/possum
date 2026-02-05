import { useState, useEffect } from 'react';
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Receipt, Printer } from "lucide-react";
import { useCurrency } from "@/hooks/useCurrency";

export default function BillPreview({ items, customerName, paymentMethod, overallDiscount = 0, discountType = 'fixed', date, taxMode = 'item', billTaxIds = [], taxes }) {
    const currency = useCurrency();
    const displayDate = date ? new Date(date).toLocaleString() : new Date().toLocaleString();
    const [billSettings, setBillSettings] = useState(null);

    useEffect(() => {
        if (window.electronAPI) {
            window.electronAPI.getBillSettings().then(setBillSettings);
        }
    }, []);

    // Get active header options from settings
    const headerOptions = billSettings?.sections?.find(s => s.id === 'storeHeader')?.options || {};
    const isHeaderVisible = billSettings?.sections?.find(s => s.id === 'storeHeader')?.visible !== false;

    let individualTaxes = {};
    let totalTax = 0;
    let totalBaseAmount = 0;

    let billTaxRules = [];
    if (taxMode === 'bill' && billTaxIds?.length > 0 && taxes) {
        billTaxRules = taxes.filter(t => billTaxIds.includes(parseInt(t.id)));
    }

    items.forEach((item) => {
        const price = parseFloat(item.price) || 0;
        const qty = parseInt(item.quantity) || 0;
        const disc = parseFloat(item.discount) || 0;
        const itemSubtotal = (price * qty) - disc;

        const itemTaxes = taxMode === 'bill' ? billTaxRules : (item.taxes || []);

        const inclusiveTaxRate = itemTaxes
            .filter(t => t.type === 'inclusive')
            .reduce((sum, t) => sum + (parseFloat(t.rate) || 0), 0) / 100;

        const exclusiveTaxRate = itemTaxes
            .filter(t => t.type === 'exclusive')
            .reduce((sum, t) => sum + (parseFloat(t.rate) || 0), 0) / 100;

        const baseAmount = itemSubtotal / (1 + inclusiveTaxRate);

        // Calculate each tax component for this item
        itemTaxes.forEach(t => {
            let taxAmt = 0;
            if (t.type === 'inclusive') {
                const rate = (parseFloat(t.rate) || 0) / 100;
                // Since baseAmount = itemSubtotal / (1 + totalInclusiveRate)
                // This specific tax's portion is (baseAmount * rate)
                taxAmt = baseAmount * rate;
            } else {
                const rate = (parseFloat(t.rate) || 0) / 100;
                taxAmt = baseAmount * rate;
            }
            individualTaxes[t.name] = (individualTaxes[t.name] || 0) + taxAmt;
            totalTax += taxAmt;
        });

        totalBaseAmount += baseAmount;
    });

    const discountAmount = discountType === 'percentage'
        ? (totalBaseAmount * (parseFloat(overallDiscount) || 0) / 100)
        : (parseFloat(overallDiscount) || 0);

    const finalTotal = Math.max(0, (totalBaseAmount + totalTax) - discountAmount);

    const renderSection = (section) => {
        if (!section.visible) return null;

        const { options } = section;
        const alignStyle = { textAlign: options.alignment || 'left' };
        const fontSizeClass = options.fontSize === 'small' ? 'text-xs' : options.fontSize === 'large' ? 'text-lg font-bold' : 'text-sm';
        const commonStyle = { ...alignStyle };

        switch (section.type) {
            case 'header':
                return (
                    <div key={section.id} className="p-6 pb-4 border-b border-dashed border-border" style={commonStyle}>
                        <div className="flex flex-col" style={{ alignItems: options.alignment === 'left' ? 'flex-start' : options.alignment === 'right' ? 'flex-end' : 'center' }}>
                            {options.showLogo && options.logoUrl ? (
                                <img src={options.logoUrl} className="max-w-12 max-h-12 mb-3" />
                            ) : (
                                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold text-xl mb-3">
                                    {options.storeName?.[0] || 'P'}
                                </div>
                            )}
                            <h3 className="font-bold text-lg text-card-foreground">
                                {options.storeName || "POSSUM Store"}
                            </h3>
                            {options.storeDetails && (
                                <p className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap">
                                    {options.storeDetails}
                                </p>
                            )}
                            {options.phone && (
                                <p className="text-xs text-muted-foreground">Ph: {options.phone}</p>
                            )}
                            {options.gst && (
                                <p className="text-xs text-muted-foreground uppercase">GST: {options.gst}</p>
                            )}
                        </div>
                    </div>
                );

            case 'meta':
                return (
                    <div key={section.id} className="px-6 py-4 font-mono text-xs border-b border-dashed border-border" style={commonStyle}>
                        <div className="flex justify-between mb-1">
                            <span className="font-bold">Date:</span>
                            <span>{displayDate}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="font-bold">Bill No:</span>
                            <span>#ORD-{Math.floor(Math.random() * 10000)}</span>
                        </div>
                        {customerName && (
                            <div className="flex justify-between mt-1">
                                <span className="font-bold">Customer:</span>
                                <span className="truncate ml-2">{customerName}</span>
                            </div>
                        )}
                    </div>
                );

            case 'items':
                return (
                    <div key={section.id} className="px-6 py-4 font-mono" style={commonStyle}>
                        <div className={`space-y-3 ${fontSizeClass}`}>
                            <div className="flex justify-between text-muted-foreground text-xs uppercase tracking-wider font-bold border-b pb-2">
                                <span>Item</span>
                                <span>Amt</span>
                            </div>
                            {items.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground italic">-- Empty Bill --</div>
                            ) : (
                                items.map((item, i) => (
                                    <div key={i} className="flex justify-between group">
                                        <div className="flex-1 pr-4">
                                            <span className="text-foreground font-medium">{item.name}</span>
                                            <div className="text-xs text-muted-foreground">
                                                {item.quantity} x {currency}{(parseFloat(item.price) || 0).toFixed(2)}
                                                {(parseFloat(item.discount) || 0) > 0 && <span className="text-destructive ml-1">(-{currency}{(parseFloat(item.discount) || 0).toFixed(2)})</span>}
                                            </div>
                                        </div>
                                        <span className="text-foreground font-medium">
                                            {currency}{(((parseFloat(item.price) || 0) * (parseInt(item.quantity) || 0)) - (parseFloat(item.discount) || 0)).toFixed(2)}
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                );

            case 'totals':
                return (
                    <div key={section.id} className={`px-6 py-4 font-mono border-t border-dashed border-border space-y-2 ${fontSizeClass}`} style={commonStyle}>
                        <div className="flex justify-between text-muted-foreground">
                            <span>Subtotal</span>
                            <span>{currency}{totalBaseAmount.toFixed(2)}</span>
                        </div>

                        {/* Separate Taxes */}
                        {Object.entries(individualTaxes).map(([name, amount]) => (
                            <div key={name} className="flex justify-between text-muted-foreground text-xs italic">
                                <span>{name}</span>
                                <span>{currency}{amount.toFixed(2)}</span>
                            </div>
                        ))}

                        {discountAmount > 0 && (
                            <div className="flex justify-between text-destructive">
                                <span>Discount {discountType === 'percentage' ? `(${overallDiscount}%)` : ''}</span>
                                <span>-{currency}{discountAmount.toFixed(2)}</span>
                            </div>
                        )}

                        <div className="pt-2 border-t border-dashed border-border flex justify-between items-center">
                            <span className="text-lg font-bold">Total</span>
                            <span className="text-2xl font-bold text-primary">{currency}{finalTotal.toFixed(2)}</span>
                        </div>
                    </div>
                );

            case 'footer':
                return (
                    <div key={section.id} className="px-6 py-6 bg-muted/20 border-t border-border mt-auto" style={commonStyle}>
                        <p className={`text-muted-foreground whitespace-pre-wrap ${fontSizeClass}`}>
                            {options.text || "Thank you for your visit!"}
                        </p>
                    </div>
                );

            default:
                return null;
        }
    };

    const sections = billSettings?.sections || [
        { id: 'storeHeader', type: 'header', visible: true, options: { alignment: 'center' } },
        { id: 'billMeta', type: 'meta', visible: true, options: { alignment: 'left' } },
        { id: 'itemsTable', type: 'items', visible: true, options: { alignment: 'left' } },
        { id: 'totals', type: 'totals', visible: true, options: { alignment: 'right' } },
        { id: 'footer', type: 'footer', visible: true, options: { alignment: 'center' } }
    ];

    return (
        <div className="flex flex-col h-full border bg-muted/30 p-4 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between mb-4 px-2">
                <h2 className="font-semibold text-foreground flex items-center gap-2">
                    <Receipt className="w-5 h-5" />
                    Bill Preview
                </h2>
            </div>

            {/* Receipt Paper */}
            <div className="bg-card shadow-sm rounded-lg flex-1 flex flex-col overflow-y-auto border border-border relative">
                {sections.map(renderSection)}
            </div>

            <div className="mt-4 flex gap-3">
                <Button className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground h-12 text-base shadow-lg shadow-primary/20">
                    Print Application
                </Button>
                <Button variant="outline" size="icon" className="h-12 w-12 border-border">
                    <Printer className="h-5 w-5 text-muted-foreground" />
                </Button>
            </div>
        </div>
    );
}
