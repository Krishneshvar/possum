import { useState, useMemo } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Trash2, Search, Package, Plus } from "lucide-react";
import { useGetProductsQuery } from "@/services/productsApi";
import { useCurrency } from "@/hooks/useCurrency";
import RequiredFieldIndicator from "@/components/common/RequiredFieldIndicator";
import { toast } from "sonner";

interface Product {
    id: number;
    name: string;
    sku: string;
    stock: number;
    mrp: number;
    variants?: any[];
}

interface CartItem {
    id: number;
    name: string;
    sku: string;
    mrp: number;
    quantity: number;
    maxStock: number;
    variantId?: number;
    product_name?: string;
    variant_name?: string;
}

interface CartProps {
    items: CartItem[];
    onUpdateItems: (items: CartItem[]) => void;
    onAddItem: (item: CartItem) => void;
}

export default function Cart({ items, onUpdateItems, onAddItem }: CartProps) {
    const currency = useCurrency();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [selectedVariant, setSelectedVariant] = useState<string>('');
    const [quantity, setQuantity] = useState(1);

    const { data: productsData } = useGetProductsQuery({
        searchTerm: searchTerm.length > 2 ? searchTerm : undefined,
        limit: 10
    });

    const products = productsData?.products || [];

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
        setSelectedProduct(null);
        setSelectedVariant('');
    };

    const handleProductSelect = (productId: string) => {
        const product = products.find((p: Product) => p.id === parseInt(productId));
        setSelectedProduct(product || null);
        if (product && product.variants && product.variants.length > 0) {
            setSelectedVariant(String(product.variants[0].id));
        } else {
            setSelectedVariant('');
        }
    };

    const handleAddItem = () => {
        if (!selectedProduct) return;

        let itemToAdd: any = {
            id: selectedProduct.id,
            name: selectedProduct.name,
            sku: selectedProduct.sku,
            mrp: selectedProduct.mrp,
            quantity: quantity,
            maxStock: selectedProduct.stock
        };

        if (selectedProduct.variants && selectedProduct.variants.length > 0) {
            const variant = selectedProduct.variants.find((v: any) => v.id === parseInt(selectedVariant));
            if (variant) {
                itemToAdd = {
                    id: variant.id, // Using variant ID for unique key in cart if variant selected
                    variantId: variant.id,
                    name: `${selectedProduct.name} - ${variant.name}`,
                    product_name: selectedProduct.name,
                    variant_name: variant.name,
                    sku: variant.sku,
                    mrp: variant.mrp,
                    quantity: quantity,
                    maxStock: variant.stock
                };
            }
        }

        if (itemToAdd.quantity > itemToAdd.maxStock) {
            toast.error(`Only ${itemToAdd.maxStock} units available in stock.`);
            return;
        }

        onAddItem(itemToAdd);
        // Reset form
        setSearchTerm('');
        setSelectedProduct(null);
        setSelectedVariant('');
        setQuantity(1);
    };

    const handleRemoveItem = (index: number) => {
        const newItems = [...items];
        newItems.splice(index, 1);
        onUpdateItems(newItems);
    };

    const updateQuantity = (index: number, newQty: number) => {
        if (newQty < 1) return;
        const newItems = [...items];
        if (newQty > newItems[index].maxStock) {
            toast.error(`Cannot exceed stock limit of ${newItems[index].maxStock}`);
            return;
        }
        newItems[index].quantity = newQty;
        onUpdateItems(newItems);
    };

    const total = items.reduce((sum, item) => sum + (item.mrp * item.quantity), 0);

    return (
        <Card className="h-full flex flex-col">
            <CardContent className="p-4 flex-1 flex flex-col gap-4">
                <div className="space-y-4 border rounded-md p-4 bg-muted/20">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Search Product</Label>
                            <div className="relative">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Type product name or SKU..."
                                    className="pl-8"
                                    value={searchTerm}
                                    onChange={handleSearchChange}
                                />
                            </div>
                            {searchTerm.length > 2 && products.length > 0 && !selectedProduct && (
                                <div className="absolute z-10 w-full max-w-[300px] bg-popover border rounded-md shadow-md mt-1">
                                    {products.map((product: Product) => (
                                        <div
                                            key={product.id}
                                            className="p-2 hover:bg-accent cursor-pointer flex justify-between items-center"
                                            onClick={() => {
                                                handleProductSelect(String(product.id));
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
                                <Select value={selectedVariant} onValueChange={setSelectedVariant}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {selectedProduct.variants.map((v: any) => (
                                            <SelectItem key={v.id} value={String(v.id)}>
                                                {v.name} ({currency}{v.mrp}) - Stock: {v.stock}
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
                                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                                />
                            </div>
                            <Button onClick={handleAddItem} disabled={!selectedProduct} className="flex-1">
                                <Plus className="mr-2 h-4 w-4" /> Add
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="flex-1 border rounded-md overflow-hidden flex flex-col">
                    <div className="overflow-auto flex-1">
                        <Table>
                            <TableHeader className="bg-muted sticky top-0">
                                <TableRow>
                                    <TableHead>Product</TableHead>
                                    <TableHead className="w-[100px] text-center">Qty</TableHead>
                                    <TableHead className="text-right">Price</TableHead>
                                    <TableHead className="text-right">Total</TableHead>
                                    <TableHead className="w-[50px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {items.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-48 text-center text-muted-foreground">
                                            <div className="flex flex-col items-center gap-2">
                                                <Package className="h-8 w-8 opacity-20" />
                                                <p>Cart is empty</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    items.map((item, index) => (
                                        <TableRow key={`${item.id}-${index}`}>
                                            <TableCell>
                                                <div className="font-medium">{item.name}</div>
                                                <div className="text-xs text-muted-foreground">{item.sku}</div>
                                            </TableCell>
                                            <TableCell>
                                                <Input
                                                    type="number"
                                                    min="1"
                                                    className="h-8 w-16 text-center mx-auto"
                                                    value={item.quantity}
                                                    onChange={(e) => updateQuantity(index, parseInt(e.target.value))}
                                                />
                                            </TableCell>
                                            <TableCell className="text-right">{currency}{item.mrp.toFixed(2)}</TableCell>
                                            <TableCell className="text-right font-medium">
                                                {currency}{(item.mrp * item.quantity).toFixed(2)}
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                                    onClick={() => handleRemoveItem(index)}
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
                    <div className="p-4 bg-muted/50 border-t flex justify-between items-center">
                        <span className="font-semibold text-lg">Total</span>
                        <span className="font-bold text-2xl text-primary">{currency}{total.toFixed(2)}</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
