import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
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
import { Plus, Eye, ShoppingCart, PackageCheck, PackageX, Calendar as CalendarIcon } from 'lucide-react';
import { toast } from 'sonner';
// @ts-ignore
import CurrencyText from '@/components/common/CurrencyText';
import DataTable, { Column } from '@/components/common/DataTable';
// @ts-ignore
import ActionsDropdown from '@/components/common/ActionsDropdown';
import { DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import type { PurchaseOrder } from '@shared/index';
import { Input } from '@/components/ui/input';

type PurchaseSortField = 'id' | 'supplier_name' | 'order_date' | 'status' | 'item_count' | 'total_cost';
type PurchaseStatusFilter = 'pending' | 'received' | 'cancelled';

export default function PurchaseOrdersPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState<{ status: PurchaseStatusFilter[] }>({
    status: [],
  });
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [sortBy, setSortBy] = useState<PurchaseSortField>('order_date');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');

  const { data, isLoading, refetch } = useGetPurchaseOrdersQuery({
    page,
    limit,
    searchTerm,
    status: activeFilters.status.length > 0 ? activeFilters.status[0] : undefined,
    fromDate: fromDate || undefined,
    toDate: toDate || undefined,
    sortBy,
    sortOrder
  });

  const purchaseOrders: PurchaseOrder[] = data?.purchaseOrders || [];
  const totalCount = data?.totalCount || 0;
  const totalPages = data?.totalPages || 0;

  const [receivePurchaseOrder] = useReceivePurchaseOrderMutation();
  const [cancelPurchaseOrder] = useCancelPurchaseOrderMutation();
  const [poToCancel, setPoToCancel] = useState<PurchaseOrder | null>(null);

  const handleReceive = async (id: number) => {
    try {
      await receivePurchaseOrder(id).unwrap();
      toast.success('Purchase Order received. Stock updated.');
    } catch (error: any) {
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

  const handleSort = (column: Column) => {
    const field = (column.sortField || column.key) as PurchaseSortField;
    if (sortBy === field) {
      setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setSortBy(field);
      setSortOrder('DESC');
    }
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

  const handleFilterChange = (payload: { key: string; value: string[] }) => {
    if (payload.key !== 'status') return;
    const values = payload.value.filter((value): value is PurchaseStatusFilter =>
      value === 'pending' || value === 'received' || value === 'cancelled'
    );
    setActiveFilters((prev) => ({ ...prev, status: values }));
    setPage(1);
  };

  const handleClearFilters = () => {
    setActiveFilters({ status: [] });
    setSearchTerm('');
    setFromDate('');
    setToDate('');
    setPage(1);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getStatusVariant = (status: string) => {
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
      sortable: false,
      renderCell: (po: PurchaseOrder) => <span className="font-medium">#{po.id}</span>
    },
    {
      key: 'order_date',
      label: 'Order Date',
      sortable: true,
      sortField: 'order_date',
      renderCell: (po: PurchaseOrder) => <span className="text-muted-foreground whitespace-nowrap">{formatDate(po.order_date)}</span>
    },
    {
      key: 'supplier_name',
      label: 'Supplier',
      sortable: true,
      sortField: 'supplier_name',
      renderCell: (po: PurchaseOrder) => <span className="font-medium">{po.supplier_name}</span>
    },
    {
      key: 'total_cost',
      label: 'Total Amount',
      sortable: true,
      sortField: 'total_cost',
      className: 'text-right',
      renderCell: (po: PurchaseOrder) => (
        <div className="text-right font-bold text-primary">
          <CurrencyText value={po.total_cost} />
        </div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      sortable: false,
      className: 'text-center',
      renderCell: (po: PurchaseOrder) => (
        <div className="flex justify-center">
          <Badge variant={getStatusVariant(po.status) as "default" | "secondary" | "destructive" | "outline"} className="capitalize">
            {po.status}
          </Badge>
        </div>
      )
    },
  ];

  const renderActions = (po: PurchaseOrder) => {
    if (po.status === 'pending') {
      return (
        <TooltipProvider>
          <div className="flex items-center gap-1 justify-end">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleReceive(po.id)}
                  className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50 hidden md:flex"
                  aria-label={`Receive purchase order ${po.id}`}
                >
                  <PackageCheck className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Receive</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setPoToCancel(po)}
                  className="h-8 w-8 text-destructive hover:bg-destructive/10 hidden md:flex"
                  aria-label={`Cancel purchase order ${po.id}`}
                >
                  <PackageX className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Cancel</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate(`/purchase/orders/${po.id}`)}
                  className="h-8 w-8 text-muted-foreground hover:text-primary hidden md:flex"
                  aria-label={`View details for purchase order ${po.id}`}
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>View</TooltipContent>
            </Tooltip>
            <div className="md:hidden">
              <ActionsDropdown>
                <DropdownMenuItem onClick={() => navigate(`/purchase/orders/${po.id}`)} className="cursor-pointer">
                  <Eye className="mr-2 h-4 w-4" />
                  <span>View Details</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleReceive(po.id)} className="cursor-pointer text-green-600">
                  <PackageCheck className="mr-2 h-4 w-4" />
                  <span>Receive Order</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setPoToCancel(po)}
                  className="cursor-pointer text-destructive focus:text-destructive hover:bg-destructive/10"
                >
                  <PackageX className="mr-2 h-4 w-4" />
                  <span>Cancel Order</span>
                </DropdownMenuItem>
              </ActionsDropdown>
            </div>
          </div>
        </TooltipProvider>
      );
    }

    return (
      <TooltipProvider>
        <div className="flex items-center gap-1 justify-end">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(`/purchase/orders/${po.id}`)}
                className="h-8 w-8 text-muted-foreground hover:text-primary hidden md:flex"
                aria-label={`View details for purchase order ${po.id}`}
              >
                <Eye className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>View</TooltipContent>
          </Tooltip>
          <div className="md:hidden">
            <ActionsDropdown>
              <DropdownMenuItem onClick={() => navigate(`/purchase/orders/${po.id}`)} className="cursor-pointer">
                <Eye className="mr-2 h-4 w-4" />
                <span>View Details</span>
              </DropdownMenuItem>
            </ActionsDropdown>
          </div>
        </div>
      </TooltipProvider>
    );
  };

  const emptyState = (
    <div className="flex flex-col items-center justify-center p-12 text-center">
      <div className="rounded-full bg-muted p-6 mb-4">
        <ShoppingCart className="h-12 w-12 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-2">No Purchase Orders Yet</h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-md">
        Purchase orders help you track inventory orders from suppliers. Create your first order to manage incoming stock.
      </p>
      <Button onClick={() => navigate('/purchase/orders/create')} size="lg">
        <Plus className="mr-2 h-4 w-4" />
        Create First Purchase Order
      </Button>
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
          <Button onClick={() => navigate('/purchase/orders/create')}>
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
        onSearchChange={(value: string) => {
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
        customFilters={
          <div className="flex items-center gap-2">
            <div className="relative">
              <CalendarIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <Input
                type="date"
                value={fromDate}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setFromDate(e.target.value);
                  setPage(1);
                }}
                className="h-8 w-[140px] pl-8 text-xs focus-visible:ring-1"
                placeholder="From Date"
              />
            </div>
            <span className="text-muted-foreground text-xs">to</span>
            <div className="relative">
              <CalendarIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <Input
                type="date"
                value={toDate}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setToDate(e.target.value);
                  setPage(1);
                }}
                className="h-8 w-[140px] pl-8 text-xs focus-visible:ring-1"
                placeholder="To Date"
              />
            </div>
          </div>
        }

        emptyState={emptyState}
        renderActions={renderActions}
        avatarIcon={<ShoppingCart className="h-4 w-4 text-primary" />}
      />

      <AlertDialog open={!!poToCancel} onOpenChange={() => setPoToCancel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Purchase Order?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel PO #{poToCancel?.id}? This action cannot be undone.
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
