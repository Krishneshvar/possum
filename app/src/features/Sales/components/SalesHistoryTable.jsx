import {
    Table,
    TableBody,
    TableCell,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Printer } from "lucide-react";
import GenericTableHeader from "@/components/common/GenericTableHeader";

export default function SalesHistoryTable({
    sales,
    onView,
    onPrint,
    sortBy,
    sortOrder,
    onSort
}) {
    const columns = [
        { key: 'invoice_number', label: 'Invoice', sortable: true, sortField: 'invoice_number' },
        { key: 'sale_date', label: 'Date', sortable: true, sortField: 'sale_date' },
        { key: 'customer_name', label: 'Customer', sortable: false },
        { key: 'cashier_name', label: 'Cashier', sortable: false },
        { key: 'total_amount', label: 'Total', sortable: true, sortField: 'total_amount', className: 'text-right' },
        { key: 'paid_amount', label: 'Paid', sortable: true, sortField: 'paid_amount', className: 'text-right' },
        { key: 'status', label: 'Status', sortable: true, sortField: 'status', className: 'text-center' },
    ];

    // All columns are visible by default
    const visibleColumns = columns.reduce((acc, col) => ({ ...acc, [col.key]: true }), {});

    if (!sales || sales.length === 0) {
        return (
            <div className="text-center p-8 text-muted-foreground border rounded-lg bg-muted/10 m-4">
                No sales found matching your criteria.
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
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="w-full">
            <Table>
                <GenericTableHeader
                    columns={columns}
                    visibleColumns={visibleColumns}
                    onSort={onSort}
                    sortBy={sortBy}
                    sortOrder={sortOrder}
                />
                <TableBody>
                    {sales.map((sale) => (
                        <TableRow key={sale.id} className="hover:bg-muted/30 transition-colors">
                            <TableCell className="font-medium">{sale.invoice_number}</TableCell>
                            <TableCell className="text-muted-foreground whitespace-nowrap">{formatDate(sale.sale_date)}</TableCell>
                            <TableCell>
                                {sale.customer_name || <span className="text-muted-foreground italic opacity-70 text-xs">Walk-in</span>}
                            </TableCell>
                            <TableCell className="text-muted-foreground">{sale.cashier_name}</TableCell>
                            <TableCell className="text-right font-bold text-primary">₹{sale.total_amount.toFixed(2)}</TableCell>
                            <TableCell className="text-right text-muted-foreground">₹{sale.paid_amount.toFixed(2)}</TableCell>
                            <TableCell className="text-center">
                                <Badge variant={getStatusVariant(sale.status)} className="capitalize px-2 py-0.5 text-[10px] font-bold">
                                    {sale.status.replace('_', ' ')}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                                <div className="flex justify-end gap-1">
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onView(sale)} title="View Details">
                                        <Eye className="h-4 w-4 text-muted-foreground hover:text-primary transition-colors" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onPrint(sale)} title="Print Reciept">
                                        <Printer className="h-4 w-4 text-muted-foreground hover:text-primary transition-colors" />
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
