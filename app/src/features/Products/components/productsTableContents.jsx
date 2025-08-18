import { Badge } from "@/components/ui/badge"
import { AlertTriangle, CheckCircle, XCircle } from "lucide-react"

const formatPrice = (price) => {
  if (price === null || isNaN(price)) return "N/A"
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number.parseFloat(price / 100))
}

const getProductStatus = (status) => {
  if (status === "active") {
    return (
      <Badge
        variant="secondary"
        className="text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 font-medium"
      >
        Active
      </Badge>
    )
  } else if (status === "inactive") {
    return (
      <Badge
        variant="secondary"
        className="text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 font-medium"
      >
        Inactive
      </Badge>
    )
  } else {
    return (
      <Badge variant="destructive" className="font-medium">
        Discontinued
      </Badge>
    )
  }
}

const getStockStatus = (stock) => {
  if (stock === 0) {
    return (
      <Badge variant="destructive" className="gap-1.5 font-medium">
        <XCircle className="h-3 w-3" />
        Out of Stock
      </Badge>
    )
  } else if (stock <= 10) {
    return (
      <Badge
        variant="secondary"
        className="gap-1.5 bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 font-medium"
      >
        <AlertTriangle className="h-3 w-3" />
        Low Stock ({stock})
      </Badge>
    )
  } else {
    return (
      <Badge
        variant="secondary"
        className="gap-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 font-medium"
      >
        <CheckCircle className="h-3 w-3" />
        In Stock ({stock})
      </Badge>
    )
  }
}

export const allColumns = [
  {
    key: "product",
    label: "Product",
    renderCell: (product) => (
      <div className="space-y-0.5">
        <p className="font-semibold leading-none text-foreground">{product.name}</p>
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
      <code className="relative rounded-md bg-muted/60 border border-border/40 px-2.5 py-1.5 text-xs font-mono font-medium text-foreground">
        {product.sku}
      </code>
    ),
  },
  {
    key: "category",
    label: "Category",
    renderCell: (product) => (
      <Badge variant="outline" className="font-medium border-border/60 text-muted-foreground hover:text-foreground">
        {product.category_name}
      </Badge>
    ),
  },
  {
    key: "stock",
    label: "Stock Status",
    renderCell: (product) => getStockStatus(product.stock),
  },
  {
    key: "price",
    label: "Price",
    renderCell: (product) => <span className="font-bold text-foreground text-base">{formatPrice(product.price)}</span>,
  },
]
