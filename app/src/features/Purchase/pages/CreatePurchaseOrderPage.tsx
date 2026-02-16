import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PurchaseOrderForm } from '../components/PurchaseOrderForm';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function CreatePurchaseOrderPage() {
    const navigate = useNavigate();

    const handleSuccess = () => {
        navigate('/purchase');
    };

    return (
        <div className="container mx-auto p-4 max-w-4xl space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate('/purchase')}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Create Purchase Order</h1>
                    <p className="text-sm text-muted-foreground">
                        Order new stock from suppliers
                    </p>
                </div>
            </div>

            <Card>
                <CardContent className="pt-6">
                    <PurchaseOrderForm onSuccess={handleSuccess} />
                </CardContent>
            </Card>
        </div>
    );
}
