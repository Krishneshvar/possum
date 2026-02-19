import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
} from '@/components/ui/command';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { useGetSuppliersQuery } from '@/services/suppliersApi';
import { useGetVariantsQuery } from '@/services/productsApi';
import { useCreatePurchaseOrderMutation } from '@/services/purchaseApi';
import { toast } from 'sonner';
import { Trash2, Plus, Search, Package, Loader2 } from 'lucide-react';
import { useCurrency } from '@/hooks/useCurrency';

interface PurchaseOrderFormProps {
    onSuccess: () => void;
    onFormChange?: () => void;
}

interface OrderItem {
    variantId: number;
    productName: string;
    variantSku: string;
    variantName: string;
    quantity: number;
    unitCost: number;
}

export function PurchaseOrderForm({ onSuccess, onFormChange }: PurchaseOrderFormProps) {
    const currency = useCurrency();
    const { data: suppliersData } = useGetSuppliersQuery({ limit: 1000 });
    const suppliers = suppliersData?.suppliers || [];
    const { data: variantsData } = useGetVariantsQuery({ page: 1, limit: 1000 });
    const variants = variantsData?.variants || [];

    const [createPurchaseOrder, { isLoading }] = useCreatePurchaseOrderMutation();

    const [supplierId, setSupplierId] = useState('');
    const [items, setItems] = useState<OrderItem[]>([]);
    const [variantSearchOpen, setVariantSearchOpen] = useState(false);

    // Item entry state
    const [selectedVariantId, setSelectedVariantId] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [unitCost, setUnitCost] = useState(0);

    const selectedVariant = useMemo(() =>
        variants.find((v: any) => v.id === parseInt(selectedVariantId)),
        [variants, selectedVariantId]
    );

    const addItem = () => {
        if (!selectedVariant || quantity <= 0 || unitCost < 0) {
            toast.error('Please select a variant and enter valid quantity and cost');
            return;
        }

        const newItem = {
            variantId: selectedVariant.id,
            productName: selectedVariant.product_name,
            variantSku: selectedVariant.sku,
            variantName: selectedVariant.name,
            quantity: quantity,
            unitCost: unitCost,
        };

        setItems([...items, newItem]);
        onFormChange?.();
        // Reset item entry
        setSelectedVariantId('');
        setQuantity(1);
        setUnitCost(0);
        toast.success('Item added to order');
    };

    const removeItem = (index: number) => {
        const newItems = [...items];
        newItems.splice(index, 1);
        setItems(newItems);
        onFormChange?.();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!supplierId || items.length === 0) {
            toast.error('Please select a supplier and add at least one item.');
            return;
        }

        try {
            await createPurchaseOrder({
                supplier_id: Number(supplierId),
                items: items.map(i => ({
                    variant_id: i.variantId,
                    quantity: i.quantity,
                    unit_cost: i.unitCost
                })),
                created_by: 1 // TODO: get from auth
            }).unwrap();

            toast.success('Purchase Order created successfully');
            onSuccess();
        } catch (error) {
            console.error('Failed to create PO:', error);
            toast.error('Failed to create Purchase Order');
        }
    };

    const calculateTotal = () => {
        return items.reduce((sum, item) => sum + (item.quantity * item.unitCost), 0).toFixed(2);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            {/* Supplier Selection Section */}
            <div className="space-y-4">
                <div>
                    <h2 className="text-lg font-semibold mb-1">Supplier Information</h2>
                    <p className="text-sm text-muted-foreground">Select the supplier for this purchase order</p>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="supplier-select">Supplier *</Label>
                    <Select value={supplierId} onValueChange={(val) => { setSupplierId(val); onFormChange?.(); }}>
                        <SelectTrigger id="supplier-select" aria-label="Select supplier">
                            <SelectValue placeholder="Choose a supplier" />
                        </SelectTrigger>
                        <SelectContent>
                            {suppliers.map(s => (
                                <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <Separator />

            {/* Items Section */}
            <div className="space-y-4">
                <div>
                    <h2 className="text-lg font-semibold mb-1">Order Items</h2>
                    <p className="text-sm text-muted-foreground">Add products to this purchase order</p>
                </div>

                <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
                    <div className="space-y-2">
                        <Label htmlFor="variant-search">Search Product / Variant *</Label>
                        <Popover open={variantSearchOpen} onOpenChange={setVariantSearchOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                    id="variant-search"
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={variantSearchOpen}
                                    aria-label="Search for product variant"
                                    className="w-full justify-between h-11"
                                >
                                    {selectedVariant ? (
                                        <span className="truncate">
                                            {selectedVariant.product_name} - {selectedVariant.name} ({selectedVariant.sku})
                                        </span>
                                    ) : (
                                        <span className="text-muted-foreground">Search by product name or SKU...</span>
                                    )}
                                    <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[600px] p-0" align="start">
                                <Command>
                                    <CommandInput placeholder="Search products..." />
                                    <CommandEmpty>No product found.</CommandEmpty>
                                    <CommandGroup className="max-h-64 overflow-auto">
                                        {variants.map((v: any) => (
                                            <CommandItem
                                                key={v.id}
                                                value={`${v.product_name} ${v.name} ${v.sku}`}
                                                onSelect={() => {
                                                    setSelectedVariantId(String(v.id));
                                                    setUnitCost(v.cost_price || 0);
                                                    setVariantSearchOpen(false);
                                                }}
                                            >
                                                <div className="flex items-center gap-3 w-full">
                                                    <div className="h-8 w-8 rounded bg-muted flex items-center justify-center shrink-0">
                                                        <Package className="h-4 w-4 text-muted-foreground" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="font-medium text-sm truncate">{v.product_name} - {v.name}</div>
                                                        <div className="text-xs text-muted-foreground">SKU: {v.sku}</div>
                                                    </div>
                                                    <div className="text-sm text-muted-foreground shrink-0">
                                                        {currency}{(v.cost_price || 0).toFixed(2)}
                                                    </div>
                                                </div>
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </Command>
                            </PopoverContent>
                        </Popover>
                        {selectedVariant && (
                            <p className="text-xs text-muted-foreground">
                                Cost price auto-filled: {currency}{unitCost.toFixed(2)}
                            </p>
                        )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="quantity-input">Quantity *</Label>
                            <Input
                                id="quantity-input"
                                type="number"
                                min="1"
                                value={quantity}
                                onChange={e => setQuantity(Number(e.target.value))}
                                aria-label="Order quantity"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="unit-cost-input">Unit Cost ({currency}) *</Label>
                            <Input
                                id="unit-cost-input"
                                type="number"
                                min="0"
                                step="0.01"
                                value={unitCost}
                                onChange={e => setUnitCost(Number(e.target.value))}
                                aria-label="Unit cost"
                            />
                        </div>
                        <div className="flex items-end">
                            <Button 
                                type="button" 
                                onClick={addItem} 
                                disabled={!selectedVariant || quantity <= 0 || unitCost < 0} 
                                className="w-full"
                                aria-label="Add item to order"
                            >
                                <Plus className="mr-2 h-4 w-4" /> Add Item
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Items Table */}
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <Label>Order Summary</Label>
                    {items.length > 0 && (
                        <span className="text-sm text-muted-foreground">{items.length} item{items.length !== 1 ? 's' : ''}</span>
                    )}
                </div>
                <div className="border rounded-lg overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/50">
                                <TableHead>Product | Variant</TableHead>
                                <TableHead className="text-right">Qty</TableHead>
                                <TableHead className="text-right">Cost</TableHead>
                                <TableHead className="text-right">Total</TableHead>
                                <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {items.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center text-muted-foreground h-32">
                                        <div className="flex flex-col items-center gap-2">
                                            <Package className="h-8 w-8 text-muted-foreground/50" />
                                            <p>No items added yet</p>
                                            <p className="text-xs">Search and add products above to create your order</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                items.map((item, idx) => (
                                    <TableRow key={idx}>
                                        <TableCell>
                                            <div className="font-medium">{item.productName}</div>
                                            <div className="text-xs text-muted-foreground">{item.variantSku} ({item.variantName})</div>
                                        </TableCell>
                                        <TableCell className="text-right">{item.quantity}</TableCell>
                                        <TableCell className="text-right">{currency}{item.unitCost.toFixed(2)}</TableCell>
                                        <TableCell className="text-right font-medium">{currency}{(item.quantity * item.unitCost).toFixed(2)}</TableCell>
                                        <TableCell>
                                            <Button 
                                                variant="ghost" 
                                                size="sm" 
                                                onClick={() => removeItem(idx)} 
                                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                aria-label={`Remove ${item.productName} from order`}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                            {items.length > 0 && (
                                <TableRow className="bg-muted/50 font-bold border-t-2">
                                    <TableCell colSpan={3} className="text-right">Total Order Cost:</TableCell>
                                    <TableCell className="text-right text-lg text-primary">{currency}{calculateTotal()}</TableCell>
                                    <TableCell></TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            <Separator />

            {/* Submit Section */}
            <div className="flex justify-end gap-3 pt-2">
                <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => window.history.back()}
                    disabled={isLoading}
                >
                    Cancel
                </Button>
                <Button 
                    type="submit" 
                    disabled={isLoading || items.length === 0 || !supplierId}
                    className="min-w-[180px]"
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating Order...
                        </>
                    ) : (
                        'Create Purchase Order'
                    )}
                </Button>
            </div>
        </form>
    );
}
