import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { productStatusBadges, stockStatusBadges } from "../data/productsBadgeStyles";

const iconMap = {
  AlertTriangle: AlertTriangle,
  CheckCircle: CheckCircle,
  XCircle: XCircle,
};

const getProductStatus = (status) => {
  const statusConfig = productStatusBadges[status];
  if (!statusConfig) return null;

  return (
    <Badge variant="secondary" className={`${statusConfig.className} font-medium`}>
      {statusConfig.text}
    </Badge>
  );
};

const getStockStatus = (stock) => {
  let statusKey = "in-stock";
  if (stock === 0) {
    statusKey = "out-of-stock";
  } else if (stock <= 10) {
    statusKey = "low-stock";
  }
  
  const statusConfig = stockStatusBadges[statusKey];
  if (!statusConfig) return null;

  const IconComponent = iconMap[statusConfig.icon];

  return (
    <Badge variant="secondary" className={`${statusConfig.className} gap-1.5 font-medium`}>
      {IconComponent && <IconComponent className="h-3 w-3" />}
      {statusConfig.text}
      {statusKey !== "out-of-stock" && ` (${stock})`}
    </Badge>
  );
};

export const allColumns = [
  {
    key: "product",
    label: "Product",
    renderCell: (product) => (
      <div className="space-y-0.5">
        <p className="font-semibold leading-none text-foreground">{product.name}</p>
        <p className="text-sm text-muted-foreground">{product.category_name}</p>
      </div>
    ),
  },
  {
    key: "status",
    label: "Status",
    renderCell: (product) => getProductStatus(product.status),
  },
  {
    key: "stock",
    label: "Stock Status",
    renderCell: (product) => getStockStatus(product.stock),
  },
];
