import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useCalculateTaxMutation } from '@/services/taxesApi';

export default function TaxSimulator() {
    const [amount, setAmount] = useState('100');
    const [result, setResult] = useState<any>(null);
    const [calculateTax, { isLoading }] = useCalculateTaxMutation();

    const handleCalculate = async () => {
        try {
            const res = await calculateTax({
                invoice: {
                    subtotal: parseFloat(amount),
                    items: [{ price: parseFloat(amount), tax_category_id: 1 }] // Simplified for test
                },
                customerId: null
            }).unwrap();
            setResult(res);
        } catch (err) {
            toast.error('Calculation failed');
        }
    };

    return (
        <Card>
            <CardHeader><CardTitle>Tax Engine Simulator</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                <div className="flex gap-4">
                    <Input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="Enter amount"
                        className="max-w-[200px]"
                    />
                    <Button onClick={handleCalculate} disabled={isLoading}>
                        Calculate
                    </Button>
                </div>

                {result && (
                    <div className="bg-muted p-4 rounded-md">
                        <pre className="text-sm">{JSON.stringify(result, null, 2)}</pre>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
