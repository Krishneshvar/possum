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
import { Search, Plus } from "lucide-react";
import { useCurrency } from "@/hooks/useCurrency";

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
    return (
        <div className="space-y-4 border rounded-md p-4 bg-muted/20 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Search Product</Label>
                    <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Type product name or SKU..."
                            className="pl-8 bg-background"
                            value={searchTerm}
                            onChange={onSearchChange}
                        />
                    </div>
                    {searchTerm.length > 2 && products.length > 0 && !selectedProduct && (
                        <div className="absolute z-20 w-full max-w-[300px] bg-popover border rounded-md shadow-md mt-1 max-h-60 overflow-auto">
                            {products.map((product) => (
                                <div
                                    key={product.id}
                                    className="p-2 hover:bg-accent cursor-pointer flex justify-between items-center text-sm"
                                    onClick={() => {
                                        onProductSelect(String(product.id));
                                        setSearchTerm(product.name);
                                    }}
                                >
                                    <span className="font-medium">{product.name}</span>
                                    <span className="text-xs text-muted-foreground">{product.sku}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {selectedProduct && selectedProduct.variants && selectedProduct.variants.length > 0 && (
                    <div className="space-y-2">
                        <Label>Variant</Label>
                        <Select value={selectedVariant} onValueChange={onVariantChange}>
                            <SelectTrigger className="bg-background">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {selectedProduct.variants.map((v: any) => (
                                    <SelectItem key={v.id} value={String(v.id)}>
                                        <div className="flex justify-between w-full gap-4">
                                            <span>{v.name}</span>
                                            <span className="text-muted-foreground">
                                                {currency}{v.mrp} - {v.stock} in stock
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
                        <Label>Qty</Label>
                        <Input
                            type="number"
                            min="1"
                            value={quantity}
                            onChange={(e) => onQuantityChange(parseInt(e.target.value) || 1)}
                            className="bg-background"
                        />
                    </div>
                    <Button onClick={onAddItem} disabled={!selectedProduct} className="flex-1 shadow-sm">
                        <Plus className="mr-2 h-4 w-4" /> Add Item
                    </Button>
                </div>
            </div>
        </div>
    );
}
