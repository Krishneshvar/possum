import { useParams, useNavigate } from 'react-router-dom';
import { useGetSaleQuery, useCancelSaleMutation, useAddPaymentMutation, useGetPaymentMethodsQuery } from '@/services/salesApi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogFooter,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { ArrowLeft, Printer, ShoppingBag, User, Calendar, CreditCard, RotateCcw, XCircle, Loader2, Plus } from 'lucide-react';
import { useCurrency } from '@/hooks/useCurrency';
import CreateReturnDialog from '../components/CreateReturnDialog';
import React, { useState } from 'react';
import { getStatusBadgeVariant } from '../utils/saleStatus.utils';
import { toast } from 'sonner';

export default function SaleDetailsPage() {
    const { saleId } = useParams();
    const navigate = useNavigate();
    const currency = useCurrency();
    const [isReturnDialogOpen, setIsReturnDialogOpen] = useState(false);
    const [isAddPaymentOpen, setIsAddPaymentOpen] = useState(false);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentMethodId, setPaymentMethodId] = useState('');

    const { data: sale, isLoading, error, refetch } = useGetSaleQuery(saleId, {
        skip: !saleId
    });

    const [cancelSale, { isLoading: isCancelling }] = useCancelSaleMutation();
    const [addPayment, { isLoading: isAddingPayment }] = useAddPaymentMutation();
    const { data: paymentMethods } = useGetPaymentMethodsQuery(undefined);

    const handleCancel = async () => {
        try {
            await cancelSale(sale!.id).unwrap();
            toast.success('Sale cancelled successfully');
            refetch();
        } catch (err: any) {
            toast.error(err?.data?.error || 'Failed to cancel sale');
        }
    };


    const handleAddPayment = async () => {
        const amount = parseFloat(paymentAmount);
        if (!amount || amount <= 0) {
            toast.error('Please enter a valid payment amount');
            return;
        }
        if (!paymentMethodId) {
            toast.error('Please select a payment method');
            return;
        }
        try {
            await addPayment({
                saleId: sale!.id,
                amount,
                paymentMethodId: parseInt(paymentMethodId)
            }).unwrap();
            toast.success('Payment recorded successfully');
            setIsAddPaymentOpen(false);
            setPaymentAmount('');
            setPaymentMethodId('');
            refetch();
        } catch (err: any) {
            toast.error(err?.data?.error || 'Failed to record payment');
        }
    };

    if (isLoading) {
        return (
            <div className="container mx-auto p-4 max-w-5xl">
                <div className="animate-pulse space-y-6">
                    <div className="h-8 bg-muted rounded w-1/3"></div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-2 h-64 bg-muted rounded"></div>
                        <div className="space-y-4">
                            <div className="h-32 bg-muted rounded"></div>
                            <div className="h-48 bg-muted rounded"></div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !sale) {
        return (
            <div className="container mx-auto p-8 max-w-2xl">
                <Card>
                    <CardContent className="pt-6 text-center space-y-4">
                        <div className="text-destructive text-lg font-semibold">Failed to load sale details</div>
                        <p className="text-muted-foreground">The sale could not be found or there was an error loading the data.</p>
                        <div className="flex gap-2 justify-center">
                            <Button variant="outline" onClick={() => navigate('/sales/history')}>
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Bill History
                            </Button>
                            <Button onClick={() => refetch()}>Retry</Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const isActive = sale.status !== 'cancelled' && sale.status !== 'refunded';
    const canAddPayment = isActive && sale.status !== 'paid';
    const canCancel = isActive;
    const canReturn = sale.status === 'paid';
    const balanceDue = sale.total_amount - sale.paid_amount;

    return (
        <div className="container mx-auto p-4 max-w-5xl space-y-6">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" onClick={() => navigate('/sales/history')} className="shrink-0">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight flex flex-wrap items-center gap-2">
                            Invoice #{sale.invoice_number}
                            <Badge variant={getStatusBadgeVariant(sale.status)} className="capitalize">
                                {sale.status.replace('_', ' ')}
                            </Badge>
                        </h1>
                        <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {formatDate(sale.sale_date)}
                        </p>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center gap-2">
                    {canReturn && (
                        <Button variant="outline" size="sm" onClick={() => setIsReturnDialogOpen(true)}>
                            <RotateCcw className="mr-2 h-4 w-4" />
                            Return Items
                        </Button>
                    )}
                    {canAddPayment && (
                        <Button variant="outline" size="sm" onClick={() => setIsAddPaymentOpen(true)}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Payment
                        </Button>
                    )}

                    {canCancel && (
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm" className="text-destructive border-destructive/40 hover:bg-destructive/10">
                                    <XCircle className="mr-2 h-4 w-4" />
                                    Cancel Sale
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Cancel this Sale?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This will cancel Invoice <strong>#{sale.invoice_number}</strong> and restore all inventory. This action cannot be undone.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Back</AlertDialogCancel>
                                    <AlertDialogAction
                                        onClick={handleCancel}
                                        disabled={isCancelling}
                                        className="bg-destructive hover:bg-destructive/90"
                                    >
                                        {isCancelling ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Cancelling...</> : <><XCircle className="mr-2 h-4 w-4" />Yes, Cancel Sale</>}
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    )}
                    <Button variant="outline" size="sm">
                        <Printer className="mr-2 h-4 w-4" />
                        Print Invoice
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Items Table */}
                <Card className="md:col-span-2 border-border/50 shadow-sm overflow-hidden">
                    <CardHeader className="bg-muted/30 pb-4">
                        <CardTitle className="text-sm font-semibold uppercase tracking-wider flex items-center gap-2">
                            <ShoppingBag className="h-4 w-4 text-primary" />
                            Items Purchased
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/10 hover:bg-muted/10">
                                    <TableHead className="pl-6">Product</TableHead>
                                    <TableHead className="text-center">Qty</TableHead>
                                    <TableHead className="text-right">Price</TableHead>
                                    {sale.items?.some((i: any) => (i.tax_amount || 0) > 0) && (
                                        <TableHead className="text-right">Tax</TableHead>
                                    )}
                                    <TableHead className="text-right pr-6">Total</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sale.items?.map((item: any) => (
                                    <TableRow key={item.id} className="hover:bg-muted/30 transition-colors">
                                        <TableCell className="pl-6">
                                            <div className="font-medium">{item.product_name}</div>
                                            <div className="text-xs text-muted-foreground">{item.variant_name}</div>
                                            {item.sku && <div className="text-xs text-muted-foreground font-mono">{item.sku}</div>}
                                        </TableCell>
                                        <TableCell className="text-center font-medium">{item.quantity}</TableCell>
                                        <TableCell className="text-right text-muted-foreground">{currency}{item.price_per_unit.toFixed(2)}</TableCell>
                                        {sale.items?.some((i: any) => (i.tax_amount || 0) > 0) && (
                                            <TableCell className="text-right text-muted-foreground text-xs">
                                                {(item.tax_amount || 0) > 0 ? `${currency}${item.tax_amount.toFixed(2)}` : '—'}
                                            </TableCell>
                                        )}
                                        <TableCell className="text-right font-bold pr-6">{currency}{(item.quantity * item.price_per_unit).toFixed(2)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* Summaries */}
                <div className="flex flex-col gap-6">
                    {/* Customer Info */}
                    <Card className="border-border/50 shadow-sm">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-semibold uppercase tracking-wider flex items-center gap-2">
                                <User className="h-4 w-4 text-primary" />
                                Customer Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {sale.customer_name ? (
                                <div className="space-y-1">
                                    <div className="font-medium">{sale.customer_name}</div>
                                    {sale.customer_phone && <div className="text-sm text-muted-foreground">{sale.customer_phone}</div>}
                                    {sale.customer_email && <div className="text-sm text-muted-foreground">{sale.customer_email}</div>}
                                </div>
                            ) : (
                                <div className="text-sm text-muted-foreground italic">Walk-in Customer</div>
                            )}
                            <Separator className="bg-border/50" />
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span>Sold by</span>
                                <span className="font-medium text-foreground">{sale.biller_name}</span>
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
                                <span className="text-muted-foreground">Subtotal</span>
                                <span className="font-medium">{currency}{(sale.total_amount + (sale.discount || 0) - (sale.total_tax || 0)).toFixed(2)}</span>
                            </div>
                            {(sale.discount || 0) > 0 && (
                                <div className="flex justify-between text-sm text-destructive">
                                    <span>Discount</span>
                                    <span>-{currency}{sale.discount.toFixed(2)}</span>
                                </div>
                            )}
                            {(sale.total_tax || 0) > 0 && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Tax</span>
                                    <span className="font-medium">{currency}{sale.total_tax.toFixed(2)}</span>
                                </div>
                            )}
                            <Separator className="bg-border/50 my-2" />
                            <div className="flex justify-between items-center">
                                <span className="text-base font-bold">Total Amount</span>
                                <span className="text-xl font-bold text-primary">{currency}{sale.total_amount.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm pt-1">
                                <span className="text-muted-foreground">Paid Amount</span>
                                <span className="font-bold text-green-600">{currency}{sale.paid_amount.toFixed(2)}</span>
                            </div>
                            {balanceDue > 0.001 && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Balance Due</span>
                                    <span className="font-bold text-destructive">{currency}{balanceDue.toFixed(2)}</span>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Transactions */}
                    {sale.transactions && sale.transactions.length > 0 && (
                        <Card className="border-border/50 shadow-sm">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-semibold uppercase tracking-wider flex items-center gap-2">
                                    <CreditCard className="h-4 w-4 text-primary" />
                                    Payment Transactions
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <Table>
                                    <TableBody>
                                        {sale.transactions.map((t: any) => (
                                            <TableRow key={t.id} className="hover:bg-muted/10">
                                                <TableCell className="text-xs py-2 pl-4">
                                                    <div className="font-medium flex items-center gap-1.5">
                                                        {t.type === 'refund' && <span className="text-destructive text-[10px] font-bold uppercase">Refund</span>}
                                                        {t.payment_method_name}
                                                    </div>
                                                    <div className="text-[10px] text-muted-foreground">{new Date(t.transaction_date).toLocaleString()}</div>
                                                </TableCell>
                                                <TableCell className={`text-right text-xs py-2 font-bold pr-4 ${t.amount < 0 ? 'text-destructive' : ''}`}>
                                                    {t.amount < 0 ? `-${currency}${Math.abs(t.amount).toFixed(2)}` : `${currency}${t.amount.toFixed(2)}`}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>

            {/* Return Dialog */}
            <CreateReturnDialog
                open={isReturnDialogOpen}
                onOpenChange={setIsReturnDialogOpen}
                sale={sale}
                onSuccess={() => refetch()}
            />

            {/* Add Payment Dialog */}
            <Dialog open={isAddPaymentOpen} onOpenChange={setIsAddPaymentOpen}>
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Add Payment</DialogTitle>
                        <DialogDescription>
                            Record a payment for Invoice <span className="font-mono font-semibold">#{sale.invoice_number}</span>.
                            Balance due: <span className="font-semibold text-destructive">{currency}{balanceDue.toFixed(2)}</span>
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label htmlFor="payment-method-select">Payment Method</Label>
                            <Select value={paymentMethodId} onValueChange={setPaymentMethodId}>
                                <SelectTrigger id="payment-method-select">
                                    <SelectValue placeholder="Select method..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {paymentMethods?.map((pm: any) => (
                                        <SelectItem key={pm.id} value={String(pm.id)}>{pm.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="payment-amount-input">Amount</Label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium">{currency}</span>
                                <Input
                                    id="payment-amount-input"
                                    type="number"
                                    placeholder={balanceDue.toFixed(2)}
                                    value={paymentAmount}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPaymentAmount(e.target.value)}
                                    className="pl-8"
                                    min="0.01"
                                    step="0.01"
                                    max={balanceDue}
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setIsAddPaymentOpen(false)} disabled={isAddingPayment}>
                            Cancel
                        </Button>
                        <Button onClick={handleAddPayment} disabled={isAddingPayment}>
                            {isAddingPayment ? (
                                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Processing...</>
                            ) : (
                                <><Plus className="mr-2 h-4 w-4" />Record Payment</>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
