import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Trash2, Search, Loader2, Package, Layout, Eye, EyeOff } from "lucide-react";
import { useGetVariantsQuery } from "@/services/productsApi";
import { cn } from "@/lib/utils";

// Helper hook for debouncing
function useLocalDebounce(value, delay) {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(handler);
    }, [value, delay]);
    return debouncedValue;
}

export default function SalesTable({ items, updateQuantity, updatePrice, updateDiscount, removeItem, onProductSelect, showPreview, setShowPreview, className }) {
    // --- Product Search Logic ---
    const [searchTerm, setSearchTerm] = useState("");
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef(null);
    const searchInputRef = useRef(null);

    // Refs for row inputs to manage focus
    const qtyRefs = useRef({});
    const priceRefs = useRef({});
    const discountRefs = useRef({});

    // Track the last added item to focus it
    const [focusTargetId, setFocusTargetId] = useState(null);

    // We only want to search when the user types something
    const debouncedSearch = useLocalDebounce(searchTerm, 300);

    const { data: variants = [], isLoading, isFetching } = useGetVariantsQuery(
        { query: debouncedSearch || "" }
    );

    // Close dropdown when clicking outside or pressing Escape
    useEffect(() => {
        function handleClickOutside(event) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }

        function handleKeyDown(event) {
            if (event.key === "Escape") {
                setIsOpen(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("keydown", handleKeyDown);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [wrapperRef]);

    // Handle focus when a new item is added/selected
    useEffect(() => {
        if (focusTargetId && qtyRefs.current[focusTargetId]) {
            qtyRefs.current[focusTargetId].focus();
            setFocusTargetId(null);
        }
    }, [items, focusTargetId]);

    const handleSelect = (variant) => {
        const displayLabel = variant.product_name === variant.name
            ? variant.product_name
            : `${variant.product_name} | ${variant.name}`;

        onProductSelect({ ...variant, name: displayLabel });
        setSearchTerm("");
        setIsOpen(false);
        // Set focus target to this variant's ID (which matches item.id)
        setFocusTargetId(variant.id);
    };

    const handleQtyKeyDown = (e, itemId) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (priceRefs.current[itemId]) {
                priceRefs.current[itemId].focus();
                // Select all text in price field for easy overwriting
                priceRefs.current[itemId].select();
            }
        }
    };

    const handlePriceKeyDown = (e, itemId) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (discountRefs.current[itemId]) {
                discountRefs.current[itemId].focus();
                discountRefs.current[itemId].select();
            }
        }
    };

    const handleDiscountKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (searchInputRef.current) {
                searchInputRef.current.focus();
            }
        }
    };

    return (
        <div className={cn("flex flex-col bg-card rounded-xl shadow-sm border border-border overflow-hidden min-h-0", className)}>
            <div className="flex-none p-4 bg-muted/50 border-b border-border relative" ref={wrapperRef}>
                <div className="flex items-center gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                        <Input
                            ref={searchInputRef}
                            placeholder="Type to search products or SKU..."
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setIsOpen(true);
                            }}
                            onFocus={() => setIsOpen(true)}
                            className="h-12 bg-background pl-9 focus-visible:ring-1 focus-visible:ring-ring rounded-md pr-5 shadow-sm w-full border-border"
                        />
                        {(isLoading || isFetching) && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                            </div>
                        )}

                        {/* Dropdown Results */}
                        {isOpen && variants.length > 0 && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-popover rounded-lg shadow-2xl border border-border max-h-[300px] overflow-auto z-[100] p-1">
                                {variants.length === 0 && !isLoading && !isFetching ? (
                                    <div className="p-4 text-center text-sm text-muted-foreground">
                                        No products found.
                                    </div>
                                ) : (
                                    <div className="space-y-1">
                                        {variants.map((variant) => (
                                            <button
                                                key={variant.id}
                                                onClick={() => handleSelect(variant)}
                                                className="w-full flex items-center gap-3 p-2 hover:bg-accent rounded-md transition-colors text-left group"
                                            >
                                                <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center border border-border">
                                                    <Package className="h-4 w-4 text-muted-foreground" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-medium text-sm text-foreground truncate">
                                                        {variant.product_name} {variant.name !== variant.product_name ? `| ${variant.name}` : ''}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground flex gap-2">
                                                        <span>{variant.sku || 'No SKU'}</span>
                                                        <span className="text-muted-foreground/50">•</span>
                                                        <span>Stock: {variant.stock ?? '0'}</span>
                                                    </div>
                                                </div>
                                                <div className="font-bold text-sm text-foreground whitespace-nowrap">
                                                    ₹{variant.mrp}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setShowPreview(!showPreview)}
                        className={cn(
                            "h-12 w-12 flex-none border border-border bg-background transition-all duration-200",
                            showPreview ? "text-primary border-primary/20 bg-primary/5" : "text-muted-foreground"
                        )}
                        title={showPreview ? "Hide Preview" : "Show Preview"}
                    >
                        {showPreview ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </Button>
                </div>
            </div>

            <Table
                className="min-w-[900px] relative"
                containerClassName="flex-1 overflow-auto border-t border-border min-h-0"
            >
                <TableHeader className="sticky top-0 z-30 shadow-sm bg-muted">
                    <TableRow className="hover:bg-transparent border-border">
                        <TableHead className="w-[50px] text-center sticky left-0 top-0 z-40 bg-muted shadow-[1px_0_1px_0_hsl(var(--border))]">#</TableHead>
                        <TableHead className="min-w-[150px] sticky top-0 z-30 bg-muted">Product</TableHead>
                        <TableHead className="text-center w-[100px] sticky top-0 z-30 bg-muted">Qty</TableHead>
                        <TableHead className="text-right w-[100px] sticky top-0 z-30 bg-muted">Price</TableHead>
                        <TableHead className="text-right w-[100px] sticky top-0 z-30 bg-muted">MRP</TableHead>
                        <TableHead className="text-right w-[100px] sticky top-0 z-30 bg-muted">Discount</TableHead>
                        <TableHead className="text-right w-[100px] sticky top-0 z-30 bg-muted">Total</TableHead>
                        <TableHead className="w-[50px] sticky right-0 top-0 z-40 bg-muted shadow-[-1px_0_1px_0_hsl(var(--border))]"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {items.length === 0 && !searchTerm ? (
                        <TableRow>
                            <TableCell colSpan={8} className="h-48 text-center text-muted-foreground">
                                <div className="flex flex-col items-center justify-center gap-2">
                                    <p>No items in cart</p>
                                    <p className="text-sm opacity-70">Start typing below to add products</p>
                                </div>
                            </TableCell>
                        </TableRow>
                    ) : (
                        items.map((item, index) => (
                            <TableRow key={item.id || `item-${index}`} className="border-border hover:bg-muted/50 transition-colors group">
                                <TableCell className="text-center font-medium text-muted-foreground text-xs sticky left-0 z-20 bg-background shadow-[1px_0_0_0_hsl(var(--border))]">
                                    {index + 1}
                                </TableCell>
                                <TableCell>
                                    <div className="font-medium text-foreground">{item.name}</div>
                                    <div className="text-xs text-muted-foreground">{item.sku || 'SKU-000'}</div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center justify-center">
                                        <Input
                                            ref={(el) => (qtyRefs.current[item.id] = el)}
                                            type="text"
                                            value={item.quantity || ''}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                if (val === "" || /^\d+$/.test(val)) {
                                                    updateQuantity(item.id, val === "" ? "" : parseInt(val));
                                                }
                                            }}
                                            onKeyDown={(e) => handleQtyKeyDown(e, item.id)}
                                            className="w-16 h-8 text-center bg-background border-border focus-visible:ring-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        />
                                    </div>
                                </TableCell>
                                <TableCell className="text-right font-medium">
                                    <div className="flex items-center justify-end">
                                        <div className="flex items-center bg-background border border-border rounded-md px-2 focus-within:ring-1 focus-within:ring-ring">
                                            <span className="text-muted-foreground text-xs mr-1">₹</span>
                                            <Input
                                                ref={(el) => (priceRefs.current[item.id] = el)}
                                                type="text"
                                                value={item.price || ''}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    if (val === "" || /^\d*\.?\d*$/.test(val)) {
                                                        updatePrice(item.id, val === "" ? "" : parseFloat(val));
                                                    }
                                                }}
                                                onKeyDown={(e) => handlePriceKeyDown(e, item.id)}
                                                className="w-20 h-8 border-none p-0 text-right focus-visible:ring-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                            />
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell className="text-right font-medium text-muted-foreground">
                                    ₹{(parseFloat(item.mrp) || 0).toFixed(2)}
                                </TableCell>
                                <TableCell className="text-right font-medium">
                                    <div className="flex items-center justify-end">
                                        <div className="flex items-center bg-background border border-border rounded-md px-2 focus-within:ring-1 focus-within:ring-ring">
                                            <span className="text-muted-foreground text-xs mr-1">₹</span>
                                            <Input
                                                ref={(el) => (discountRefs.current[item.id] = el)}
                                                type="text"
                                                value={item.discount || ''}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    if (val === "" || /^\d*\.?\d*$/.test(val)) {
                                                        updateDiscount(item.id, val === "" ? "" : parseFloat(val));
                                                    }
                                                }}
                                                onKeyDown={handleDiscountKeyDown}
                                                className="w-20 h-8 border-none p-0 text-right focus-visible:ring-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                            />
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell className="text-right font-bold text-foreground">
                                    ₹{(((parseFloat(item.price) || 0) * (parseInt(item.quantity) || 0)) - (parseFloat(item.discount) || 0)).toFixed(2)}
                                </TableCell>
                                <TableCell className="sticky right-0 z-20 bg-background shadow-[-1px_0_0_0_hsl(var(--border))] text-center">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                        onClick={() => removeItem(item.id)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
