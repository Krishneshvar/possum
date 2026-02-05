import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import DataTable from "@/components/common/DataTable";
import CurrencyText from "@/components/common/CurrencyText";
import { useNavigate } from "react-router-dom";

export default function TransactionsTable({
    transactions,
    sortBy,
    sortOrder,
    onSort
}) {
    const navigate = useNavigate();

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
            case 'completed': return 'default';
            case 'pending': return 'warning';
            case 'failed': return 'destructive';
            case 'cancelled': return 'secondary';
            default: return 'secondary';
        }
    };

    const getTypeIcon = (type) => {
        if (type === 'payment') return <ArrowDownLeft className="h-4 w-4 text-green-500 mr-1" />;
        if (type === 'refund') return <ArrowUpRight className="h-4 w-4 text-red-500 mr-1" />;
        return null;
    };

    const columns = [
        {
            key: 'transaction_date',
            label: 'Date',
            sortable: true,
            sortField: 'transaction_date',
            renderCell: (t) => <span className="text-muted-foreground whitespace-nowrap">{formatDate(t.transaction_date)}</span>
        },
        {
            key: 'id',
            label: 'ID',
            sortable: true,
            sortField: 'id',
            renderCell: (t) => <span className="font-mono text-xs">#{t.id}</span>
        },
        {
            key: 'invoice_number',
            label: 'Invoice',
            sortable: false,
            renderCell: (t) => (
                <Button
                    variant="link"
                    className="p-0 h-auto font-medium"
                    onClick={() => navigate(`/sales/history/${t.sale_id}`)}
                >
                    {t.invoice_number}
                </Button>
            )
        },
        {
            key: 'customer_name',
            label: 'Customer',
            sortable: false,
            renderCell: (t) => t.customer_name || '-'
        },
        {
            key: 'type',
            label: 'Type',
            sortable: true,
            sortField: 'type',
            renderCell: (t) => (
                <div className="flex items-center capitalize">
                    {getTypeIcon(t.type)}
                    {t.type}
                </div>
            )
        },
        {
            key: 'payment_method_name',
            label: 'Method',
            sortable: false,
            renderCell: (t) => t.payment_method_name
        },
        {
            key: 'amount',
            label: 'Amount',
            sortable: true,
            sortField: 'amount',
            className: 'text-right',
            renderCell: (t) => (
                <div className={`text-right font-bold ${t.type === 'refund' ? 'text-red-500' : 'text-green-600'}`}>
                    {t.type === 'refund' ? '-' : '+'}<CurrencyText value={t.amount} />
                </div>
            )
        },
        {
            key: 'status',
            label: 'Status',
            sortable: true,
            sortField: 'status',
            className: 'text-center',
            renderCell: (t) => (
                <div className="flex justify-center">
                    <Badge variant={getStatusVariant(t.status)} className="capitalize px-2 py-0.5 text-[10px] font-bold">
                        {t.status}
                    </Badge>
                </div>
            )
        },
    ];

    const emptyState = (
        <div className="text-center p-8 text-muted-foreground">
            No transactions found matching your criteria.
        </div>
    );

    return (
        <DataTable
            data={transactions}
            columns={columns}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSort={onSort}
            emptyState={emptyState}
        />
    );
}
