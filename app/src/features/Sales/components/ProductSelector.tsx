import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Search, Plus, Package } from "lucide-react";
import { useCurrency } from "@/hooks/useCurrency";
import { useEffect, useRef } from "react";

interface ProductSelectorProps {
    searchTerm: string;
    onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    products: any[];
    selectedProduct: any;
    onProductSelect: (id: string) => void;
    selectedVariant: string;
    onVariantChange: (val: string) => void;
    quantity: number;
    onQuantityChange: (val: number) => void;
    onAddItem: () => void;
    setSearchTerm: (term: string) => void;
}

export default function ProductSelector({
    searchTerm,
    onSearchChange,
    products,
    selectedProduct,
    onProductSelect,
    selectedVariant,
    onVariantChange,
    quantity,
    onQuantityChange,
    onAddItem,
    setSearchTerm
}: ProductSelectorProps) {
    const currency = useCurrency();
    const searchInputRef = useRef<HTMLInputElement>(null);
    const quantityInputRef = useRef<HTMLInputElement>(null);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && selectedProduct) {
            e.preventDefault();
            onAddItem();
        } else if (e.key === 'Escape') {
            e.preventDefault();
            setSearchTerm('');
            searchInputRef.current?.blur();
        }
    };

    useEffect(() => {
        const handleGlobalKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                searchInputRef.current?.focus();
            }
        };
        window.addEventListener('keydown', handleGlobalKeyDown);
        return () => window.removeEventListener('keydown', handleGlobalKeyDown);
    }, []);

    return (
        <div className="space-y-3 border rounded-lg p-4 bg-card shadow-sm">
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-foreground">Add Products</h3>
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                                <span className="text-xs">⌘</span>K
                            </kbd>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Focus search (Ctrl+K)</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-2">
                    <Label htmlFor="product-search" className="text-sm font-medium">Search Product</Label>
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            id="product-search"
                            ref={searchInputRef}
                            placeholder="Type product name or SKU..."
                            className="pl-9 bg-background"
                            value={searchTerm}
                            onChange={onSearchChange}
                            onKeyDown={handleKeyDown}
                            aria-label="Search for products by name or SKU"
                            aria-autocomplete="list"
                            aria-controls="product-results"
                            aria-expanded={searchTerm.length > 2 && products.length > 0 && !selectedProduct}
                        />
                    </div>
                    {searchTerm.length > 2 && products.length > 0 && !selectedProduct && (
                        <div 
                            id="product-results"
                            role="listbox"
                            className="absolute z-20 w-full max-w-[300px] bg-popover border rounded-md shadow-lg mt-1 max-h-60 overflow-auto"
                        >
                            {products.map((product, idx) => (
                                <div
                                    key={product.id}
                                    role="option"
                                    aria-selected={false}
                                    tabIndex={0}
                                    className="p-3 hover:bg-accent cursor-pointer flex justify-between items-center text-sm transition-colors focus:bg-accent focus:outline-none"
                                    onClick={() => {
                                        onProductSelect(String(product.id));
                                        setSearchTerm(product.name);
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            e.preventDefault();
                                            onProductSelect(String(product.id));
                                            setSearchTerm(product.name);
                                        }
                                    }}
                                >
                                    <div className="flex items-center gap-2">
                                        <Package className="h-4 w-4 text-muted-foreground" />
                                        <span className="font-medium">{product.name}</span>
                                    </div>
                                    <div className="flex flex-col items-end gap-0.5">
                                        <span className="text-xs text-muted-foreground">{product.sku}</span>
                                        <span className="text-xs font-medium text-foreground">{product.stock} in stock</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {selectedProduct && selectedProduct.variants && selectedProduct.variants.length > 0 && (
                    <div className="space-y-2">
                        <Label htmlFor="variant-select" className="text-sm font-medium">Select Variant</Label>
                        <Select value={selectedVariant} onValueChange={onVariantChange}>
                            <SelectTrigger id="variant-select" className="bg-background" aria-label="Select product variant">
                                <SelectValue placeholder="Choose a variant" />
                            </SelectTrigger>
                            <SelectContent>
                                {selectedProduct.variants.map((v: any) => (
                                    <SelectItem key={v.id} value={String(v.id)}>
                                        <div className="flex justify-between w-full gap-4">
                                            <span className="font-medium">{v.name}</span>
                                            <span className="text-xs text-muted-foreground">
                                                {currency}{v.mrp} · {v.stock} in stock
                                            </span>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}

                <div className="flex items-end gap-2">
                    <div className="space-y-2 w-24">
                        <Label htmlFor="quantity-input" className="text-sm font-medium">Quantity</Label>
                        <Input
                            id="quantity-input"
                            ref={quantityInputRef}
                            type="number"
                            min="1"
                            value={quantity}
                            onChange={(e) => onQuantityChange(parseInt(e.target.value) || 1)}
                            onKeyDown={handleKeyDown}
                            className="bg-background"
                            aria-label="Product quantity"
                        />
                    </div>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button 
                                    onClick={onAddItem} 
                                    disabled={!selectedProduct} 
                                    className="flex-1 shadow-sm"
                                    aria-label="Add selected product to cart"
                                >
                                    <Plus className="mr-2 h-4 w-4" aria-hidden="true" /> Add to Cart
                                </Button>
                            </TooltipTrigger>
                            {selectedProduct && (
                                <TooltipContent>
                                    <p>Press Enter to add</p>
                                </TooltipContent>
                            )}
                        </Tooltip>
                    </TooltipProvider>
                </div>
            </div>
        </div>
    );
}
