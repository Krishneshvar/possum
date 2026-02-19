import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Calculator, Loader2 } from 'lucide-react';
import { useCalculateTaxMutation } from '@/services/taxesApi';

export default function TaxSimulator() {
    const [amount, setAmount] = useState('100');
    const [categoryId, setCategoryId] = useState('1');
    const [result, setResult] = useState<any>(null);
    const [calculateTax, { isLoading }] = useCalculateTaxMutation();

    const handleCalculate = async () => {
        if (!amount || parseFloat(amount) <= 0) {
            toast.error('Please enter a valid amount');
            return;
        }

        try {
            const res = await calculateTax({
                invoice: {
                    subtotal: parseFloat(amount),
                    items: [{ 
                        price: parseFloat(amount), 
                        quantity: 1,
                        tax_category_id: parseInt(categoryId) 
                    }]
                },
                customerId: null
            }).unwrap();
            setResult(res);
            toast.success('Tax calculated successfully');
        } catch (err: any) {
            console.error('Tax calculation error:', err);
            toast.error(err?.data?.message || 'Calculation failed');
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-base font-semibold">Tax Engine Simulator</h3>
                <p className="text-sm text-muted-foreground mt-1">Test tax calculations with sample data</p>
            </div>

            <Separator />

            <Card>
                <CardHeader>
                    <CardTitle>Simulation Parameters</CardTitle>
                    <CardDescription>Enter amount and tax category to calculate taxes</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="sim-amount">Amount</Label>
                            <Input
                                id="sim-amount"
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="Enter amount"
                                min="0"
                                step="0.01"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="sim-category">Tax Category ID</Label>
                            <Select value={categoryId} onValueChange={setCategoryId}>
                                <SelectTrigger id="sim-category">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="1">Category 1</SelectItem>
                                    <SelectItem value="2">Category 2</SelectItem>
                                    <SelectItem value="3">Category 3</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <Button onClick={handleCalculate} disabled={isLoading}>
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                                Calculating...
                            </>
                        ) : (
                            <>
                                <Calculator className="mr-2 h-4 w-4" aria-hidden="true" />
                                Calculate Tax
                            </>
                        )}
                    </Button>

                    {result && (
                        <div className="mt-6 space-y-3">
                            <Label>Calculation Result</Label>
                            <div className="bg-muted p-4 rounded-md space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-sm font-medium">Subtotal:</span>
                                    <span className="text-sm">{result.subtotal?.toFixed(2) || '0.00'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm font-medium">Total Tax:</span>
                                    <span className="text-sm">{result.total_tax?.toFixed(2) || '0.00'}</span>
                                </div>
                                <Separator />
                                <div className="flex justify-between">
                                    <span className="text-sm font-semibold">Grand Total:</span>
                                    <span className="text-sm font-semibold">{result.total?.toFixed(2) || '0.00'}</span>
                                </div>
                                {result.tax_breakdown && result.tax_breakdown.length > 0 && (
                                    <>
                                        <Separator />
                                        <div className="pt-2">
                                            <p className="text-xs font-medium mb-2">Tax Breakdown:</p>
                                            {result.tax_breakdown.map((tax: any, idx: number) => (
                                                <div key={idx} className="flex justify-between text-xs">
                                                    <span>{tax.name} ({tax.rate}%):</span>
                                                    <span>{tax.amount?.toFixed(2) || '0.00'}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
