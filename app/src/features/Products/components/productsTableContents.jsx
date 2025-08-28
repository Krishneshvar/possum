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
];
