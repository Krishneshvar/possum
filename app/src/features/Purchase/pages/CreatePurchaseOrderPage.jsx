import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PurchaseOrderForm } from '../components/PurchaseOrderForm';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function CreatePurchaseOrderPage() {
    const navigate = useNavigate();

    const handleSuccess = () => {
        navigate('/purchase/orders');
    };

    return (
        <div className="p-6 space-y-6 max-w-5xl mx-auto">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate('/purchase/orders')}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Create Purchase Order</h1>
                    <p className="text-muted-foreground">Draft a new order to send to suppliers.</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Order Details</CardTitle>
                    <CardDescription>Select supplier and add items to the order.</CardDescription>
                </CardHeader>
                <CardContent>
                    <PurchaseOrderForm onSuccess={handleSuccess} />
                </CardContent>
            </Card>
        </div>
    );
}
