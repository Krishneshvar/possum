import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Helper for status badges
const getProductStatus = (status: string) => {
  const styles: Record<string, string> = {
    active: "bg-green-100 text-green-700 hover:bg-green-200 border-green-200",
    inactive: "bg-yellow-100 text-yellow-700 hover:bg-yellow-200 border-yellow-200",
    discontinued: "bg-red-100 text-red-700 hover:bg-red-200 border-red-200",
    draft: "bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200",
  };

  const label = status.charAt(0).toUpperCase() + status.slice(1);
  const className = styles[status.toLowerCase()] || "bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-200";

  return (
    <Badge variant="outline" className={cn("capitalize font-medium border px-2 py-0.5 shadow-sm", className)}>
      {label}
    </Badge>
  );
};

export const allColumns = [
  {
    key: "product",
    label: "Product Name",
    renderCell: (product: any) => (
      <div className="flex flex-col">
        <span className="font-semibold text-foreground truncate max-w-[200px] lg:max-w-[300px]" title={product.name}>
          {product.name}
        </span>
        {product.sku && (
          <span className="text-xs text-muted-foreground font-mono mt-0.5">
            SKU: {product.sku}
          </span>
        )}
      </div>
    ),
  },
  {
    key: "category",
    label: "Category",
    renderCell: (product: any) => (
      <div className="flex items-center">
        <Badge variant="secondary" className="font-normal text-muted-foreground bg-muted hover:bg-muted/80">
          {product.category_name || "Uncategorized"}
        </Badge>
      </div>
    ),
  },
  {
    key: "status",
    label: "Status",
    renderCell: (product: any) => getProductStatus(product.status),
  },
  {
    key: "stock",
    label: "Inventory",
    renderCell: (product: any) => {
      const stock = product.stock ?? 0;
      const alertCap = product.stock_alert_cap ?? 10;

      let statusColor = "text-green-600 bg-green-50 border-green-200";
      let statusText = "In Stock";
      let dotColor = "bg-green-500";

      if (stock === 0) {
        statusColor = "text-red-600 bg-red-50 border-red-200";
        statusText = "Out of Stock";
        dotColor = "bg-red-500";
      } else if (stock <= alertCap) {
        statusColor = "text-amber-600 bg-amber-50 border-amber-200";
        statusText = "Low Stock";
        dotColor = "bg-amber-500";
      }

      return (
        <div className="flex flex-col gap-1.5 min-w-[100px]">
          <div className="flex items-baseline gap-1">
            <span className={cn("text-sm font-semibold", stock === 0 ? "text-muted-foreground" : "text-foreground")}>
              {stock}
            </span>
            <span className="text-xs text-muted-foreground">units</span>
          </div>

          <div className={cn("flex items-center gap-1.5 px-2 py-0.5 rounded-full border w-fit", statusColor)}>
            <div className={cn("h-1.5 w-1.5 rounded-full animate-pulse", dotColor)} />
            <span className="text-[10px] font-medium leading-none uppercase tracking-wide">
              {statusText}
            </span>
          </div>
        </div>
      );
    },
  },
];
