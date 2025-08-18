import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, XCircle } from "lucide-react";

const formatPrice = (price) => {
  if (price === null || isNaN(price)) return "N/A";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number.parseFloat(price / 100));
};

const getProductStatus = (status) => {
  if (status === 'active') {
    return (
      <Badge variant="secondary" className="text-emerald-700 bg-emerald-100 hover:bg-emerald-200 border-0">
        Active
      </Badge>
    );
  } else if (status === 'inactive') {
    return (
      <Badge variant="secondary" className="text-amber-700 bg-amber-100 hover:bg-amber-200 border-0">
        Inactive
      </Badge>
    );
  } else {
    return (
      <Badge variant="destructive">
        Discontinued
      </Badge>
    );
  }
};

const getStockStatus = (stock) => {
  if (stock === 0) {
    return (
      <Badge variant="destructive" className="gap-1">
        <XCircle className="h-3 w-3" />
        Out of Stock
      </Badge>
    );
  } else if (stock <= 10) {
    return (
      <Badge
        variant="secondary"
        className="gap-1 bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-950 dark:text-amber-300"
      >
        <AlertTriangle className="h-3 w-3" />
        Low Stock ({stock})
      </Badge>
    );
  } else {
    return (
      <Badge
        variant="secondary"
        className="gap-1 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-950 dark:text-emerald-300"
      >
        <CheckCircle className="h-3 w-3" />
        In Stock ({stock})
      </Badge>
    );
  }
};

export const allColumns = [
  { 
    key: "product", 
    label: "Product",
    renderCell: (product) => (
      <div className="space-y-1">
        <p className="font-medium leading-none">{product.name}</p>
      </div>
    ),
  },
  { 
    key: "status", 
    label: "Status",
    renderCell: (product) => getProductStatus(product.status),
  },
  { 
    key: "sku", 
    label: "SKU",
    renderCell: (product) => (
      <code className="relative rounded bg-muted px-2 py-1 text-sm font-mono">{product.sku}</code>
    ),
  },
  { 
    key: "category", 
    label: "Category",
    renderCell: (product) => <Badge variant="outline" className="font-normal">{product.category_name}</Badge>,
  },
  { 
    key: "stock", 
    label: "Stock Status",
    renderCell: (product) => getStockStatus(product.stock),
  },
  { 
    key: "price", 
    label: "Price",
    renderCell: (product) => (
      <span className="font-semibold">{formatPrice(product.price)}</span>
    ),
  },
];
