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
        <div className="flex flex-col h-full bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-slate-200 dark:border-zinc-800 overflow-hidden">
            <div className="px-4 py-3 bg-slate-50/50 dark:bg-zinc-900/50 flex items-center justify-between border-b border-slate-100 dark:border-zinc-800">
                <h2 className="font-semibold text-lg text-slate-800 dark:text-slate-200">Current Order</h2>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPreview(!showPreview)}
                    className="h-8 gap-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                    title={showPreview ? "Hide Preview" : "Show Preview"}
                >
                    {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    <span className="text-xs font-medium">{showPreview ? "Hide Preview" : "Show Preview"}</span>
                </Button>
            </div>

            <div className="p-4 bg-slate-50/50 dark:bg-zinc-900/50 border-t border-slate-100 dark:border-zinc-800 relative" ref={wrapperRef}>
                <div className="relative w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 z-10" />
                    <Input
                        placeholder="Type to search products or SKU..."
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setIsOpen(true);
                        }}
                        onFocus={() => setIsOpen(true)}
                        className="h-12 bg-white dark:bg-zinc-950 pl-9 focus-visible:ring-1 focus-visible:ring-blue-500 rounded-md pr-5 shadow-sm w-full border-slate-200 dark:border-zinc-800"
                    />
                    {(isLoading || isFetching) && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                        </div>
                    )}

                    {/* Dropdown Results - positioned BELOW the input area */}
                    {isOpen && variants.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-zinc-900 rounded-lg shadow-2xl border border-slate-200 dark:border-zinc-800 max-h-[300px] overflow-auto z-[100] p-1">
                            {variants.length === 0 && !isLoading && !isFetching ? (
                                <div className="p-4 text-center text-sm text-slate-500">
                                    No products found.
                                </div>
                            ) : (
                                <div className="space-y-1">
                                    {variants.map((variant) => (
                                        <button
                                            key={variant.id}
                                            onClick={() => handleSelect(variant)}
                                            className="w-full flex items-center gap-3 p-2 hover:bg-slate-50 dark:hover:bg-zinc-800 rounded-md transition-colors text-left group"
                                        >
                                            <div className="h-8 w-8 rounded-md bg-slate-100 dark:bg-zinc-800 flex items-center justify-center border border-slate-200 dark:border-zinc-700">
                                                <Package className="h-4 w-4 text-slate-400" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium text-sm text-slate-700 dark:text-slate-200 truncate">
                                                    {variant.product_name} {variant.name !== variant.product_name ? `| ${variant.name}` : ''}
                                                </div>
                                                <div className="text-xs text-slate-400 flex gap-2">
                                                    <span>{variant.sku || 'No SKU'}</span>
                                                    <span className="text-slate-300">•</span>
                                                    <span>Stock: {variant.stock ?? '0'}</span>
                                                </div>
                                            </div>
                                            <div className="font-bold text-sm text-slate-700 dark:text-slate-200 whitespace-nowrap">
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
                    <TableHeader className="sticky top-0 bg-slate-100 dark:bg-zinc-900 z-10 shadow-sm">
                        <TableRow className="hover:bg-transparent border-slate-100 dark:border-zinc-800">
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
                                <TableCell colSpan={6} className="h-48 text-center text-slate-400">
                                    <div className="flex flex-col items-center justify-center gap-2">
                                        <p>No items in cart</p>
                                        <p className="text-sm opacity-70">Start typing below to add products</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            items.map((item, index) => (
                                <TableRow key={item.id || `item-${index}`} className="border-slate-50 hover:bg-slate-50/50 dark:border-zinc-800 dark:hover:bg-zinc-800/50 transition-colors">
                                    <TableCell className="text-center font-medium text-slate-500 text-xs">
                                        {index + 1}
                                    </TableCell>
                                    <TableCell>
                                        <div className="font-medium text-slate-700 dark:text-slate-200">{item.name}</div>
                                        <div className="text-xs text-slate-400">{item.sku || 'SKU-000'}</div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center justify-center">
                                            <Input
                                                type="number"
                                                min="1"
                                                value={item.quantity}
                                                onChange={(e) => updateQuantity(item.id, parseInt(e.target.value) || 1)}
                                                className="w-16 h-8 text-center bg-slate-50 dark:bg-zinc-900 border-slate-200 dark:border-zinc-700 focus-visible:ring-1"
                                            />
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right font-medium text-slate-600 dark:text-slate-400">
                                        ₹{item.price.toFixed(2)}
                                    </TableCell>
                                    <TableCell className="text-right font-bold text-slate-800 dark:text-slate-200">
                                        ₹{(item.price * item.quantity).toFixed(2)}
                                    </TableCell>
                                    <TableCell>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20"
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
