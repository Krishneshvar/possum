import { useState } from "react";
import { useGetSalesQuery } from "@/services/salesApi";
import SalesHistoryTable from "../components/SalesHistoryTable";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

export default function SalesHistoryPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [status, setStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Debounce search could be added here, but for now passing directly or simple state debounce
  const { data, isLoading, isFetching } = useGetSalesQuery({
    page,
    limit,
    status: status === "all" ? undefined : status,
    searchTerm: searchTerm || undefined
  });

  const sales = data?.sales || [];
  const totalPages = data?.totalPages || 1;

  const handleView = (sale) => {
    // TODO: Implement viewing sale details (modal or separate page)
    console.log("View Sale", sale);
  };

  const handlePrint = (sale) => {
    // TODO: Implement reprint
    console.log("Print Sale", sale);
  };

  return (
    <div className="h-[calc(100vh-7rem)] flex flex-col gap-4 p-4 overflow-hidden">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-2xl font-bold tracking-tight">Sales History</h1>

        <div className="flex items-center gap-2">
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search invoice or customer..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1); // Reset to page 1 on search
              }}
            />
          </div>

          <Select value={status} onValueChange={(val) => {
            setStatus(val);
            setPage(1);
          }}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="partially_paid">Partially Paid</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex-1 rounded-lg border bg-card shadow-sm overflow-auto">
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="p-4">
            <SalesHistoryTable
              sales={sales}
              onView={handleView}
              onPrint={handlePrint}
            />
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Page {page} of {totalPages}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1 || isLoading}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages || isLoading}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
