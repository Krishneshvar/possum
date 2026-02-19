import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PurchaseOrderForm } from '../components/PurchaseOrderForm';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function CreatePurchaseOrderPage() {
    const navigate = useNavigate();
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    const handleSuccess = () => {
        setHasUnsavedChanges(false);
        navigate('/purchase');
    };

    return (
        <div className="container mx-auto p-4 max-w-5xl space-y-6">
            <div className="flex items-center gap-4">
                <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => navigate('/purchase')}
                    aria-label="Back to purchase orders"
                >
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
                    <PurchaseOrderForm 
                        onSuccess={handleSuccess} 
                        onFormChange={() => setHasUnsavedChanges(true)}
                    />
                </CardContent>
            </Card>
        </div>
    );
}
