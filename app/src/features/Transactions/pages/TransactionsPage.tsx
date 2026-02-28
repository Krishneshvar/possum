import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { TransactionsResponse, useGetTransactionsQuery } from "@/services/transactionsApi";
import { useGetPaymentMethodsQuery } from "@/services/salesApi";
import { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, ArrowDownLeft, DollarSign, Download, Printer, CheckCircle2, Clock, ExternalLink, TrendingUp } from "lucide-react";
import DataTable, { type Column } from "@/components/common/DataTable";
import CurrencyText from "@/components/common/CurrencyText";
import GenericPageHeader from "@/components/common/GenericPageHeader";
import { StatCards } from "@/components/common/StatCards";
import { KeyboardShortcut } from "@/components/common/KeyboardShortcut";

import DateRangeFilter from "@/components/common/DateRangeFilter";

type TransactionRow = TransactionsResponse['transactions'][number];
type TransactionTypeFilter = 'payment' | 'refund' | 'purchase' | 'purchase_refund';

type SortableField = "transaction_date" | "amount" | "status" | "customer_name" | "invoice_number";
type SortOrder = "ASC" | "DESC";

export default function TransactionsPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [activeFilters, setActiveFilters] = useState<{ paymentMethod: string[], type: TransactionTypeFilter[] }>({
    paymentMethod: [],
    type: [],
  });
  const [dateRange, setDateRange] = useState<{ startDate: string | null; endDate: string | null }>({
    startDate: null,
    endDate: null,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [sort, setSort] = useState({
    sortBy: "transaction_date" as SortableField,
    sortOrder: "DESC" as SortOrder,
  });

  const { data: paymentMethodsData } = useGetPaymentMethodsQuery(undefined);
  const paymentMethods: any[] = paymentMethodsData || [];

  const { data, isLoading, isError, error, refetch, isFetching: isRefreshing } = useGetTransactionsQuery({
    page,
    limit,
    status: 'completed',
    type: activeFilters.type.length > 0 ? activeFilters.type[0] : undefined,
    paymentMethodId: activeFilters.paymentMethod?.length > 0 ? Number(activeFilters.paymentMethod[0]) : undefined,
    startDate: dateRange.startDate || undefined,
    endDate: dateRange.endDate || undefined,
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
      key: "paymentMethod",
      label: "Payment Method",
      placeholder: "Filter by Method",
      options: paymentMethods.map(pm => ({ label: pm.name, value: pm.id.toString() })),
    },
    {
      key: "type",
      label: "Type",
      placeholder: "Filter by Type",
      options: [
        { label: "Payment", value: "payment" },
        { label: "Refund", value: "refund" },
        { label: "Purchase", value: "purchase" },
        { label: "Purchase Refund", value: "purchase_refund" },
      ],
    },
  ];

  const handleFilterChange = ({ key, value }: { key: string, value: string[] }) => {
    if (key === 'paymentMethod') {
      setActiveFilters((prev) => ({ ...prev, paymentMethod: value }));
    } else if (key === 'type') {
      setActiveFilters((prev) => ({ ...prev, type: value as TransactionTypeFilter[] }));
    }
    setPage(1);
  };

  const handleDateRangeApply = (startDate: string, endDate: string) => {
    setDateRange({ startDate, endDate });
    setPage(1);
  };

  const handleClearFilters = () => {
    setActiveFilters({ paymentMethod: [], type: [] });
    setDateRange({ startDate: null, endDate: null });
    setSearchTerm("");
    setPage(1);
  };

  const isAnyFilterActive = activeFilters.paymentMethod.length > 0 ||
    activeFilters.type.length > 0 ||
    dateRange.startDate !== null ||
    dateRange.endDate !== null;

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

  const getTypeIcon = (type: string) => {
    if (type === 'payment' || type === 'purchase_refund') return (
      <>
        <ArrowDownLeft className="h-4 w-4 text-green-500 mr-1" aria-hidden="true" />
        <span className="sr-only">{type === 'payment' ? 'Payment received' : 'Purchase refund received'}</span>
      </>
    );
    if (type === 'refund' || type === 'purchase') return (
      <>
        <ArrowUpRight className="h-4 w-4 text-red-500 mr-1" aria-hidden="true" />
        <span className="sr-only">{type === 'refund' ? 'Refund issued' : 'Purchase made'}</span>
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
      key: 'actions',
      label: 'Actions',
      sortable: false,
      renderCell: (t: TransactionRow) => {
        if (t.purchase_order_id) {
          return (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/purchase/orders/${t.purchase_order_id}`)}
              title="View Purchase Order"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              PO-{t.purchase_order_id}
            </Button>
          )
        }
        return (
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/sales/history/${t.sale_id}`)}
            title="View Invoice"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            {t.invoice_number}
          </Button>
        )
      }
    },
    {
      key: 'customer_name',
      label: 'Party',
      sortable: true,
      sortField: 'customer_name',
      renderCell: (t: TransactionRow) => t.customer_name || t.supplier_name || '-'
    },
    {
      key: 'type',
      label: 'Type & Method',
      renderCell: (t: TransactionRow) => (
        <div className="flex flex-col">
          <div className="flex items-center capitalize text-sm">
            {getTypeIcon(t.type)}
            {t.type}
          </div>
          <span className="text-xs text-muted-foreground capitalize mt-0.5 ml-5">
            {t.payment_method_name || 'N/A'}
          </span>
        </div>
      )
    },
    {
      key: 'amount',
      label: 'Amount',
      sortable: true,
      sortField: 'amount',
      className: 'text-right',
      renderCell: (t: TransactionRow) => (
        <div className={`text-right font-semibold ${t.amount < 0 ? 'text-red-600' : 'text-green-600'}`}>
          <CurrencyText value={t.amount} />
        </div>
      )
    }
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
      .filter(t => (t.type === 'payment' || t.type === 'purchase_refund') && t.status === 'completed')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const totalRefunds = transactions
      .filter(t => (t.type === 'refund' || t.type === 'purchase') && t.status === 'completed')
      .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0);

    const profit = totalPayments - totalRefunds;

    return [
      { title: 'Total In', icon: ArrowDownLeft, color: 'text-green-500', todayValue: totalPayments, isCurrency: true },
      { title: 'Total Out', icon: ArrowUpRight, color: 'text-red-500', todayValue: totalRefunds, isCurrency: true },
      { title: 'Net Profit', icon: TrendingUp, color: profit >= 0 ? 'text-blue-500' : 'text-red-500', todayValue: profit, isCurrency: true },
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
        isAnyFilterActive={isAnyFilterActive}
        customFilters={
          <DateRangeFilter
            startDate={dateRange.startDate}
            endDate={dateRange.endDate}
            onApply={handleDateRangeApply}
          />
        }

        emptyState={emptyState}
        avatarIcon={<DollarSign className="h-4 w-4 text-primary" />}
        onRefresh={refetch}
        isRefreshing={isRefreshing}
      />
    </div>
  );
}
