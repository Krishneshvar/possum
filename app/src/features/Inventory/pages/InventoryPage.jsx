import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  useGetLowStockAlertsQuery,
  useGetExpiringLotsQuery
} from '@/services/inventoryApi';
import { useGetProductsQuery } from '@/services/productsApi';
import { InventoryAdjustmentForm } from '../components/InventoryAdjustmentForm';
import {
  AlertTriangle,
  History,
  Plus,
  Search,
  Package,
  ArrowDownCircle,
  ArrowUpCircle,
  Calendar
} from 'lucide-react';
import { Input } from '@/components/ui/input';
// import { format } from 'date-fns';

export default function InventoryPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdjustOpen, setIsAdjustOpen] = useState(false);

  // Fetch data
  const { data: alerts = [], isLoading: alertsLoading } = useGetLowStockAlertsQuery();
  const { data: expiring = [], isLoading: expiringLoading } = useGetExpiringLotsQuery(30);
  const { data: productsData, isLoading: productsLoading } = useGetProductsQuery({ page: 1, limit: 100 });

  const products = productsData?.products || [];

  // Filter products based on search term (name or SKU)
  const filteredProducts = products.flatMap(p =>
    p.variants.map(v => ({
      ...v,
      productName: p.name,
      categoryId: p.category_id,
      categoryName: p.category_name
    }))
  ).filter(v =>
    v.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAdjustSuccess = () => {
    setIsAdjustOpen(false);
  };

  return (
    <div className="p-6 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Inventory Management</h1>
          <p className="text-muted-foreground mt-1">Track stock levels, monitor alerts, and manage inventory lots.</p>
        </div>
        <Dialog open={isAdjustOpen} onOpenChange={setIsAdjustOpen}>
          <DialogTrigger asChild>
            <Button className="shadow-md">
              <Plus className="mr-2 h-4 w-4" /> Adjust Stock
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Inventory Adjustment</DialogTitle>
            </DialogHeader>
            <InventoryAdjustmentForm onSuccess={handleAdjustSuccess} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="border-l-4 border-l-red-500 shadow-sm overflow-hidden bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
              Low Stock Alerts
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{alerts.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Variants below threshold
            </p>
            {alerts.slice(0, 3).map(alert => (
              <div key={alert.id} className="mt-3 text-xs flex justify-between items-center border-t pt-2 border-border/50">
                <span className="truncate max-w-[150px] font-medium">{alert.product_name} ({alert.variant_name})</span>
                <Badge variant="destructive" className="h-5 px-1.5 text-[10px]">{alert.current_stock} units</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500 shadow-sm overflow-hidden bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
              Expiring Soon
              <Calendar className="h-4 w-4 text-orange-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{expiring.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Lots expiring within 30 days
            </p>
            {expiring.slice(0, 3).map(lot => (
              <div key={lot.id} className="mt-3 text-xs flex justify-between items-center border-t pt-2 border-border/50">
                <span className="truncate max-w-[150px] font-medium">{lot.product_name}</span>
                <span className="text-orange-600 font-semibold">{lot.expiry_date ? new Date(lot.expiry_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '-'}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500 shadow-sm overflow-hidden bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
              Quick Stats
              <Package className="h-4 w-4 text-blue-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Total active products
            </p>
            <div className="flex gap-4 mt-3">
              <div className="flex items-center text-xs text-green-600 font-medium">
                <ArrowUpCircle className="h-3 w-3 mr-1" /> Active
              </div>
              <div className="flex items-center text-xs text-blue-600 font-medium">
                <History className="h-3 w-3 mr-1" /> Tracked
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm bg-card/40 backdrop-blur-sm overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6">
          <CardTitle className="text-xl font-semibold">Stock Levels</CardTitle>
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Filter by SKU or name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9 bg-background/50 border-border/50 focus-visible:ring-primary/20"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="rounded-none border-t border-border/50">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="py-4 px-6">Product / Variant</TableHead>
                  <TableHead className="py-4">SKU</TableHead>
                  <TableHead className="py-4">Category</TableHead>
                  <TableHead className="py-4 text-right">Current Stock</TableHead>
                  <TableHead className="py-4 text-right">Threshold</TableHead>
                  <TableHead className="py-4 text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {productsLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center h-32 text-muted-foreground">
                      <div className="flex items-center justify-center gap-2">
                        <Plus className="h-4 w-4 animate-spin" /> Loading stock data...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center h-32 text-muted-foreground">
                      No matching products found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProducts.map((v) => {
                    const stock = v.stock ?? 0;
                    const threshold = v.stock_alert_cap ?? 10;
                    const isLow = stock <= threshold;
                    const isOut = stock === 0;

                    return (
                      <TableRow key={v.id} className="hover:bg-muted/10 transition-colors group">
                        <TableCell className="py-4 px-6">
                          <div className="flex flex-col">
                            <span className="font-semibold text-foreground group-hover:text-primary transition-colors">{v.productName}</span>
                            <span className="text-xs text-muted-foreground">{v.name || 'Default Variant'}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-xs">{v.sku}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-normal bg-background/50">{v.categoryName || 'Uncategorized'}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-bold text-lg">
                          {stock}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground font-mono italic">
                          {threshold}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            className={`
                              ${isOut ? 'bg-red-500 hover:bg-red-600' :
                                isLow ? 'bg-orange-500 hover:bg-orange-600' :
                                  'bg-green-600 hover:bg-green-700'} 
                              text-white border-transparent px-2.5 py-0.5
                            `}
                          >
                            {isOut ? 'Out' : isLow ? 'Low' : 'OK'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
