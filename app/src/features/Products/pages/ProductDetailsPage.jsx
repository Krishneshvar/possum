import {
  ArrowLeft,
  Boxes,
  Edit2,
  Trash2,
  Package,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  BarChart3,
  Tag,
  Hash,
  Plus,
} from "lucide-react"
import { useState } from "react"
import { useParams, useNavigate } from "react-router-dom"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

import { toast } from "sonner"
import GenericDeleteDialog from "@/components/common/GenericDeleteDialog"
import { useDeleteProductMutation, useGetProductQuery } from "@/services/productsApi"

export default function ProductDetailsPage() {
  const { productId } = useParams()
  const navigate = useNavigate()
  const { data: product, isLoading, isError } = useGetProductQuery(productId)
  const [deleteProduct] = useDeleteProductMutation()
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  const handleDeleteClick = () => {
    setIsDeleteDialogOpen(true)
  }

  const handleDialogOpenChange = (open) => {
    setIsDeleteDialogOpen(open)
  }

  const handleConfirmDelete = async () => {
    if (!product) return
    try {
      await deleteProduct(product.id).unwrap()
      setIsDeleteDialogOpen(false)
      toast.success("Product deleted successfully", {
        description: "The product was deleted successfully.",
        duration: 5000,
      })
      navigate("/products")
    } catch (err) {
      toast.error("Error deleting product", {
        description: "An error occurred while deleting product. Please try again later.",
        duration: 5000,
      })
    }
  }

  const formatPriceAndMargin = (price) => {
    if (price === null || isNaN(price)) return "N/A"
    return `$${Number.parseFloat(price / 100).toFixed(2)}`
  }

  const getStockStatus = () => {
    if (product.stock <= 0) {
      return { label: "Out of Stock",  icon: XCircle, styles: "bg-red-100 border-1 border-red-400 text-red-600" }
    } else if (product.stock <= product.stock_alert_cap) {
      return { label: "Low Stock", icon: AlertTriangle, styles: "bg-amber-100 border-1 border-amber-400 text-amber-600" }
    } else {
      return { label: "In Stock", icon: CheckCircle, styles: "bg-green-100 border-1 border-green-400 text-emerald-600" }
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-7xl mx-auto p-6 space-y-8">
          <div className="flex items-center justify-between">
            <div className="h-10 w-40 bg-slate-200 rounded-lg animate-pulse" />
            <div className="flex gap-3">
              <div className="h-10 w-32 bg-slate-200 rounded-lg animate-pulse" />
              <div className="h-10 w-32 bg-slate-200 rounded-lg animate-pulse" />
              <div className="h-10 w-32 bg-slate-200 rounded-lg animate-pulse" />
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              <Card className="border-0 shadow-sm">
                <CardHeader className="space-y-4">
                  <div className="h-8 bg-slate-200 rounded animate-pulse" />
                  <div className="h-4 w-48 bg-slate-200 rounded animate-pulse" />
                </CardHeader>
                <CardContent className="space-y-6">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-24 bg-slate-100 rounded-lg animate-pulse" />
                  ))}
                </CardContent>
              </Card>
            </div>
            <div className="space-y-6">
              <Card className="border-0 shadow-sm">
                <CardContent className="p-6 space-y-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-16 bg-slate-100 rounded-lg animate-pulse" />
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <Alert variant="destructive" className="max-w-md border-0 shadow-lg">
          <AlertTriangle className="h-5 w-5" />
          <AlertTitle className="text-lg">Something went wrong</AlertTitle>
          <AlertDescription className="mt-2 space-y-4">
            <p className="text-sm">Failed to fetch product data.</p>
            <Button
              variant="outline"
              size="sm"
              className="w-full bg-transparent"
              onClick={() => window.location.reload()}
            >
              Try Again
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <Card className="max-w-md border-0 shadow-lg">
          <CardContent className="p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto">
              <Package className="h-8 w-8 text-slate-400" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-slate-900">Product Not Found</h3>
              <p className="text-slate-600">The product you're looking for doesn't exist or has been removed.</p>
            </div>
            <Button onClick={() => navigate("/products")} className="w-full">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Products
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const stockStatus = getStockStatus()
  const StockIcon = stockStatus.icon

  return (
    <>
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
            className="text-slate-600 hover:text-slate-900 hover:bg-slate-100 -ml-2 cursor-pointer"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Products
          </Button>

          <div className="flex items-center gap-3">
            <Button
              onClick={() => navigate(`/products/edit/${product.id}`)}
              className="bg-blue-600 hover:bg-blue-700 shadow-sm cursor-pointer"
            >
              <Edit2 className="mr-2 h-4 w-4" />
              Edit Product
            </Button>
            <Button variant="outline" className="border-slate-200 hover:bg-slate-50 bg-transparent cursor-pointer" onClick={() => {}}>
              <Plus className="mr-2 h-4 w-4" />
              Add Variant
            </Button>
            <Button
              variant="outline"
              className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 bg-transparent cursor-pointer"
              onClick={handleDeleteClick}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-0 shadow-lg">
              <CardHeader className="pb-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-3">
                    <CardTitle className="text-3xl font-bold text-slate-900 leading-tight">{product.name}</CardTitle>
                    <div className="flex items-center gap-6 text-sm text-slate-500">
                      <div className="flex items-center gap-2">
                        <Hash className="h-4 w-4" />
                        <span className="font-medium">ID:</span>
                        <span>{product.id}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Tag className="h-4 w-4" />
                        <span className="font-medium">SKU:</span>
                        <span>{product.sku}</span>
                      </div>
                    </div>
                  </div>
                  <Badge
                    variant={product.status === "active" ? "default" : "secondary"}
                    className="capitalize px-3 py-1 text-sm font-medium"
                  >
                    {product.status}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-8">
                <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                    <Package className="h-5 w-5 text-slate-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">Category</p>
                    <p className="text-lg font-semibold text-slate-900">{product.category_name}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-slate-900 flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Boxes className="h-4 w-4 text-blue-600" />
                    </div>
                    Inventory Information
                  </h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="p-6 bg-white border border-slate-200 rounded-xl shadow-sm">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">Current Stock</p>
                        <Badge className={`text-xs font-medium ${stockStatus.styles}`}>
                          <StockIcon className="mr-1 h-3 w-3" />
                          {stockStatus.label}
                        </Badge>
                      </div>
                      <p className="text-3xl font-bold text-slate-900">
                        {product.stock}
                        <span className="text-lg font-medium text-slate-500 ml-1">units</span>
                      </p>
                    </div>
                    <div className="p-6 bg-white border border-slate-200 rounded-xl shadow-sm">
                      <p className="text-sm font-medium text-slate-500 uppercase tracking-wide mb-3">Low Stock Alert</p>
                      <p className="text-3xl font-bold text-slate-900">
                        {product.stock_alert_cap}
                        <span className="text-lg font-medium text-slate-500 ml-1">units</span>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-slate-900 flex items-center gap-3">
                    <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                      <DollarSign className="h-4 w-4 text-emerald-600" />
                    </div>
                    Pricing Information
                  </h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="p-6 bg-gradient-to-br from-emerald-50 to-emerald-100/50 border border-emerald-200 rounded-xl">
                      <p className="text-sm font-medium text-emerald-700 uppercase tracking-wide mb-3">Selling Price</p>
                      <p className="text-3xl font-bold text-emerald-900">{formatPriceAndMargin(product.price)}</p>
                    </div>
                    <div className="p-6 bg-gradient-to-br from-amber-50 to-amber-100/50 border border-amber-200 rounded-xl">
                      <p className="text-sm font-medium text-amber-700 uppercase tracking-wide mb-3">Cost Price</p>
                      <p className="text-3xl font-bold text-amber-900">{formatPriceAndMargin(product.cost_price)}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-slate-900 flex items-center gap-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <BarChart3 className="h-4 w-4 text-purple-600" />
                  </div>
                  Financial Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-200 rounded-xl">
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="h-4 w-4 text-blue-600" />
                    <p className="text-sm font-medium text-blue-700 uppercase tracking-wide">Profit Margin</p>
                  </div>
                  <p className="text-2xl font-bold text-blue-900">{product.profit_margin/100}%</p>
                </div>

                <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100/50 border border-purple-200 rounded-xl">
                  <div className="flex items-center gap-2 mb-3">
                    <DollarSign className="h-4 w-4 text-purple-600" />
                    <p className="text-sm font-medium text-purple-700 uppercase tracking-wide">Tax Rate</p>
                  </div>
                  <p className="text-2xl font-bold text-purple-900">{product.product_tax}%</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>

    <GenericDeleteDialog
      dialogTitle="Delete Product?"
      itemName={product?.name ?? "this product"}
      open={isDeleteDialogOpen}
      onOpenChange={handleDialogOpenChange}
      onConfirm={handleConfirmDelete}
    />
    </>
  )
}
