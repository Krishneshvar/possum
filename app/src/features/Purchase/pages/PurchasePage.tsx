import { useState } from 'react';
import { Plus, Eye, Truck, CheckCircle, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import GenericPageHeader from '@/components/common/GenericPageHeader';
import DataTable from '@/components/common/DataTable';
import { useGetPurchaseOrdersQuery } from '@/services/purchaseApi';
import { useCurrency } from '@/hooks/useCurrency';
import { format } from 'date-fns';

export default function PurchasePage() {
    const currency = useCurrency();
    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    const { data, isLoading, refetch } = useGetPurchaseOrdersQuery({
        page,
        limit,
        searchTerm,
        status: statusFilter,
    });

    const purchaseOrders = data?.purchaseOrders || [];
    const totalPages = data?.totalPages || 1;

    const getStatusVariant = (status: string) => {
        switch (status) {
            case 'received': return 'default'; // Using default for success-like in shadcn often primary
            case 'cancelled': return 'destructive';
            case 'pending': return 'secondary';
            default: return 'outline';
        }
    };

    const columns = [
        {
            key: 'id',
            label: 'PO #',
            sortable: true,
            sortField: 'id',
            renderCell: (po: any) => <span className="font-mono font-medium">PO-{po.id}</span>
        },
        {
            key: 'supplier_name',
            label: 'Supplier',
            sortable: true,
            sortField: 'supplier_name',
            renderCell: (po: any) => <span className="font-medium">{po.supplier_name}</span>
        },
        {
            key: 'order_date',
            label: 'Date',
            sortable: true,
            sortField: 'order_date',
            renderCell: (po: any) => <span className="text-muted-foreground">{format(new Date(po.order_date), 'MMM d, yyyy')}</span>
        },
        {
            key: 'total_cost',
            label: 'Total Cost',
            sortable: true,
            sortField: 'total_cost',
            className: 'text-right',
            renderCell: (po: any) => <span className="font-bold">{currency}{po.total_cost?.toFixed(2)}</span>
        },
        {
            key: 'status',
            label: 'Status',
            sortable: true,
            sortField: 'status',
            renderCell: (po: any) => (
                <Badge variant={getStatusVariant(po.status)} className="capitalize">
                    {po.status}
                </Badge>
            )
        },
        {
            key: 'item_count',
            label: 'Items',
            sortable: true,
            sortField: 'item_count',
            className: 'text-center',
            renderCell: (po: any) => <span>{po.item_count}</span>
        }
    ];

    const actions = {
        primary: {
            label: "Create Purchase Order",
            url: "/purchase/create",
            icon: Plus
        }
    };

    const renderActions = (po: any) => (
        <Button variant="ghost" size="sm" asChild>
            <Link to={`/purchase/${po.id}`}>
                <Eye className="h-4 w-4 mr-2" />
                View
            </Link>
        </Button>
    );

    return (
        <div className="flex flex-col w-full px-1 mx-auto max-w-7xl space-y-6 p-4">
            <GenericPageHeader
                headerIcon={<Truck className="h-5 w-5 text-primary" />}
                headerLabel="Purchase Orders"
                actions={actions}
            />

            <Card>
                <CardContent className="p-0">
                    <DataTable
                        data={purchaseOrders}
                        // @ts-ignore
                        columns={columns}
                        isLoading={isLoading}
                        onRetry={refetch}
                        currentPage={page}
                        totalPages={totalPages}
                        onPageChange={setPage}
                        searchTerm={searchTerm}
                        onSearchChange={setSearchTerm}
                        searchPlaceholder="Search by PO ID or Supplier..."
                        renderActions={renderActions}
                        emptyState={
                            <div className="text-center p-8 text-muted-foreground">
                                No purchase orders found.
                            </div>
                        }
                    />
                </CardContent>
            </Card>
        </div>
    );
}
