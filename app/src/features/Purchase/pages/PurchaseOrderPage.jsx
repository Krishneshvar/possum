import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  useGetPurchaseOrdersQuery,
  useReceivePurchaseOrderMutation,
  useCancelPurchaseOrderMutation
} from '@/services/purchaseApi';
import { useNavigate } from 'react-router-dom';
import { Plus, Eye, CheckCircle, XCircle, ShoppingCart } from 'lucide-react';
import { toast } from 'sonner';
import CurrencyText from '@/components/common/CurrencyText';
import DataTable from '@/components/common/DataTable';
import ActionsDropdown from '@/components/common/ActionsDropdown';
import { DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';

export default function PurchaseOrdersPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState({
    status: [],
  });
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [sortBy, setSortBy] = useState('order_date');
  const [sortOrder, setSortOrder] = useState('DESC');

  const { data, isLoading, refetch } = useGetPurchaseOrdersQuery({
    page,
    limit,
    searchTerm,
    status: activeFilters.status.length > 0 ? activeFilters.status[0] : undefined,
    sortBy,
    sortOrder
  });

  const purchaseOrders = data?.purchaseOrders || [];
  const totalCount = data?.totalCount || 0;
  const totalPages = data?.totalPages || 0;

  const [receivePurchaseOrder] = useReceivePurchaseOrderMutation();
  const [cancelPurchaseOrder] = useCancelPurchaseOrderMutation();
  const [poToCancel, setPoToCancel] = useState(null);

  const handleReceive = async (id) => {
    try {
      await receivePurchaseOrder(id).unwrap();
      toast.success('Purchase Order received. Stock updated.');
    } catch (error) {
      console.error('Failed to receive PO:', error);
      toast.error(error?.data?.error || 'Failed to receive Purchase Order');
    }
  };

  const handleCancel = async () => {
    if (!poToCancel) return;
    try {
      await cancelPurchaseOrder(poToCancel.id).unwrap();
      toast.success('Purchase Order cancelled.');
      setPoToCancel(null);
    } catch (error) {
      console.error('Failed to cancel PO:', error);
      toast.error('Failed to cancel Purchase Order');
    }
  };

  const handleSort = (field, order) => {
    setSortBy(field);
    setSortOrder(order);
  };

  const filtersConfig = [
    {
      key: "status",
      label: "Status",
      placeholder: "Filter by Status",
      options: [
        { label: "Pending", value: "pending" },
        { label: "Received", value: "received" },
        { label: "Cancelled", value: "cancelled" },
      ],
    },
  ];

  const handleFilterChange = (key, value) => {
    setActiveFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const handleClearFilters = () => {
    setActiveFilters({ status: [] });
    setSearchTerm('');
    setPage(1);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getStatusVariant = (status) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'received': return 'default';
      case 'cancelled': return 'destructive';
      default: return 'secondary';
    }
  };

  const columns = [
    {
      key: 'id',
      label: 'PO Number',
      sortable: true,
      sortField: 'id',
      renderCell: (po) => <span className="font-medium">#{po.id}</span>
    },
    {
      key: 'order_date',
      label: 'Order Date',
      sortable: true,
      sortField: 'order_date',
      renderCell: (po) => <span className="text-muted-foreground whitespace-nowrap">{formatDate(po.order_date)}</span>
    },
    {
      key: 'supplier_name',
      label: 'Supplier',
      sortable: false,
      renderCell: (po) => <span className="font-medium">{po.supplier_name}</span>
    },
    {
      key: 'total_cost',
      label: 'Total Amount',
      sortable: true,
      sortField: 'total_cost',
      className: 'text-right',
      renderCell: (po) => (
        <div className="text-right font-bold text-primary">
          <CurrencyText value={po.total_cost} />
        </div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      sortField: 'status',
      className: 'text-center',
      renderCell: (po) => (
        <div className="flex justify-center">
          <Badge variant={getStatusVariant(po.status)} className="capitalize">
            {po.status}
          </Badge>
        </div>
      )
    },
  ];

  const renderActions = (po) => (
    <ActionsDropdown>
      <DropdownMenuItem onClick={() => navigate(`/purchase/orders/${po.id}`)} className="cursor-pointer">
        <Eye className="mr-2 h-4 w-4" />
        <span>View Details</span>
      </DropdownMenuItem>
      {po.status === 'pending' && (
        <>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => handleReceive(po.id)} className="cursor-pointer text-green-600 focus:text-green-600">
            <CheckCircle className="mr-2 h-4 w-4" />
            <span>Mark as Received</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setPoToCancel(po)}
            className="cursor-pointer text-destructive focus:text-destructive"
          >
            <XCircle className="mr-2 h-4 w-4" />
            <span>Cancel Order</span>
          </DropdownMenuItem>
        </>
      )}
    </ActionsDropdown>
  );

  const emptyState = (
    <div className="text-center p-8 text-muted-foreground">
      No purchase orders found. Create your first purchase order to get started.
    </div>
  );

  return (
    <div className="h-[calc(100vh-6.5rem)] flex flex-col gap-4 p-2 overflow-hidden">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Purchase Orders</h1>
          <p className="text-sm text-muted-foreground">Manage and track your purchase orders.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">{totalCount} Orders</span>
          <Button onClick={() => navigate('/purchase/orders/new')}>
            <Plus className="mr-2 h-4 w-4" />
            New Purchase Order
          </Button>
        </div>
      </div>

      <DataTable
        data={purchaseOrders}
        columns={columns}
        isLoading={isLoading}
        onRetry={refetch}

        searchTerm={searchTerm}
        onSearchChange={(value) => {
          setSearchTerm(value);
          setPage(1);
        }}
        searchPlaceholder="Search purchase orders..."

        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={handleSort}

        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}

        filtersConfig={filtersConfig}
        activeFilters={activeFilters}
        onFilterChange={handleFilterChange}
        onClearAllFilters={handleClearFilters}

        emptyState={emptyState}
        renderActions={renderActions}
        avatarIcon={<ShoppingCart className="h-4 w-4 text-primary" />}
      />

      <AlertDialog open={!!poToCancel} onOpenChange={() => setPoToCancel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Purchase Order?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel PO #{poToCancel?.order_number}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>No, Keep It</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancel} className="bg-destructive hover:bg-destructive/90">
              Yes, Cancel Order
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
