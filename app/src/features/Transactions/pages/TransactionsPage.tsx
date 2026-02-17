import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGetTransactionsQuery } from "@/services/transactionsApi";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, ArrowDownLeft, DollarSign } from "lucide-react";
import DataTable from "@/components/common/DataTable";
import CurrencyText from "@/components/common/CurrencyText";

export default function TransactionsPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [activeFilters, setActiveFilters] = useState<{ status: string[], type: string[] }>({
    status: [],
    type: [],
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [sort, setSort] = useState({
    sortBy: "transaction_date",
    sortOrder: "DESC",
  });

  const { data, isLoading, refetch } = useGetTransactionsQuery({
    page,
    limit,
    status: activeFilters.status.length > 0 ? activeFilters.status[0] : undefined,
    type: activeFilters.type.length > 0 ? activeFilters.type[0] : undefined,
    searchTerm: searchTerm || undefined,
    sortBy: sort.sortBy,
    sortOrder: sort.sortOrder,
  });

  const transactions = data?.transactions || [];
  const totalPages = data?.totalPages || 1;
  const totalCount = data?.totalCount || 0;

  const filtersConfig = [
    {
      key: "status",
      label: "Status",
      placeholder: "Filter by Status",
      options: [
        { label: "Completed", value: "completed" },
        { label: "Pending", value: "pending" },
        { label: "Cancelled", value: "cancelled" },
      ],
    },
    {
      key: "type",
      label: "Type",
      placeholder: "Filter by Type",
      options: [
        { label: "Payment", value: "payment" },
        { label: "Refund", value: "refund" },
      ],
    },
  ];

  const handleFilterChange = ({ key, value }: { key: string, value: string[] }) => {
    setActiveFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const handleClearFilters = () => {
    setActiveFilters({ status: [], type: [] });
    setSearchTerm("");
    setPage(1);
  };

  const handleSort = (column: any) => {
    const order = sort.sortBy === column.sortField && sort.sortOrder === 'ASC' ? 'DESC' : 'ASC';
    setSort({ sortBy: column.sortField, sortOrder: order });
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'completed': return 'default';
      case 'pending': return 'secondary'; // warning
      case 'failed': return 'destructive';
      case 'cancelled': return 'secondary';
      default: return 'secondary';
    }
  };

  const getTypeIcon = (type: string) => {
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
      renderCell: (t: any) => <span className="text-muted-foreground whitespace-nowrap">{formatDate(t.transaction_date)}</span>
    },
    {
      key: 'id',
      label: 'ID',
      sortable: true,
      sortField: 'id',
      renderCell: (t: any) => <span className="font-mono text-xs">#{t.id}</span>
    },
    {
      key: 'invoice_number',
      label: 'Invoice',
      sortable: false,
      renderCell: (t: any) => (
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
      renderCell: (t: any) => t.customer_name || '-'
    },
    {
      key: 'type',
      label: 'Type',
      sortable: true,
      sortField: 'type',
      renderCell: (t: any) => (
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
      renderCell: (t: any) => t.payment_method_name
    },
    {
      key: 'amount',
      label: 'Amount',
      sortable: true,
      sortField: 'amount',
      className: 'text-right',
      renderCell: (t: any) => (
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
      renderCell: (t: any) => (
        <div className="flex justify-center">
          {/* @ts-ignore */}
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
    <div className="h-[calc(100vh-6.5rem)] flex flex-col gap-4 p-2 overflow-hidden">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-2xl font-bold tracking-tight">Transactions</h1>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">{totalCount} Transactions</span>
        </div>
      </div>

      <DataTable
        data={transactions}
        // @ts-ignore
        columns={columns}
        isLoading={isLoading}
        onRetry={refetch}

        searchTerm={searchTerm}
        onSearchChange={(value) => {
          setSearchTerm(value);
          setPage(1);
        }}
        searchPlaceholder="Search transactions..."

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
        // @ts-ignore
        avatarIcon={<DollarSign className="h-4 w-4 text-primary" />}
      />
    </div>
  );
}
