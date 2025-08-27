import {
  ArrowLeft,
  Edit2,
  Trash2,
  Package,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Split,
  Hash,
  Plus,
} from "lucide-react"
import { useState } from "react"
import { useParams, useNavigate } from "react-router-dom"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"

import { toast } from "sonner"
import DisplayVariants from "../components/DisplayVariants"
import GenericPageHeader from "@/components/common/GenericPageHeader"
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

  const productActions = {
    primary: {
      label: "Edit Product",
      url: `/products/edit/${productId}`,
      icon: Edit2,
    },
    secondary: [
      {
        label: "Add Variant",
        url: "/products",
        icon: Plus,
      },
      {
        label: "Delete",
        onClick: () => handleDeleteClick(),
        icon: Trash2,
      }
    ],
  };

  const formatPrice = (price) => {
    if (price === null || isNaN(price)) return "N/A"
    return `$${Number.parseFloat(price).toFixed(2)}`
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

  const getVariantStockStatus = (variant) => {
    if (variant.stock <= 0) {
      return { label: "Out of Stock", icon: XCircle, styles: "text-red-600" }
    } else if (variant.stock <= variant.stock_alert_cap) {
      return { label: "Low Stock", icon: AlertTriangle, styles: "text-amber-600" }
    } else {
      return { label: "In Stock", icon: CheckCircle, styles: "text-emerald-600" }
    }
  }

  const calculateTotalStock = () => {
    let totalStock = 0;
    for (let i = 0; i < product.variants.length; i++) {
      totalStock += product.variants[i].stock;
    }
    return totalStock;
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
  
  return (
    <>
    <div className="min-h-screen mb-6 space-y-8">
      <GenericPageHeader
        showBackButton
        headerIcon={""}
        headerLabel={product.name}
        actions={productActions}
      />

      <div className="grid gap-8 grid-cols-1 lg:grid-cols-1 xl:grid-cols-3">
        <Card className="lg:col-span-2 shadow-lg">
          <CardContent className="w-full">
            <div className="flex mb-4 gap-2 items-center text-lg font-medium">
              <Package className="h-5 w-5" /> 
              Product Information
            </div>
            <div className="flex flex-col gap-6 sm:flex-row md:flex-col lg:flex-row">
              <div className="flex justify-center">
                {product.imageUrl && (
                  <img src={product.imageUrl} alt={product.name} className="size-32 rounded-lg object-cover" />
                )}
              </div>
              <div className="flex flex-col flex-1">
                <h2 className="text-2xl font-bold mb-2">
                  {product.name}
                </h2>
                <p className="text-gray-500 mb-4">
                  {product.description || "No description..."}
                </p>
                <div className="flex flex-col gap-2 sm:flex-row sm:justify-between md:gap-2 lg:justify-start lg:gap-6 text-sm">
                  <div className="flex items-center gap-1">
                    <Label className="text-slate-500 font-medium">Status:</Label>
                    {getProductStatus(product.status)}
                  </div>
                  <div className="flex items-center gap-1">
                    <Label className="text-slate-500 font-medium">Category:</Label>
                    <span className="font-medium">{product.category_name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Label className="text-slate-500 font-medium">Tax:</Label>
                    <span className="text-slate-900 font-medium">{product.product_tax}%</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 space-y-6 xl:col-span-1 border-0 shadow-lg">
          <CardContent className="space-y-4">
            <div className="flex gap-2 items-center font-medium">
              <Package /> Product Overview
            </div>
            <div className="flex flex-col gap-2 text-md">
              <div className="flex justify-between">
                <h3 className="text-slate-500">Total Stock:</h3>
                <p>{calculateTotalStock()}</p>
              </div>
              <div className="flex justify-between">
                <h3 className="text-slate-500">Total Variants:</h3>
                <p>{product.variants.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 shadow-lg">
          <DisplayVariants
            product={product}
            getProductStatus={getProductStatus}
            getVariantStockStatus={getVariantStockStatus}
            formatPrice={formatPrice}
          />
        </Card>

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
