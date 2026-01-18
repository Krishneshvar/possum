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

// Helper hook for debouncing
function useLocalDebounce(value, delay) {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(handler);
    }, [value, delay]);
    return debouncedValue;
}

export default function SalesTable({ items, updateQuantity, removeItem, onProductSelect, showPreview, setShowPreview }) {
    // --- Product Search Logic ---
    const [searchTerm, setSearchTerm] = useState("");
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef(null);

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

    const handleSelect = (variant) => {
        const displayLabel = variant.product_name === variant.name
            ? variant.product_name
            : `${variant.product_name} | ${variant.name}`;

        onProductSelect({ ...variant, name: displayLabel });
        setSearchTerm("");
        setIsOpen(false);
    };

    return (
        <div className="flex flex-col h-full bg-card rounded-xl shadow-sm border border-border overflow-hidden">
            <div className="px-4 py-3 bg-muted/50 flex items-center justify-between border-b border-border">
                <h2 className="font-semibold text-lg text-foreground">Current Order</h2>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPreview(!showPreview)}
                    className="h-8 gap-2 text-muted-foreground hover:text-primary hover:bg-primary/10"
                    title={showPreview ? "Hide Preview" : "Show Preview"}
                >
                    {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    <span className="text-xs font-medium">{showPreview ? "Hide Preview" : "Show Preview"}</span>
                </Button>
            </div>

            <div className="p-4 bg-muted/50 border-t border-border relative" ref={wrapperRef}>
                <div className="relative w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                    <Input
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

                    {/* Dropdown Results - positioned BELOW the input area */}
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
                                                ₹{variant.price}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <div className="flex-1 overflow-auto">
                <Table>
                    <TableHeader className="sticky top-0 bg-muted z-10 shadow-sm">
                        <TableRow className="hover:bg-transparent border-border">
                            <TableHead className="w-[50px] text-center">#</TableHead>
                            <TableHead>Product</TableHead>
                            <TableHead className="text-center w-[100px]">Qty</TableHead>
                            <TableHead className="text-right w-[100px]">Price</TableHead>
                            <TableHead className="text-right w-[100px]">Total</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {items.length === 0 && !searchTerm ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-48 text-center text-muted-foreground">
                                    <div className="flex flex-col items-center justify-center gap-2">
                                        <p>No items in cart</p>
                                        <p className="text-sm opacity-70">Start typing below to add products</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            items.map((item, index) => (
                                <TableRow key={item.id || `item-${index}`} className="border-border hover:bg-muted/50 transition-colors">
                                    <TableCell className="text-center font-medium text-muted-foreground text-xs">
                                        {index + 1}
                                    </TableCell>
                                    <TableCell>
                                        <div className="font-medium text-foreground">{item.name}</div>
                                        <div className="text-xs text-muted-foreground">{item.sku || 'SKU-000'}</div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center justify-center">
                                            <Input
                                                type="number"
                                                min="1"
                                                value={item.quantity}
                                                onChange={(e) => updateQuantity(item.id, parseInt(e.target.value) || 1)}
                                                className="w-16 h-8 text-center bg-background border-border focus-visible:ring-1"
                                            />
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right font-medium text-muted-foreground">
                                        ₹{item.price.toFixed(2)}
                                    </TableCell>
                                    <TableCell className="text-right font-bold text-foreground">
                                        ₹{(item.price * item.quantity).toFixed(2)}
                                    </TableCell>
                                    <TableCell>
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
        </div>
    );
}
