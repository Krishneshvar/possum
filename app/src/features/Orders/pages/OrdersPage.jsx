import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGetSalesQuery, useFulfillSaleMutation } from "@/services/salesApi";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, PackageCheck, ShoppingBag, Clock, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import DataTable from "@/components/common/DataTable";
import CurrencyText from "@/components/common/CurrencyText";

export default function OrdersPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [sort, setSort] = useState({
    sortBy: "sale_date",
    sortOrder: "DESC",
  });

  const { data, isLoading, isFetching, refetch } = useGetSalesQuery({
    page,
    limit,
    fulfillmentStatus: 'pending',
    searchTerm: searchTerm || undefined,
    sortBy: sort.sortBy,
    sortOrder: sort.sortOrder,
  });

  const [fulfillSale, { isLoading: isFulfilling }] = useFulfillSaleMutation();

  const orders = data?.sales || [];
  const totalPages = data?.totalPages || 1;
  const totalCount = data?.totalCount || 0;

  const handleSort = (field, order) => {
    setSort({ sortBy: field, sortOrder: order });
  };

  const handleView = (order) => {
    navigate(`/sales/history/${order.id}`);
  };

  const handleFulfill = async (order) => {
    try {
      await fulfillSale(order.id).unwrap();
      toast.success(`Order ${order.invoice_number} fulfilled!`);
    } catch (err) {
      toast.error(err?.data?.error || "Failed to fulfill order.");
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimeAgo = (dateString) => {
    if (!dateString) return '';
    const seconds = Math.floor((new Date() - new Date(dateString)) / 1000);

    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + "y ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + "mo ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + "d ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "h ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "m ago";
    return Math.floor(seconds) + "s ago";
  };

  const getStatusVariant = (status) => {
    switch (status) {
      case 'paid': return 'default';
      case 'partially_paid': return 'outline';
      case 'draft': return 'secondary';
      default: return 'secondary';
    }
  };

  const columns = [
    {
      key: 'time_ago',
      label: 'Elapsed',
      sortable: true,
      sortField: 'sale_date',
      renderCell: (order) => (
        <div className="flex flex-col">
          <span className="text-xs font-semibold text-primary flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {getTimeAgo(order.sale_date)}
          </span>
          <span className="text-[10px] text-muted-foreground">{formatDate(order.sale_date)}</span>
        </div>
      )
    },
    {
      key: 'invoice_number',
      label: 'Order #',
      sortable: true,
      sortField: 'invoice_number',
      renderCell: (order) => <span className="font-bold">{order.invoice_number}</span>
    },
    {
      key: 'customer_name',
      label: 'Customer',
      renderCell: (order) => (
        <div className="flex flex-col">
          <span className="font-medium">{order.customer_name || 'Walk-in'}</span>
          <span className="text-[10px] text-muted-foreground">Cashier: {order.cashier_name}</span>
        </div>
      )
    },
    {
      key: 'total_amount',
      label: 'Total',
      sortable: true,
      sortField: 'total_amount',
      className: 'text-right',
      renderCell: (order) => (
        <div className="text-right font-bold">
          <CurrencyText value={order.total_amount} />
        </div>
      )
    },
    {
      key: 'paid_amount',
      label: 'Payment',
      renderCell: (order) => {
        const unpaid = order.total_amount - order.paid_amount;
        return (
          <div className="flex flex-col items-end">
            <Badge variant={getStatusVariant(order.status)} className="text-[9px] uppercase">
              {order.status.replace('_', ' ')}
            </Badge>
            {unpaid > 0 && (
              <span className="text-[9px] text-destructive font-bold">
                Due: <CurrencyText value={unpaid} />
              </span>
            )}
          </div>
        );
      }
    }
  ];

  const renderActions = (order) => (
    <div className="flex justify-end gap-2">
      <Button
        variant="outline"
        size="sm"
        className="h-8 gap-1 text-xs"
        onClick={() => handleView(order)}
      >
        <Eye className="h-3 w-3" />
        Details
      </Button>
      {order.fulfillment_status === 'pending' && (
        <Button
          variant="default"
          size="sm"
          className="h-8 gap-1 text-xs bg-green-600 hover:bg-green-700"
          onClick={() => handleFulfill(order)}
        >
          <PackageCheck className="h-3 w-3" />
          Fulfill
        </Button>
      )}
    </div>
  );

  const emptyState = (
    <div className="text-center p-12 text-muted-foreground flex flex-col items-center gap-2">
      <ShoppingBag className="h-12 w-12 opacity-20" />
      <p>No pending orders to fulfill.</p>
    </div>
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pending Orders</h1>
          <p className="text-sm text-muted-foreground">Manage and fulfill active customer orders.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium bg-primary/10 text-primary px-3 py-1 rounded-full border border-primary/20">
            {totalCount} Orders Pending
          </span>
          <Button variant="outline" size="icon" onClick={() => refetch()} className="h-9 w-9">
            <RefreshCw className={isFetching ? "animate-spin" : ""} size={16} />
          </Button>
        </div>
      </div>

      <DataTable
        data={orders}
        columns={columns}
        isLoading={isLoading}
        onRetry={refetch}

        searchTerm={searchTerm}
        onSearchChange={(value) => {
          setSearchTerm(value);
          setPage(1);
        }}
        searchPlaceholder="Search order or customer..."

        sortBy={sort.sortBy}
        sortOrder={sort.sortOrder}
        onSort={handleSort}

        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}

        emptyState={emptyState}
        renderActions={renderActions}
      />
    </div>
  );
}

