import { Badge } from "@/components/ui/badge"
import { AlertTriangle, CheckCircle, XCircle } from "lucide-react"

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
]
