import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGetSalesQuery } from "@/services/salesApi";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Printer, ShoppingBag } from "lucide-react";
import DataTable from "@/components/common/DataTable";
import CurrencyText from "@/components/common/CurrencyText";
import { useSelector } from 'react-redux';

export default function SalesHistoryPage() {
  const navigate = useNavigate();
  const token = useSelector(state => state.auth.token);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [activeFilters, setActiveFilters] = useState({
    status: [],
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState({
    startDate: "",
    endDate: "",
  });
  const [sort, setSort] = useState({
    sortBy: "sale_date",
    sortOrder: "DESC",
  });

  const { data, isLoading, isFetching, refetch } = useGetSalesQuery({
    page,
    limit,
    status: activeFilters.status.length > 0 ? activeFilters.status : undefined,
    searchTerm: searchTerm || undefined,
    startDate: dateRange.startDate || undefined,
    endDate: dateRange.endDate || undefined,
    sortBy: sort.sortBy,
    sortOrder: sort.sortOrder,
  });

  const sales = data?.sales || [];
  const totalPages = data?.totalPages || 1;
  const totalCount = data?.totalCount || 0;

  const filtersConfig = [
    {
      key: "status",
      label: "Status",
      placeholder: "Filter by Status",
      options: [
        { label: "Paid", value: "paid" },
        { label: "Partially Paid", value: "partially_paid" },
        { label: "Draft", value: "draft" },
        { label: "Cancelled", value: "cancelled" },
        { label: "Refunded", value: "refunded" },
      ],
    },
  ];

  const handleFilterChange = (key, value) => {
    setActiveFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const handleClearFilters = () => {
    setActiveFilters({ status: [] });
    setDateRange({ startDate: "", endDate: "" });
    setSearchTerm("");
    setPage(1);
  };

  const handleSort = (field, order) => {
    setSort({ sortBy: field, sortOrder: order });
  };

  const handleView = (sale) => {
    navigate(`/sales/history/${sale.id}`);
  };

  const handlePrint = (sale) => {
    if (window.electronAPI && window.electronAPI.printInvoice) {
      window.electronAPI.printInvoice(sale.id, token)
        .catch(err => console.error("Print failed:", err));
    } else {
      console.log("Print Sale", sale);
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
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleView(sale)} title="View Details">
        <Eye className="h-4 w-4 text-muted-foreground hover:text-primary transition-colors" />
      </Button>
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handlePrint(sale)} title="Print Receipt">
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
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-2xl font-bold tracking-tight">Sales History</h1>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">{totalCount} Sales Total</span>
        </div>
      </div>

      <DataTable
        data={sales}
        columns={columns}
        isLoading={isLoading}
        onRetry={refetch}

        searchTerm={searchTerm}
        onSearchChange={(value) => {
          setSearchTerm(value);
          setPage(1);
        }}
        searchPlaceholder="Search invoice or customer..."

        sortBy={sort.sortBy}
        sortOrder={sort.sortOrder}
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
      />
    </div>
  );
}
