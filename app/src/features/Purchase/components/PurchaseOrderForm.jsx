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
import { useGetSuppliersQuery } from '@/services/suppliersApi';
import { useGetProductsQuery } from '@/services/productsApi';
import { useCreatePurchaseOrderMutation } from '@/services/purchaseApi';
import { toast } from 'sonner';
import { Trash2, Plus } from 'lucide-react';

export function PurchaseOrderForm({ onSuccess }) {
    const { data: suppliers = [] } = useGetSuppliersQuery();
    const { data: productsData } = useGetProductsQuery({ page: 1, limit: 1000 }); // Getting all for selector (TODO: Optimize with search)
    const products = productsData?.products || [];

    const [createPurchaseOrder, { isLoading }] = useCreatePurchaseOrderMutation();

    const [supplierId, setSupplierId] = useState('');
    const [items, setItems] = useState([]);

    // Item entry state
    const [selectedProductId, setSelectedProductId] = useState('');
    const [selectedVariantId, setSelectedVariantId] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [unitCost, setUnitCost] = useState(0);

    const selectedProduct = useMemo(() =>
        products.find(p => p.id === parseInt(selectedProductId)),
        [products, selectedProductId]
    );

    const selectedVariant = useMemo(() =>
        selectedProduct?.variants?.find(v => v.id === parseInt(selectedVariantId)),
        [selectedProduct, selectedVariantId]
    );

    const addItem = () => {
        if (!selectedVariant || quantity <= 0 || unitCost < 0) return;

        const newItem = {
            variantId: selectedVariant.id,
            productName: selectedProduct.name,
            variantSku: selectedVariant.sku,
            variantName: selectedVariant.name,
            quantity: parseInt(quantity),
            unitCost: parseFloat(unitCost),
        };

        setItems([...items, newItem]);
        // Reset item entry
        setSelectedVariantId('');
        setQuantity(1);
        setUnitCost(0);
    };

    const removeItem = (index) => {
        const newItems = [...items];
        newItems.splice(index, 1);
        setItems(newItems);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!supplierId || items.length === 0) {
            toast.error('Please select a supplier and add at least one item.');
            return;
        }

        try {
            await createPurchaseOrder({
                supplier_id: supplierId,
                items: items.map(i => ({
                    variant_id: i.variantId,
                    quantity: i.quantity,
                    unit_cost: i.unitCost
                }))
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
        <div className="space-y-6">
            <div className="space-y-2">
                <Label>Supplier</Label>
                <Select value={supplierId} onValueChange={setSupplierId}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select Supplier" />
                    </SelectTrigger>
                    <SelectContent>
                        {suppliers.map(s => (
                            <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="border p-4 rounded-md space-y-4">
                <h3 className="font-semibold text-sm">Add Items</h3>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Product</Label>
                        <Select value={selectedProductId} onValueChange={(val) => { setSelectedProductId(val); setSelectedVariantId(''); }}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select Product" />
                            </SelectTrigger>
                            <SelectContent>
                                {products.map(p => (
                                    <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Variant</Label>
                        <Select
                            value={selectedVariantId}
                            onValueChange={setSelectedVariantId}
                            disabled={!selectedProduct}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select Variant" />
                            </SelectTrigger>
                            <SelectContent>
                                {selectedProduct?.variants?.map(v => (
                                    <SelectItem key={v.id} value={String(v.id)}>
                                        {v.sku} - {v.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <Label>Quantity</Label>
                        <Input
                            type="number"
                            min="1"
                            value={quantity}
                            onChange={e => setQuantity(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Unit Cost</Label>
                        <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={unitCost}
                            onChange={e => setUnitCost(e.target.value)}
                        />
                    </div>
                    <div className="flex items-end">
                        <Button type="button" onClick={addItem} disabled={!selectedVariant} className="w-full">
                            <Plus className="mr-2 h-4 w-4" /> Add
                        </Button>
                    </div>
                </div>
            </div>

            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Product / Variant</TableHead>
                            <TableHead className="text-right">Qty</TableHead>
                            <TableHead className="text-right">Cost</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {items.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center text-muted-foreground h-24">
                                    No items added.
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
                                    <TableCell className="text-right">${item.unitCost.toFixed(2)}</TableCell>
                                    <TableCell className="text-right">${(item.quantity * item.unitCost).toFixed(2)}</TableCell>
                                    <TableCell>
                                        <Button variant="ghost" size="sm" onClick={() => removeItem(idx)} className="text-red-500">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                        {items.length > 0 && (
                            <TableRow className="bg-muted/50 font-bold">
                                <TableCell colSpan={3} className="text-right">Total Order Cost:</TableCell>
                                <TableCell className="text-right text-lg">${calculateTotal()}</TableCell>
                                <TableCell></TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <div className="flex justify-end pt-4">
                <Button onClick={handleSubmit} disabled={isLoading || items.length === 0 || !supplierId}>
                    {isLoading ? 'Creating Order...' : 'Create Purchase Order'}
                </Button>
            </div>
        </div>
    );
}
