import { Loader2, AlertCircle, Package, RefreshCw } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

import ProductsTable from "../components/ProductsTable";
import { useGetProductsQuery } from '@/services/productsApi';
import GenericPageHeader from "@/components/common/GenericPageHeader";

export default function ProductsPage() {
  const { isLoading, isFetching, error, refetch } = useGetProductsQuery();

  const handleRetry = () => {
    refetch();
  };

  const isDataLoading = isLoading || isFetching;

  return (
    <div className="container mx-auto space-y-6 p-6">
      <GenericPageHeader
        headerIcon={<Package className="h-5 w-5 text-primary" />}
        headerLabel={"Products"}
        headerDescription={"Manage your inventory and product catalog"}
        actionLabel={"Add Product"}
        actionUrl={"/products/add"}
      />

      {isDataLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm text-muted-foreground">Loading products...</span>
          </div>
        </div>
      ) : error ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>Failed to load products. Please try again.</span>
            <Button variant="outline" size="sm" onClick={handleRetry}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      ) : (
        <ProductsTable onProductDeleted={refetch} />
      )}
    </div>
  );
}
