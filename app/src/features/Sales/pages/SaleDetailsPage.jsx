import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useGetSaleQuery } from '@/services/salesApi';
import CreateReturnDialog from '../components/CreateReturnDialog';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, Printer, Calendar, User, CreditCard, Receipt, Package, Download, RotateCcw } from 'lucide-react';
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
import { cn } from "@/lib/utils";
import { useCurrency } from "@/hooks/useCurrency";

export default function SaleDetailsPage() {
    const { saleId } = useParams();
    const navigate = useNavigate();
    const [isReturnDialogOpen, setIsReturnDialogOpen] = useState(false);
    const { data: sale, isLoading, error } = useGetSaleQuery(saleId);
    const currency = useCurrency();

    if (isLoading) {
        return (
            <div className="h-[calc(100vh-10rem)] flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error || !sale) {
        return (
            <div className="h-[calc(100vh-10rem)] flex flex-col items-center justify-center gap-4">
                <div className="p-4 bg-destructive/10 rounded-full">
                    <Receipt className="h-10 w-10 text-destructive" />
                </div>
                <h2 className="text-xl font-bold">Sale Not Found</h2>
                <p className="text-muted-foreground">The sale you are looking for does not exist or has been deleted.</p>
                <Button onClick={() => navigate('/sales/history')}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to History
                </Button>
            </div>
        );
    }

    const getStatusVariant = (status) => {
        switch (status) {
            case 'paid': return 'default';
            case 'partially_paid': return 'warning';
            case 'draft': return 'secondary';
            case 'cancelled': return 'destructive';
            case 'refunded': return 'outline';
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

    return (
        <div className="flex flex-col gap-6 p-6 max-w-5xl mx-auto h-[calc(100vh-10rem)] overflow-auto">
            {/* Header / Actions */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" onClick={() => navigate('/sales/history')}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                            Invoice {sale.invoice_number}
                            <Badge variant={getStatusVariant(sale.status)} className="capitalize ml-2">
                                {sale.status.replace('_', ' ')}
                            </Badge>
                        </h1>
                        <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {formatDate(sale.sale_date)}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                        <Download className="mr-2 h-4 w-4" />
                        Download
                    </Button>
                    {sale.status !== 'cancelled' && sale.status !== 'refunded' && (
                        <Button variant="outline" size="sm" onClick={() => setIsReturnDialogOpen(true)}>
                            <RotateCcw className="mr-2 h-4 w-4" />
                            Return Items
                        </Button>
                    )}
                    <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20">
                        <Printer className="mr-2 h-4 w-4" />
                        Print Invoice
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Sale Items Table */}
                <Card className="md:col-span-2 border-border/50 shadow-sm overflow-hidden">
                    <CardHeader className="bg-muted/30 pb-4">
                        <CardTitle className="text-sm font-semibold uppercase tracking-wider flex items-center gap-2">
                            <Receipt className="h-4 w-4 text-primary" />
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
                                    <TableHead className="text-right pr-6">Total</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sale.items.map((item) => {
                                    const lineTotal = item.price_per_unit * item.quantity - item.discount_amount;

                                    return (
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
                                            <TableCell className="text-right text-muted-foreground">
                                                <div className="flex flex-col items-end">
                                                    <span>{currency}{item.price_per_unit.toFixed(2)}</span>
                                                    {item.discount_amount > 0 && <span className="text-[9px] text-destructive">-{currency}{(item.discount_amount / item.quantity).toFixed(2)} unit disc</span>}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right font-bold pr-6">{currency}{lineTotal.toFixed(2)}</TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* Summaries / Details */}
                <div className="flex flex-col gap-6">
                    {/* Customer & Payment Info */}
                    <Card className="border-border/50 shadow-sm">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-semibold uppercase tracking-wider flex items-center gap-2">
                                <User className="h-4 w-4 text-primary" />
                                Customer Info
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-1">
                                <div className="text-sm font-bold text-foreground">
                                    {sale.customer_name || "Walk-in Customer"}
                                </div>
                                {sale.customer_phone && <div className="text-xs text-muted-foreground">{sale.customer_phone}</div>}
                            </div>
                            <Separator className="bg-border/50" />
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-muted-foreground flex items-center gap-2">
                                        <CreditCard className="h-3.5 w-3.5" />
                                        Cashier
                                    </span>
                                    <span className="text-xs font-medium">{sale.cashier_name}</span>
                                </div>
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
                                <span className="font-medium">{currency}{(sale.total_amount + sale.discount - sale.total_tax).toFixed(2)}</span>
                            </div>
                            {sale.discount > 0 && (
                                <div className="flex justify-between text-sm text-destructive">
                                    <span>Discount</span>
                                    <span>-{currency}{sale.discount.toFixed(2)}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Tax</span>
                                <span className="font-medium">{currency}{sale.total_tax.toFixed(2)}</span>
                            </div>
                            <Separator className="bg-border/50 my-2" />
                            <div className="flex justify-between items-center">
                                <span className="text-base font-bold">Total Amount</span>
                                <span className="text-xl font-bold text-primary">{currency}{sale.total_amount.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm pt-2">
                                <span className="text-muted-foreground">Paid Amount</span>
                                <span className="font-bold text-success">{currency}{sale.paid_amount.toFixed(2)}</span>
                            </div>
                            {sale.total_amount > sale.paid_amount && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Balance Due</span>
                                    <span className="font-bold text-destructive">{currency}{(sale.total_amount - sale.paid_amount).toFixed(2)}</span>
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
                                    Payments
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <Table>
                                    <TableBody>
                                        {sale.transactions.map((t) => (
                                            <TableRow key={t.id} className="hover:bg-muted/10">
                                                <TableCell className="text-xs py-2 pl-4">
                                                    <div className="font-medium">{t.payment_method_name}</div>
                                                    <div className="text-[10px] text-muted-foreground">{new Date(t.transaction_date).toLocaleTimeString()}</div>
                                                </TableCell>
                                                <TableCell className="text-right text-xs py-2 font-bold pr-4">{currency}{t.amount.toFixed(2)}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>

            <CreateReturnDialog
                open={isReturnDialogOpen}
                onOpenChange={setIsReturnDialogOpen}
                sale={sale}
            />
        </div>
    );
}
