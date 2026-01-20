import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGetPurchaseOrderByIdQuery, useReceivePurchaseOrderMutation, useCancelPurchaseOrderMutation } from '@/services/purchaseApi';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, Printer, Calendar, User, Truck, Receipt, Package, Download, CheckCircle, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { toast } from 'sonner';
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
} from '@/components/ui/alert-dialog';

export default function PurchaseOrderDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { data: po, isLoading, error } = useGetPurchaseOrderByIdQuery(id);
    const [receivePurchaseOrder, { isLoading: isReceiving }] = useReceivePurchaseOrderMutation();
    const [cancelPurchaseOrder, { isLoading: isCancelling }] = useCancelPurchaseOrderMutation();

    const handleReceive = async () => {
        try {
            await receivePurchaseOrder(id).unwrap();
            toast.success('Purchase Order received. Stock updated.');
        } catch (error) {
            console.error('Failed to receive PO:', error);
            toast.error(error?.data?.error || 'Failed to receive Purchase Order');
        }
    };

    const handleCancel = async () => {
        try {
            await cancelPurchaseOrder(id).unwrap();
            toast.success('Purchase Order cancelled.');
        } catch (error) {
            console.error('Failed to cancel PO:', error);
            toast.error(error?.data?.error || 'Failed to cancel Purchase Order');
        }
    };

    if (isLoading) {
        return (
            <div className="h-[calc(100vh-10rem)] flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error || !po) {
        return (
            <div className="h-[calc(100vh-10rem)] flex flex-col items-center justify-center gap-4">
                <div className="p-4 bg-destructive/10 rounded-full">
                    <Receipt className="h-10 w-10 text-destructive" />
                </div>
                <h2 className="text-xl font-bold">Purchase Order Not Found</h2>
                <p className="text-muted-foreground">The purchase order you are looking for does not exist or has been deleted.</p>
                <Button onClick={() => navigate('/purchase/orders')}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Purchase Orders
                </Button>
            </div>
        );
    }

    const getStatusVariant = (status) => {
        switch (status) {
            case 'received': return 'default';
            case 'pending': return 'secondary';
            case 'cancelled': return 'destructive';
            default: return 'secondary';
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleString('en-IN', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const totalCost = po.items.reduce((sum, item) => sum + (item.quantity * item.unit_cost), 0);

    return (
        <div className="flex flex-col gap-6 p-6 max-w-5xl mx-auto h-[calc(100vh-10rem)] overflow-auto">
            {/* Header / Actions */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" onClick={() => navigate('/purchase/orders')}>
                        <ArrowLeft className="h-4 w-4" />
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
                                    <Button variant="outline" size="sm" className="text-red-500 hover:text-red-600" disabled={isCancelling}>
                                        <XCircle className="mr-2 h-4 w-4" />
                                        Cancel Order
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This will cancel Purchase Order <span className="font-mono font-bold">PO-{po.id}</span>.
                                            This action cannot be undone.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>No, Keep it</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleCancel} className="bg-red-600 hover:bg-red-700">
                                            Confirm Cancellation
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>

                            <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-600/20" onClick={handleReceive} disabled={isReceiving}>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Receive Order
                            </Button>
                        </>
                    )}
                    <Button variant="outline" size="sm">
                        <Printer className="mr-2 h-4 w-4" />
                        Print PO
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
                                {po.items.map((item) => (
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
                                        <TableCell className="text-right text-muted-foreground">${item.unit_cost.toFixed(2)}</TableCell>
                                        <TableCell className="text-right font-bold pr-6">${(item.quantity * item.unit_cost).toFixed(2)}</TableCell>
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
                                {po.received_date && (
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
                                <span className="font-medium">{po.items.length}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Total Quantity</span>
                                <span className="font-medium">{po.items.reduce((sum, i) => sum + i.quantity, 0)}</span>
                            </div>
                            <Separator className="bg-border/50 my-2" />
                            <div className="flex justify-between items-center">
                                <span className="text-base font-bold">Total Cost</span>
                                <span className="text-xl font-bold text-primary">${totalCost.toFixed(2)}</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
