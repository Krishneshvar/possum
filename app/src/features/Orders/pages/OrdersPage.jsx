import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGetSalesQuery } from "@/services/salesApi";
import SalesHistoryTable from "@/features/Sales/components/SalesHistoryTable";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Loader2, X } from "lucide-react";
import GenericFilter from "@/components/common/GenericFilter";
import GenericPagination from "@/components/common/GenericPagination";

export default function OrdersPage() {
  const navigate = useNavigate();
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

  const { data, isLoading, isFetching } = useGetSalesQuery({
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
    console.log("Print Sale", sale);
    // Implement print logic or navigate to print page
  };

  return (
    <div className="h-[calc(100vh-7rem)] flex flex-col gap-4 p-4 overflow-hidden">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-2xl font-bold tracking-tight">Orders</h1>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">{totalCount} Orders Total</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
        <div className="md:col-span-4 lg:col-span-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search invoice or customer..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </div>

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

        <div className="md:col-span-3 lg:col-span-5 flex justify-end items-center gap-4">
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
            <SalesHistoryTable
              sales={sales}
              onView={handleView}
              onPrint={handlePrint}
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
