import {
  Edit2,
  Trash2,
  Package,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Tag,
  Layers,
} from "lucide-react"
import { useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { useCurrency } from "@/hooks/useCurrency"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"

// @ts-ignore
import DisplayVariants from "../components/DisplayVariants"
import GenericPageHeader from "@/components/common/GenericPageHeader"
import GenericDeleteDialog from "@/components/common/GenericDeleteDialog"
import { useDeleteProductMutation, useGetProductQuery } from "@/services/productsApi"
import { Product, Variant } from "@shared/index";

// Define a type for the Product with extra joined fields if they come from API
interface ProductDetail extends Product {
    category_name?: string;
    taxes?: any[];
}

export default function ProductDetailsPage() {
  const { productId } = useParams<{ productId: string }>()
  const navigate = useNavigate()
  const { data: product, isLoading, isError } = useGetProductQuery(productId)
  const [deleteProduct] = useDeleteProductMutation()
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const currency = useCurrency()

  const handleDeleteClick = () => {
    setIsDeleteDialogOpen(true)
  }

  const handleDialogOpenChange = (open: boolean) => {
    setIsDeleteDialogOpen(open)
  }

  const handleConfirmDelete = async () => {
    if (!product) return
    try {
      await deleteProduct(product.id).unwrap()
      setIsDeleteDialogOpen(false)
      toast.success("Product deleted", {
        description: `${product.name} has been removed from inventory.`,
        duration: 5000,
      })
      navigate("/products")
    } catch (err) {
      toast.error("Failed to delete product", {
        description: "An error occurred. Please try again.",
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
        label: "Delete",
        onClick: () => handleDeleteClick(),
        icon: Trash2,
      }
    ],
  };

  const formatPrice = (price: number | null | undefined) => {
    if (price === null || price === undefined || isNaN(price)) return "N/A"
    return `${currency}${Number.parseFloat(price.toString()).toFixed(2)}`
  }

  const getProductStatus = (status: string | undefined) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      active: { label: "Active", className: "bg-green-100 text-green-700 border-green-200" },
      inactive: { label: "Inactive", className: "bg-yellow-100 text-yellow-700 border-yellow-200" },
      discontinued: { label: "Discontinued", className: "bg-red-100 text-red-700 border-red-200" },
    };

    const normalizedStatus = (status || 'inactive').toLowerCase();
    const config = statusConfig[normalizedStatus] || statusConfig.inactive;
    return (
      <Badge variant="outline" className={config.className}>
        {config.label}
      </Badge>
    );
  }

  const getVariantStockStatus = (variant: Variant) => {
      const stock = variant.stock || 0;
      const cap = variant.stock_alert_cap || 0;
    if (stock <= 0) {
      return { label: "Out of Stock", icon: XCircle, styles: "text-destructive" }
    } else if (stock <= cap) {
      return { label: "Low Stock", icon: AlertTriangle, styles: "text-warning" }
    } else {
      return { label: "In Stock", icon: CheckCircle, styles: "text-success" }
    }
  }

  const calculateTotalStock = () => {
      if (!product || !product.variants) return 0;
    let totalStock = 0;
    for (let i = 0; i < product.variants.length; i++) {
      totalStock += product.variants[i].stock || 0;
    }
    return totalStock;
  }

  if (isLoading) {
    return (
      <div className="space-y-6 p-2 sm:p-4 lg:p-2 mb-6 w-full max-w-7xl mx-auto">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] p-6">
        <Alert variant="destructive" className="max-w-md">
          <AlertTriangle className="h-5 w-5" />
          <AlertTitle>Failed to load product</AlertTitle>
          <AlertDescription className="mt-2 space-y-4">
            <p className="text-sm">Unable to fetch product details. Please try again.</p>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => window.location.reload()}
            >
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] p-6">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
              <Package className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold">Product Not Found</h3>
              <p className="text-muted-foreground text-sm">
                This product doesn't exist or has been removed.
              </p>
            </div>
            <Button onClick={() => navigate("/products")} className="w-full">
              Back to Products
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Type assertion or check for extended properties
  const typedProduct = product as ProductDetail;

  return (
    <div className="space-y-6 p-2 sm:p-4 lg:p-2 mb-6 w-full max-w-7xl mx-auto">
      <GenericPageHeader
        showBackButton
        headerIcon={<Package className="h-5 w-5 text-primary" />}
        headerLabel={typedProduct.name}
        actions={productActions}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Product Information Card */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                Product Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col sm:flex-row gap-6">
                {typedProduct.image_path && (
                  <div className="flex-shrink-0">
                    <img
                      src={typedProduct.image_path}
                      alt={typedProduct.name}
                      className="w-32 h-32 rounded-lg object-cover border"
                    />
                  </div>
                )}
                <div className="flex-1 space-y-4">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">{typedProduct.name}</h2>
                    <p className="text-muted-foreground">
                      {typedProduct.description || "No description provided."}
                    </p>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div className="space-y-1">
                      <p className="text-muted-foreground">Status</p>
                      {getProductStatus(typedProduct.status)}
                    </div>
                    <div className="space-y-1">
                      <p className="text-muted-foreground">Category</p>
                      <Badge variant="secondary" className="font-normal">
                        <Layers className="h-3 w-3 mr-1" />
                        {typedProduct.category_name || "Uncategorized"}
                      </Badge>
                    </div>
                    {/* Assuming taxes is an array if present */}
                    {typedProduct.taxes && typedProduct.taxes.length > 0 && (
                      <div className="space-y-1 sm:col-span-2">
                        <p className="text-muted-foreground">Tax Categories</p>
                        <div className="flex flex-wrap gap-1">
                          {typedProduct.taxes.map((tax: any) => (
                            <Badge key={tax.id} variant="outline" className="text-xs">
                              <Tag className="h-3 w-3 mr-1" />
                              {tax.name} ({tax.rate}%)
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Variants Card */}
          <Card>
            <DisplayVariants
              product={typedProduct}
              getProductStatus={getProductStatus}
              getVariantStockStatus={getVariantStockStatus}
              formatPrice={formatPrice}
            />
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Stats Card */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total Stock</span>
                <span className="text-lg font-semibold">{calculateTotalStock()}</span>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Variants</span>
                <span className="text-lg font-semibold">{typedProduct.variants ? typedProduct.variants.length : 0}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <GenericDeleteDialog
        dialogTitle="Delete Product?"
        itemName={typedProduct.name}
        open={isDeleteDialogOpen}
        onOpenChange={handleDialogOpenChange}
        onConfirm={handleConfirmDelete}
      />
    </div>
  )
}
