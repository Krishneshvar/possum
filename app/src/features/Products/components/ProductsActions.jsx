import { Plus, Package } from "lucide-react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";

export default function ProductsActions() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Package className="h-4 w-4 text-primary" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">Products</h1>
          </div>
          <p className="text-sm text-muted-foreground">Manage your inventory and product catalog</p>
        </div>
        <Button asChild size="sm" className="shrink-0">
          <Link to="/products/add">
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Link>
        </Button>
      </div>
    </div>
  );
}
