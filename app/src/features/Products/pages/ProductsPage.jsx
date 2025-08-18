import { Loader2, AlertCircle, Package, RefreshCw } from "lucide-react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"

import ProductsTable from "../components/ProductsTable"
import { useGetProductsQuery } from "@/services/productsApi"
import GenericPageHeader from "@/components/common/GenericPageHeader"

export default function ProductsPage() {
  const { isLoading, isFetching, error, refetch } = useGetProductsQuery()

  const handleRetry = () => {
    refetch()
  }

  const isDataLoading = isLoading || isFetching

  return (
    <div className="container mx-auto space-y-4 p-4 sm:space-y-6 sm:p-6 max-w-7xl">
      <GenericPageHeader
        headerIcon={<Package className="h-5 w-5 text-primary" />}
        headerLabel={"Products"}
        headerDescription={"Manage your inventory and product catalog"}
        actionLabel={"Add Product"}
        actionUrl={"/products/add"}
      />

      {isDataLoading ? (
        <div className="flex items-center justify-center py-8 sm:py-12">
          <div className="flex items-center gap-2 text-center">
            <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
            <span className="text-xs sm:text-sm text-muted-foreground">Loading products...</span>
          </div>
        </div>
      ) : error ? (
        <Alert variant="destructive" className="mx-auto max-w-2xl">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <span className="text-sm">Failed to load products. Please try again.</span>
            <Button variant="outline" size="sm" onClick={handleRetry} className="w-full sm:w-auto bg-transparent">
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      ) : (
        <ProductsTable onProductDeleted={refetch} />
      )}
    </div>
  )
}
