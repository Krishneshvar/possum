import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Printer, ShoppingBag } from "lucide-react";
import DataTable from "@/components/common/DataTable";
import CurrencyText from "@/components/common/CurrencyText";

export default function SalesHistoryTable({
    sales,
    onView,
    onPrint,
    sortBy,
    sortOrder,
    onSort
}) {
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

    const columns = [
        {
            key: 'invoice_number',
            label: 'Invoice',
            sortable: true,
            sortField: 'invoice_number',
            renderCell: (sale) => <span className="font-medium">{sale.invoice_number}</span>
        },
        {
            key: 'sale_date',
            label: 'Date',
            sortable: true,
            sortField: 'sale_date',
            renderCell: (sale) => <span className="text-muted-foreground whitespace-nowrap">{formatDate(sale.sale_date)}</span>
        },
        {
            key: 'customer_name',
            label: 'Customer',
            sortable: false,
            renderCell: (sale) => (
                sale.customer_name || <span className="text-muted-foreground italic opacity-70 text-xs">Walk-in</span>
            )
        },
        {
            key: 'cashier_name',
            label: 'Cashier',
            sortable: false,
            renderCell: (sale) => <span className="text-muted-foreground">{sale.cashier_name}</span>
        },
        {
            key: 'total_amount',
            label: 'Total',
            sortable: true,
            sortField: 'total_amount',
            className: 'text-right',
            renderCell: (sale) => (
                <div className="text-right font-bold text-primary">
                    <CurrencyText value={sale.total_amount} />
                </div>
            )
        },
        {
            key: 'paid_amount',
            label: 'Paid',
            sortable: true,
            sortField: 'paid_amount',
            className: 'text-right',
            renderCell: (sale) => (
                <div className="text-right text-muted-foreground">
                    <CurrencyText value={sale.paid_amount} />
                </div>
            )
        },
        {
            key: 'status',
            label: 'Status',
            sortable: true,
            sortField: 'status',
            className: 'text-center',
            renderCell: (sale) => (
                <div className="flex justify-center">
                    <Badge variant={getStatusVariant(sale.status)} className="capitalize px-2 py-0.5 text-[10px] font-bold">
                        {sale.status.replace('_', ' ')}
                    </Badge>
                </div>
            )
        },
    ];

    const renderActions = (sale) => (
        <div className="flex justify-end gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onView(sale)} title="View Details">
                <Eye className="h-4 w-4 text-muted-foreground hover:text-primary transition-colors" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onPrint(sale)} title="Print Reciept">
                <Printer className="h-4 w-4 text-muted-foreground hover:text-primary transition-colors" />
            </Button>
        </div>
    );

    const emptyState = (
        <div className="text-center p-8 text-muted-foreground">
            No sales found matching your criteria.
        </div>
    );

    return (
        <DataTable
            data={sales}
            columns={columns}
            // Pagination, search, filters are passed from parent or handled there. 
            // Since this component seems to be just a table, we pass basic props.

            sortBy={sortBy}
            sortOrder={sortOrder}
            onSort={onSort}

            emptyState={emptyState}
            renderActions={renderActions}
            avatarIcon={<ShoppingBag className="h-4 w-4 text-primary" />} // Icon for "avatar" column if GenericTableBody renders it
        />
    );
}
