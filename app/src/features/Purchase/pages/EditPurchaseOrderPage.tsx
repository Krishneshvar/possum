import { useNavigate, useParams } from 'react-router-dom';
import { PurchaseOrderForm } from '../components/PurchaseOrderForm';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useGetPurchaseOrderByIdQuery } from '@/services/purchaseApi';

export default function EditPurchaseOrderPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const { data: purchaseOrder, isLoading } = useGetPurchaseOrderByIdQuery(Number(id), {
        skip: !id,
    });

    const handleSuccess = () => {
        navigate('/purchase');
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-full min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!purchaseOrder || purchaseOrder.status !== 'pending') {
        return (
            <div className="container mx-auto p-4 max-w-5xl text-center space-y-4 pt-12">
                <h2 className="text-2xl font-bold">Cannot Edit Purchase Order</h2>
                <p className="text-muted-foreground">Only pending purchase orders can be edited.</p>
                <Button onClick={() => navigate('/purchase')}>Return to Purchase Orders</Button>
            </div>
        );
    }

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
                    <h1 className="text-2xl font-bold tracking-tight">Edit Purchase Order #{id}</h1>
                    <p className="text-sm text-muted-foreground">
                        Modify an existing pending purchase order
                    </p>
                </div>
            </div>

            <Card>
                <CardContent className="pt-6">
                    <PurchaseOrderForm
                        onSuccess={handleSuccess}
                        initialData={purchaseOrder}
                    />
                </CardContent>
            </Card>
        </div>
    );
}
