import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { TransactionsResponse, useGetTransactionsQuery } from "@/services/transactionsApi";
import { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, ArrowDownLeft, DollarSign, Download, Printer, CheckCircle2, Clock } from "lucide-react";
import DataTable, { type Column } from "@/components/common/DataTable";
import CurrencyText from "@/components/common/CurrencyText";
import GenericPageHeader from "@/components/common/GenericPageHeader";
import { StatCards } from "@/components/common/StatCards";
import { KeyboardShortcut } from "@/components/common/KeyboardShortcut";

type TransactionRow = TransactionsResponse['transactions'][number];
type TransactionStatusFilter = 'completed' | 'pending' | 'cancelled';
type TransactionTypeFilter = 'payment' | 'refund';

type SortableField = "transaction_date" | "amount" | "status" | "customer_name" | "invoice_number";
type SortOrder = "ASC" | "DESC";

export default function TransactionsPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [activeFilters, setActiveFilters] = useState<{ status: TransactionStatusFilter[], type: TransactionTypeFilter[] }>({
    status: [],
    type: [],
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [sort, setSort] = useState({
    sortBy: "transaction_date" as SortableField,
    sortOrder: "DESC" as SortOrder,
  });

  const { data, isLoading, isError, error, refetch } = useGetTransactionsQuery({
    page,
    limit,
    status: activeFilters.status.length > 0 ? activeFilters.status[0] : undefined,
    type: activeFilters.type.length > 0 ? activeFilters.type[0] : undefined,
    searchTerm: searchTerm || undefined,
    sortBy: sort.sortBy,
    sortOrder: sort.sortOrder,
  });

  const transactions: TransactionRow[] = data?.transactions || [];
  const totalPages = data?.totalPages || 1;
  const totalCount = data?.totalCount || 0;
  const tableError = useMemo(() => {
    if (!isError || !error) return null;
    const err = error as FetchBaseQueryError;
    if (typeof err === 'object' && err && 'data' in err && err.data && typeof err.data === 'object' && 'error' in err.data) {
      return String((err.data as { error: string }).error);
    }
    return 'Failed to load transactions';
  }, [isError, error]);

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
    if (key === 'status') {
      setActiveFilters((prev) => ({ ...prev, status: value as TransactionStatusFilter[] }));
    } else if (key === 'type') {
      setActiveFilters((prev) => ({ ...prev, type: value as TransactionTypeFilter[] }));
    }
    setPage(1);
  };

  const handleClearFilters = () => {
    setActiveFilters({ status: [], type: [] });
    setSearchTerm("");
    setPage(1);
  };

  const handleSort = (column: Column) => {
    if (!column.sortField) return;
    const sortField = column.sortField as SortableField;
    const order: SortOrder = sort.sortBy === sortField && sort.sortOrder === 'ASC' ? 'DESC' : 'ASC';
    setSort({ sortBy: sortField, sortOrder: order });
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return '-';
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

  const getStatusVariant = (status: string): 'default' | 'outline' | 'destructive' | 'secondary' => {
    switch (status) {
      case 'completed': return 'default';
      case 'pending': return 'outline';
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
      renderCell: (t: TransactionRow) => {
        const date = new Date(t.transaction_date);
        const title = Number.isNaN(date.getTime()) ? '-' : date.toLocaleString('en-IN');
        return (
          <span className="text-muted-foreground whitespace-nowrap" title={title}>
            {formatDate(t.transaction_date)}
          </span>
        );
      }
    },
    {
      key: 'id',
      label: 'ID',
      renderCell: (t: TransactionRow) => <span className="font-mono text-xs">#{t.id}</span>
    },
    {
      key: 'invoice_number',
      label: 'Invoice',
      sortable: false,
      renderCell: (t: TransactionRow) => (
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
      renderCell: (t: TransactionRow) => t.customer_name || '-'
    },
    {
      key: 'type',
      label: 'Type',
      renderCell: (t: TransactionRow) => (
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
      renderCell: (t: TransactionRow) => t.payment_method_name || '-'
    },
    {
      key: 'amount',
      label: 'Amount',
      sortable: true,
      sortField: 'amount',
      className: 'text-right',
      renderCell: (t: TransactionRow) => (
        <div className={`text-right font-semibold ${t.type === 'refund' ? 'text-red-600' : 'text-green-600'}`}>
          <CurrencyText value={t.amount} />
        </div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      className: 'text-center',
      renderCell: (t: TransactionRow) => (
        <div className="flex justify-center">
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
    const cancelled = transactions.filter(t => t.status === 'cancelled').length;

    return [
      { title: 'Total Payments', icon: ArrowDownLeft, color: 'text-green-500', todayValue: totalPayments, isCurrency: true },
      { title: 'Total Refunds', icon: ArrowUpRight, color: 'text-red-500', todayValue: totalRefunds, isCurrency: true },
      { title: 'Completed', icon: CheckCircle2, color: 'text-blue-500', todayValue: completed },
      { title: 'Pending/Cancelled', icon: Clock, color: 'text-yellow-500', todayValue: pending + cancelled },
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
        columns={columns}
        isLoading={isLoading}
        error={tableError}
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
        avatarIcon={<DollarSign className="h-4 w-4 text-primary" />}
      />
    </div>
  );
}
