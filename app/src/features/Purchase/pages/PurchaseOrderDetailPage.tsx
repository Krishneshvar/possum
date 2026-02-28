import { useParams, useNavigate } from 'react-router-dom';
import { useGetPurchaseOrderByIdQuery, useReceivePurchaseOrderMutation, useCancelPurchaseOrderMutation } from '@/services/purchaseApi';
import { skipToken } from '@reduxjs/toolkit/query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ArrowLeft, Calendar, User, Package, CheckCircle, XCircle, Printer, Truck, Receipt, Loader2, Edit } from 'lucide-react';
import { toast } from 'sonner';
import { useCurrency } from '@/hooks/useCurrency';
import { format } from 'date-fns';
import type { PurchaseOrderItem } from '@shared/index';

export default function PurchaseOrderDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const currency = useCurrency();
    const parsedId = Number(id);
    const hasValidId = Number.isInteger(parsedId) && parsedId > 0;

    const { data: po, isLoading, error } = useGetPurchaseOrderByIdQuery(hasValidId ? parsedId : skipToken);
    const [receiveOrder, { isLoading: isReceiving }] = useReceivePurchaseOrderMutation();
    const [cancelOrder, { isLoading: isCancelling }] = useCancelPurchaseOrderMutation();
    const poItems = po?.items ?? [];

    if (!hasValidId) return <div className="p-8 text-center text-red-500">Invalid Purchase Order ID</div>;
    if (isLoading) return <div className="p-8 text-center">Loading Purchase Order...</div>;
    if (error || !po) return <div className="p-8 text-center text-red-500">Failed to load Purchase Order</div>;

    const handleReceive = async () => {
        try {
            await receiveOrder(po.id).unwrap();
            toast.success('Purchase Order received successfully. Inventory updated.');
        } catch (err: any) {
            toast.error(err.data?.error || 'Failed to receive order');
        }
    };

    const handleCancel = async () => {
        try {
            await cancelOrder(po.id).unwrap();
            toast.success('Purchase Order cancelled.');
        } catch (err: any) {
            toast.error(err.data?.error || 'Failed to cancel order');
        }
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr) return 'N/A';
        return format(new Date(dateStr), 'MMM d, yyyy h:mm a');
    };

    const getStatusVariant = (status: string) => {
        switch (status) {
            case 'received': return 'default'; // Success usually maps to default/primary in some themes or add success variant
            case 'cancelled': return 'destructive';
            case 'pending': return 'secondary';
            default: return 'outline';
        }
    };

    const totalCost = poItems.reduce((sum: number, item: PurchaseOrderItem) => sum + (item.quantity * item.unit_cost), 0);

    return (
        <div className="container mx-auto p-4 max-w-5xl space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate('/purchase')}
                        className="shrink-0"
                        aria-label="Back to purchase orders"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                            Purchase Order PO-{po.id}
                            <Badge variant={getStatusVariant(po.status)} className="capitalize ml-2">
                                {po.status}
                            </Badge>
                        </h1>
                        <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {formatDate(po.order_date)}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {po.status === 'pending' && (
                        <>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                        disabled={isCancelling || isReceiving}
                                        aria-label="Cancel purchase order"
                                    >
                                        {isCancelling ? (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        ) : (
                                            <XCircle className="mr-2 h-4 w-4" />
                                        )}
                                        Cancel Order
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Cancel Purchase Order?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This will cancel Purchase Order <span className="font-mono font-bold">PO-{po.id}</span> from {po.supplier_name}.
                                            This action cannot be undone and the order will not be fulfilled.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Keep Order</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleCancel} className="bg-destructive hover:bg-destructive/90">
                                            Yes, Cancel Order
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => navigate(`/purchase/orders/${po.id}/edit`)}
                                className="text-primary hover:text-primary/90"
                                disabled={isCancelling || isReceiving}
                                aria-label="Edit purchase order"
                            >
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Order
                            </Button>

                            <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700 text-white"
                                onClick={handleReceive}
                                disabled={isReceiving || isCancelling}
                                aria-label="Receive purchase order and update inventory"
                            >
                                {isReceiving ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Receiving...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle className="mr-2 h-4 w-4" />
                                        Receive Order
                                    </>
                                )}
                            </Button>
                        </>
                    )}
                    <Button variant="outline" size="sm" disabled aria-label="Print purchase order (coming soon)">
                        <Printer className="mr-2 h-4 w-4" />
                        Print
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* PO Items Table */}
                <Card className="md:col-span-2 border-border/50 shadow-sm overflow-hidden">
                    <CardHeader className="bg-muted/30 pb-4">
                        <CardTitle className="text-sm font-semibold uppercase tracking-wider flex items-center gap-2">
                            <Receipt className="h-4 w-4 text-primary" />
                            Items Ordered
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/10 hover:bg-muted/10">
                                    <TableHead className="pl-6">Product</TableHead>
                                    <TableHead className="text-center">Qty</TableHead>
                                    <TableHead className="text-right">Unit Cost</TableHead>
                                    <TableHead className="text-right pr-6">Total</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {poItems.map((item: PurchaseOrderItem) => (
                                    <TableRow key={item.id} className="hover:bg-muted/30 transition-colors">
                                        <TableCell className="pl-6">
                                            <div className="flex items-center gap-3 py-1">
                                                <div className="h-9 w-9 rounded-md bg-muted flex items-center justify-center border border-border shrink-0">
                                                    <Package className="h-5 w-5 text-muted-foreground" />
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="font-medium text-sm truncate">{item.variant_name}</div>
                                                    <div className="text-[10px] text-muted-foreground uppercase">{item.sku}</div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center font-medium">{item.quantity}</TableCell>
                                        <TableCell className="text-right text-muted-foreground">{currency}{item.unit_cost.toFixed(2)}</TableCell>
                                        <TableCell className="text-right font-bold pr-6">{currency}{(item.quantity * item.unit_cost).toFixed(2)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* Summaries / Details */}
                <div className="flex flex-col gap-6">
                    {/* Supplier Info */}
                    <Card className="border-border/50 shadow-sm">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-semibold uppercase tracking-wider flex items-center gap-2">
                                <Truck className="h-4 w-4 text-primary" />
                                Supplier Info
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-1">
                                <div className="text-sm font-bold text-foreground">
                                    {po.supplier_name}
                                </div>
                            </div>
                            <Separator className="bg-border/50" />
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-muted-foreground flex items-center gap-2">
                                        <User className="h-3.5 w-3.5" />
                                        Created By
                                    </span>
                                    <span className="text-xs font-medium">{po.created_by_name}</span>
                                </div>
                                {po.status === 'received' && po.received_date && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-muted-foreground flex items-center gap-2">
                                            <Calendar className="h-3.5 w-3.5" />
                                            Received Date
                                        </span>
                                        <span className="text-xs font-medium">{formatDate(po.received_date)}</span>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Order Summary */}
                    <Card className="border-border/50 shadow-sm bg-primary/[0.02]">
                        <CardHeader className="pb-3 border-b border-border/30 bg-muted/20">
                            <CardTitle className="text-sm font-semibold uppercase tracking-wider">Order Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4 space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Total Items</span>
                                <span className="font-medium">{poItems.length}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Total Quantity</span>
                                <span className="font-medium">{poItems.reduce((sum: number, i: PurchaseOrderItem) => sum + i.quantity, 0)}</span>
                            </div>
                            <Separator className="bg-border/50 my-2" />
                            <div className="flex justify-between items-center">
                                <span className="text-base font-bold">Total Cost</span>
                                <span className="text-xl font-bold text-primary">{currency}{totalCost.toFixed(2)}</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
