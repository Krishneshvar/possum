import { useParams, useNavigate } from 'react-router-dom';
import { useGetSaleQuery } from '@/services/salesApi';
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
import { ArrowLeft, Printer, ShoppingBag, User, Calendar, CreditCard, RotateCcw } from 'lucide-react';
import { useCurrency } from '@/hooks/useCurrency';
import CreateReturnDialog from '../components/CreateReturnDialog';
import { useState } from 'react';
import { getStatusBadgeVariant } from '../utils/saleStatus.utils';

export default function SaleDetailsPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const currency = useCurrency();
    const [isReturnDialogOpen, setIsReturnDialogOpen] = useState(false);

    const { data: sale, isLoading, error, refetch } = useGetSaleQuery(id, {
        skip: !id
    });

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
                            <Button variant="outline" onClick={() => navigate('/sales')}>
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Sales
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

    const getStatusVariant = getStatusBadgeVariant;

    return (
        <div className="container mx-auto p-4 max-w-5xl space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate('/sales')} className="shrink-0">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                            Invoice #{sale.invoice_number}
                            <Badge variant={getStatusVariant(sale.status)} className="capitalize ml-2">
                                {sale.status}
                            </Badge>
                        </h1>
                        <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {formatDate(sale.sale_date)}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {sale.status === 'completed' && (
                        <Button variant="outline" size="sm" onClick={() => setIsReturnDialogOpen(true)}>
                            <RotateCcw className="mr-2 h-4 w-4" />
                            Return Items
                        </Button>
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
                                    <TableHead className="text-right pr-6">Total</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sale.items.map((item: any) => (
                                    <TableRow key={item.id} className="hover:bg-muted/30 transition-colors">
                                        <TableCell className="pl-6">
                                            <div className="font-medium">{item.product_name}</div>
                                            <div className="text-xs text-muted-foreground">{item.variant_name}</div>
                                        </TableCell>
                                        <TableCell className="text-center font-medium">{item.quantity}</TableCell>
                                        <TableCell className="text-right text-muted-foreground">{currency}{item.price_per_unit.toFixed(2)}</TableCell>
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
                                    <div className="text-sm text-muted-foreground">{sale.customer_phone}</div>
                                    <div className="text-sm text-muted-foreground">{sale.customer_email}</div>
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
                                        {sale.transactions.map((t: any) => (
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
                onSuccess={() => {}} // Could refresh query here if needed, but invalidation tags should handle it
            />
        </div>
    );
}
