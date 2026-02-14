import { useState } from 'react';
import { useGetTaxCategoriesQuery, useCalculateTaxMutation } from '@/services/taxesApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calculator } from 'lucide-react';

export default function TaxSimulator() {
    const { data: categories } = useGetTaxCategoriesQuery();
    const [calculateTax, { data: result, isLoading }] = useCalculateTaxMutation();

    const [price, setPrice] = useState('100');
    const [quantity, setQuantity] = useState('1');
    const [categoryId, setCategoryId] = useState('');
    const [customerType, setCustomerType] = useState('standard');

    const handleCalculate = () => {
        if (!categoryId) return;

        const invoice = {
            items: [{
                price: parseFloat(price),
                quantity: parseInt(quantity),
                tax_category_id: parseInt(categoryId)
            }]
        };

        const customer = { type: customerType };

        calculateTax({ invoice, customer });
    };

    return (
        <Card className="max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle>Tax Simulator</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Product Category</label>
                        <Select value={categoryId} onValueChange={setCategoryId}>
                            <SelectTrigger><SelectValue placeholder="Select Category" /></SelectTrigger>
                            <SelectContent>
                                {categories?.map(c => (
                                    <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Customer Type</label>
                        <Select value={customerType} onValueChange={setCustomerType}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="standard">Standard</SelectItem>
                                <SelectItem value="wholesale">Wholesale</SelectItem>
                                <SelectItem value="exempt">Tax Exempt</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Unit Price</label>
                        <Input type="number" value={price} onChange={e => setPrice(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Quantity</label>
                        <Input type="number" value={quantity} onChange={e => setQuantity(e.target.value)} />
                    </div>
                </div>

                <Button onClick={handleCalculate} disabled={isLoading} className="w-full">
                    <Calculator className="mr-2 h-4 w-4" /> Calculate
                </Button>

                {result && (
                    <div className="mt-6 border rounded-lg p-4 bg-muted/50">
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <p className="text-sm text-muted-foreground">Total Tax</p>
                                <p className="text-xl font-bold">{result.total_tax.toFixed(2)}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Grand Total</p>
                                <p className="text-xl font-bold">{result.grand_total.toFixed(2)}</p>
                            </div>
                        </div>

                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Rule</TableHead>
                                    <TableHead>Rate</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead>Type</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {result.items[0].tax_rule_snapshot && JSON.parse(result.items[0].tax_rule_snapshot).map((rule, idx) => (
                                    <TableRow key={idx}>
                                        <TableCell>{rule.rule_name}</TableCell>
                                        <TableCell>{rule.rate}%</TableCell>
                                        <TableCell>{rule.amount.toFixed(2)}</TableCell>
                                        <TableCell>{rule.is_compound ? 'Compound' : 'Simple'}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
