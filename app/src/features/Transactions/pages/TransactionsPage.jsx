import { useState } from "react";
import { useGetTransactionsQuery } from "@/services/transactionsApi";
import TransactionsTable from "../components/TransactionsTable";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X, Loader2 } from "lucide-react";
import GenericFilter from "@/components/common/GenericFilter";
import GenericPagination from "@/components/common/GenericPagination";

export default function TransactionsPage() {
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [activeFilters, setActiveFilters] = useState({
    status: [],
    type: [],
  });
  const [dateRange, setDateRange] = useState({
    startDate: "",
    endDate: "",
  });
  const [sort, setSort] = useState({
    sortBy: "transaction_date",
    sortOrder: "DESC",
  });

  const { data, isLoading } = useGetTransactionsQuery({
    page,
    limit,
    status: activeFilters.status.length > 0 ? activeFilters.status : undefined,
    type: activeFilters.type.length > 0 ? activeFilters.type : undefined,
    startDate: dateRange.startDate || undefined,
    endDate: dateRange.endDate || undefined,
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

  const handleFilterChange = (key, value) => {
    setActiveFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const handleClearFilters = () => {
    setActiveFilters({ status: [], type: [] });
    setDateRange({ startDate: "", endDate: "" });
    setPage(1);
  };

  const handleSort = (field, order) => {
    setSort({ sortBy: field, sortOrder: order });
  };

  return (
    <div className="h-[calc(100vh-7rem)] flex flex-col gap-4 p-4 overflow-hidden">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-2xl font-bold tracking-tight">Transactions</h1>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">{totalCount} Transactions</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
        <div className="md:col-span-5 lg:col-span-4 flex items-center gap-2">
          <div className="flex-1">
            <Input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => {
                setDateRange((prev) => ({ ...prev, startDate: e.target.value }));
                setPage(1);
              }}
              className="h-9"
            />
          </div>
          <span className="text-muted-foreground">to</span>
          <div className="flex-1">
            <Input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => {
                setDateRange((prev) => ({ ...prev, endDate: e.target.value }));
                setPage(1);
              }}
              className="h-9"
            />
          </div>
          {(dateRange.startDate || dateRange.endDate) && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => {
                setDateRange({ startDate: "", endDate: "" });
                setPage(1);
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        <div className="md:col-span-7 lg:col-span-8 flex justify-end items-center gap-4">
          <GenericFilter
            filtersConfig={filtersConfig}
            activeFilters={activeFilters}
            onFilterChange={handleFilterChange}
            onClearAll={handleClearFilters}
          />
        </div>
      </div>

      <div className="flex-1 rounded-lg border bg-card shadow-sm overflow-hidden flex flex-col">
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="flex-1 overflow-auto p-0">
            <TransactionsTable
              transactions={transactions}
              sortBy={sort.sortBy}
              sortOrder={sort.sortOrder}
              onSort={handleSort}
            />
          </div>
        )}
      </div>

      <div className="flex items-center justify-between bg-muted/20 p-2 rounded-lg border">
        <GenericPagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      </div>
    </div>
  );
}
