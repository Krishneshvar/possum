import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGetSalesQuery, useFulfillSaleMutation } from "@/services/salesApi";
import OrdersTable from "../components/OrdersTable";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Loader2, X, RefreshCw } from "lucide-react";
import GenericPagination from "@/components/common/GenericPagination";
import { toast } from "sonner";

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

  return (
    <div className="h-[calc(100vh-7rem)] flex flex-col gap-4 p-4 overflow-hidden">
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

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search order or customer..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
          />
        </div>
        {searchTerm && (
          <Button variant="ghost" size="sm" onClick={() => setSearchTerm("")}>
            Clear Search
          </Button>
        )}
      </div>

      <div className="flex-1 rounded-lg border bg-card shadow-sm overflow-hidden flex flex-col">
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="flex-1 overflow-auto p-0">
            <OrdersTable
              orders={orders}
              onView={handleView}
              onFulfill={handleFulfill}
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
        <div className="text-xs text-muted-foreground px-4 italic">
          Orders are settled in Sales History after fulfillment.
        </div>
      </div>
    </div>
  );
}

