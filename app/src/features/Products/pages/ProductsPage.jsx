import { Loader2, AlertCircle, RefreshCw } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

import ProductsTable from "../components/ProductsTable";
import ProductsActions from "../components/ProductsActions";
import { useGetProductsQuery } from '@/services/productsApi';

export default function ProductsPage() {
  const { isLoading, isFetching, error, refetch } = useGetProductsQuery();

  const handleRetry = () => {
    refetch();
  };

  const isDataLoading = isLoading || isFetching;
  
  return (
    <div className="container mx-auto space-y-6 p-6">
      <ProductsActions />

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
