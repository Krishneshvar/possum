import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Search, Loader2, Plus, Package } from "lucide-react";
import { useGetProductsQuery } from "@/services/productsApi";
// Use local debounce hook as project one might not exist
import { Button } from "@/components/ui/button";

// Simple local debounce hook if not present in project
function useLocalDebounce(value, delay) {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(handler);
    }, [value, delay]);
    return debouncedValue;
}

export default function ProductSelector({ onProductSelect }) {
    const [searchTerm, setSearchTerm] = useState("");
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef(null);

    const debouncedSearch = useLocalDebounce(searchTerm, 300);

    // Skip fetching if search is empty to save resources, or fetch all if you want initial list
    // Usually for POS, you might want top products, but let's stick to search for now
    const { data, isLoading, isFetching } = useGetProductsQuery(
        // Assuming backend supports partial match on 'name' or 'search' parameter
        debouncedSearch ? { name: debouncedSearch } : {},
        { skip: !debouncedSearch && searchTerm !== '' } // Fetch all if empty string passed? Let's just fetch when there is a term or maybe some default
    );

    const products = data?.products || [];

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);

    const handleSelect = (product) => {
        onProductSelect(product);
        setSearchTerm("");
        setIsOpen(false);
    };

    return (
        <div className="relative w-full z-20" ref={wrapperRef}>
            <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search products by name or SKU..." // Scanner input usually works here too
                    value={searchTerm}
                    onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setIsOpen(true);
                    }}
                    onFocus={() => setIsOpen(true)}
                    className="pl-9 bg-background border-border focus-visible:ring-1"
                />
                {(isLoading || isFetching) && (
                    <div className="absolute right-3 top-2.5">
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    </div>
                )}
            </div>

            {isOpen && (searchTerm || products.length > 0) && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-popover rounded-lg shadow-xl border border-border max-h-[400px] overflow-auto z-50 p-1">
                    {products.length === 0 && !isLoading && !isFetching ? (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                            No products found.
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {products.map((product) => (
                                <button
                                    key={product.id}
                                    onClick={() => handleSelect(product)}
                                    className="w-full flex items-center gap-3 p-2 hover:bg-muted/50 rounded-md transition-colors text-left group"
                                >
                                    <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center border border-border">
                                        <Package className="h-5 w-5 text-muted-foreground" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="font-medium text-foreground group-hover:text-primary transition-colors">
                                            {product.name}
                                        </div>
                                        <div className="text-xs text-muted-foreground flex gap-2">
                                            <span>SKU: {product.sku || 'N/A'}</span>
                                            <span>•</span>
                                            <span>Stock: {product.stock_quantity ?? 'N/A'}</span>
                                        </div>
                                    </div>
                                    <div className="font-bold text-foreground">
                                        ₹{product.mrp}
                                    </div>
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Plus className="h-4 w-4 text-primary" />
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
