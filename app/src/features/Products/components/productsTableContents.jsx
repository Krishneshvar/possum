import { Badge } from "@/components/ui/badge";
import { productStatusBadges } from "../data/productsBadgeStyles";

const getProductStatus = (status) => {
  const statusConfig = productStatusBadges[status];
  if (!statusConfig) return null;

  return (
    <Badge variant="secondary" className={`${statusConfig.className} font-medium`}>
      {statusConfig.text}
    </Badge>
  );
};

export const allColumns = [
  {
    key: "product",
    label: "Product",
    renderCell: (product) => (
      <p className="font-semibold leading-none text-foreground">{product.name}</p>
    ),
  },
  {
    key: "category",
    label: "Category",
    renderCell: (product) => (
      <p className="text-sm text-muted-foreground">{product.category_name}</p>
    ),
  },
  {
    key: "status",
    label: "Status",
    renderCell: (product) => getProductStatus(product.status),
  },
  {
    key: "stock",
    label: "Stock",
    renderCell: (product) => {
      const stock = product.stock ?? 0;
      const alertCap = product.stock_alert_cap ?? 10;
      let badgeStyle = "bg-success/10 text-success border-success/20";
      let statusText = "In Stock";

      if (stock === 0) {
        badgeStyle = "bg-destructive/10 text-destructive border-destructive/20";
        statusText = "Out of Stock";
      } else if (stock <= alertCap) {
        badgeStyle = "bg-warning/10 text-warning border-warning/20";
        statusText = "Low Stock";
      }

      return (
        <div className="flex flex-col gap-1">
          <p className="font-semibold text-foreground">{stock} units</p>
          <Badge variant="outline" className={`${badgeStyle} text-[10px] px-1 py-0 h-4 w-fit font-medium`}>
            {statusText}
          </Badge>
        </div>
      );
    },
  },
];
