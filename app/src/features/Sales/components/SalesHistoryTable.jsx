import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Printer } from "lucide-react";
import { cn } from "@/lib/utils";

export default function SalesHistoryTable({ sales, onView, onPrint }) {
    if (!sales || sales.length === 0) {
        return (
            <div className="text-center p-8 text-muted-foreground border rounded-lg bg-muted/10">
                No sales found.
            </div>
        );
    }

    const getStatusVariant = (status) => {
        switch (status) {
            case 'paid': return 'default'; // primary
            case 'partially_paid': return 'warning';
            case 'draft': return 'secondary';
            case 'cancelled': return 'destructive';
            case 'refunded': return 'outline';
            default: return 'secondary';
        }
    };

    // Helper to format date
    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleString();
    };

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Invoice</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Cashier</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="text-right">Paid</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {sales.map((sale) => (
                        <TableRow key={sale.id}>
                            <TableCell className="font-medium">{sale.invoice_number}</TableCell>
                            <TableCell>{formatDate(sale.sale_date)}</TableCell>
                            <TableCell>
                                {sale.customer_name || <span className="text-muted-foreground italic">Walk-in</span>}
                            </TableCell>
                            <TableCell>{sale.cashier_name}</TableCell>
                            <TableCell className="text-right font-bold">₹{sale.total_amount.toFixed(2)}</TableCell>
                            <TableCell className="text-right">₹{sale.paid_amount.toFixed(2)}</TableCell>
                            <TableCell className="text-center">
                                <Badge variant={getStatusVariant(sale.status)} className="capitalize">
                                    {sale.status.replace('_', ' ')}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                    <Button variant="ghost" size="icon" onClick={() => onView(sale)} title="View Details">
                                        <Eye className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => onPrint(sale)} title="Print Reciept">
                                        <Printer className="h-4 w-4" />
                                    </Button>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
