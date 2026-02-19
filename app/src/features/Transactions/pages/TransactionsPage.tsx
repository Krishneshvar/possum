import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useGetTransactionsQuery } from "@/services/transactionsApi";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, ArrowDownLeft, DollarSign, Download, Printer, CheckCircle2, Clock, XCircle } from "lucide-react";
import DataTable from "@/components/common/DataTable";
import CurrencyText from "@/components/common/CurrencyText";
import GenericPageHeader from "@/components/common/GenericPageHeader";
import { StatCards } from "@/components/common/StatCards";
import { KeyboardShortcut } from "@/components/common/KeyboardShortcut";

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
    const date = new Date(dateString);
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();
    
    if (isToday) {
      return date.toLocaleString('en-IN', {
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    
    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'completed': return 'default';
      case 'pending': return 'outline';
      case 'failed': return 'destructive';
      case 'cancelled': return 'secondary';
      default: return 'secondary';
    }
  };

  const getTypeIcon = (type: string) => {
    if (type === 'payment') return (
      <>
        <ArrowDownLeft className="h-4 w-4 text-green-500 mr-1" aria-hidden="true" />
        <span className="sr-only">Payment received</span>
      </>
    );
    if (type === 'refund') return (
      <>
        <ArrowUpRight className="h-4 w-4 text-red-500 mr-1" aria-hidden="true" />
        <span className="sr-only">Refund issued</span>
      </>
    );
    return null;
  };

  const columns = [
    {
      key: 'transaction_date',
      label: 'Date',
      sortable: true,
      sortField: 'transaction_date',
      renderCell: (t: any) => (
        <span className="text-muted-foreground whitespace-nowrap" title={new Date(t.transaction_date).toLocaleString('en-IN')}>
          {formatDate(t.transaction_date)}
        </span>
      )
    },
    {
      key: 'id',
      label: 'ID',
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
          aria-label={`View invoice ${t.invoice_number}`}
        >
          {t.invoice_number}
        </Button>
      )
    },
    {
      key: 'customer_name',
      label: 'Customer',
      sortable: true,
      sortField: 'customer_name',
      renderCell: (t: any) => t.customer_name || '-'
    },
    {
      key: 'type',
      label: 'Type',
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
        <div className={`text-right font-semibold ${t.type === 'refund' ? 'text-red-600' : 'text-green-600'}`}>
          <CurrencyText value={t.amount} />
        </div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      className: 'text-center',
      renderCell: (t: any) => (
        <div className="flex justify-center">
          {/* @ts-ignore */}
          <Badge variant={getStatusVariant(t.status)} className="capitalize px-2.5 py-0.5 text-xs font-medium">
            {t.status}
          </Badge>
        </div>
      )
    },
  ];

  const transactionsActions = {
    secondary: [
      {
        label: "Export",
        icon: Download,
        onClick: () => console.log('Export transactions'),
      },
      {
        label: "Print Report",
        icon: Printer,
        onClick: () => console.log('Print report'),
      },
    ],
  };

  const statsData = useMemo(() => {
    const totalPayments = transactions
      .filter(t => t.type === 'payment' && t.status === 'completed')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    
    const totalRefunds = transactions
      .filter(t => t.type === 'refund' && t.status === 'completed')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    
    const completed = transactions.filter(t => t.status === 'completed').length;
    const pending = transactions.filter(t => t.status === 'pending').length;
    const failed = transactions.filter(t => t.status === 'failed' || t.status === 'cancelled').length;

    return [
      { title: 'Total Payments', icon: ArrowDownLeft, color: 'text-green-500', todayValue: totalPayments, isCurrency: true },
      { title: 'Total Refunds', icon: ArrowUpRight, color: 'text-red-500', todayValue: totalRefunds, isCurrency: true },
      { title: 'Completed', icon: CheckCircle2, color: 'text-blue-500', todayValue: completed },
      { title: 'Pending/Failed', icon: Clock, color: 'text-yellow-500', todayValue: pending + failed },
    ];
  }, [transactions]);

  const emptyState = (
    <div className="text-center p-12 text-muted-foreground space-y-2">
      <DollarSign className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" aria-hidden="true" />
      <p className="text-base font-medium">No transactions found</p>
      <p className="text-sm">Transactions from sales and refunds will appear here.</p>
    </div>
  );

  return (
    <div className="space-y-4 sm:space-y-6 p-2 sm:p-4 lg:p-2 mb-6 w-full max-w-7xl overflow-hidden mx-auto">
      <div className="w-full">
        <GenericPageHeader
          headerIcon={<DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />}
          headerLabel="Transactions"
          actions={transactionsActions}
        />
        <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
          <span>Quick search:</span>
          <KeyboardShortcut keys={["Ctrl", "F"]} />
          <span className="text-muted-foreground/60">•</span>
          <span>{totalCount} total transactions</span>
        </div>
      </div>

      <StatCards cardData={statsData} />

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
