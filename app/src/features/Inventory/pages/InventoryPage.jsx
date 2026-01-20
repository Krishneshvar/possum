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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  useGetExpiringLotsQuery
} from '@/services/inventoryApi';
import { useGetVariantsQuery, useGetInventoryStatsQuery } from '@/services/productsApi';
import { useGetCategoriesQuery } from '@/services/categoriesApi';
import StockAdjustmentCell from '../components/StockAdjustmentCell';
import {
  AlertTriangle,
  Plus,
  Search,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  PackageX,
  Container,
  Filter
} from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function InventoryPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryId, setCategoryId] = useState('all');
  const [stockStatus, setStockStatus] = useState('all');
  const [isAdjustOpen, setIsAdjustOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [sortBy, setSortBy] = useState('p.name');
  const [sortOrder, setSortOrder] = useState('ASC');

  // Fetch data
  const { data: stats, isLoading: statsLoading } = useGetInventoryStatsQuery();
  const { data: expiring = [], isLoading: expiringLoading } = useGetExpiringLotsQuery(30);
  const { data: categories = [] } = useGetCategoriesQuery();
  const { data: variantsData, isLoading: variantsLoading, error: variantsError } = useGetVariantsQuery({
    page,
    limit,
    searchTerm,
    categoryId: categoryId === 'all' ? undefined : categoryId,
    stockStatus: stockStatus === 'all' ? undefined : stockStatus,
    sortBy,
    sortOrder
  });

  const variants = variantsData?.variants || [];
  const totalCount = variantsData?.totalCount || 0;
  const totalPages = variantsData?.totalPages || 0;

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setSortBy(column);
      setSortOrder('ASC');
    }
  };

  const getSortIcon = (column) => {
    if (sortBy !== column) return <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />;
    return sortOrder === 'ASC' ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />;
  };

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
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-blue-500 shadow-sm overflow-hidden bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
              Items in Stock
              <Container className="h-4 w-4 text-blue-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalItemsInStock ?? 0}</div>
          </CardContent>
        </Card>

        <Card
          className="border-l-4 border-l-red-500 shadow-sm overflow-hidden bg-card/50 backdrop-blur-sm cursor-pointer hover:bg-card/70 transition-colors"
          onClick={() => {
            setStockStatus('low');
            setPage(1);
          }}
        >
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
              Low Stock
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.productsWithLowStock ?? 0}</div>
          </CardContent>
        </Card>

        <Card
          className="border-l-4 border-l-slate-500 shadow-sm overflow-hidden bg-card/50 backdrop-blur-sm cursor-pointer hover:bg-card/70 transition-colors"
          onClick={() => {
            setStockStatus('out');
            setPage(1);
          }}
        >
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
              Out of Stock
              <PackageX className="h-4 w-4 text-slate-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.productsWithNoStock ?? 0}</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500 shadow-sm overflow-hidden bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
              Expiring Soon
              <Calendar className="h-4 w-4 text-orange-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{expiring.length}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm bg-card/40 backdrop-blur-sm overflow-hidden">
        <CardHeader className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0 pb-6">
          <CardTitle className="text-xl font-semibold">Stock Levels</CardTitle>
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Filter by SKU or name..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                className="pl-9 h-9 bg-background/50 border-border/50 focus-visible:ring-primary/20"
              />
            </div>

            <Select value={categoryId} onValueChange={(val) => { setCategoryId(val); setPage(1); }}>
              <SelectTrigger className="w-[160px] h-9 bg-background/50 border-border/50">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id.toString()}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={stockStatus} onValueChange={(val) => { setStockStatus(val); setPage(1); }}>
              <SelectTrigger className="w-[160px] h-9 bg-background/50 border-border/50">
                <SelectValue placeholder="Stock Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="ok">In Stock</SelectItem>
                <SelectItem value="low">Low Stock</SelectItem>
                <SelectItem value="out">Out of Stock</SelectItem>
              </SelectContent>
            </Select>

            {(searchTerm || categoryId !== 'all' || stockStatus !== 'all') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchTerm('');
                  setCategoryId('all');
                  setStockStatus('all');
                  setPage(1);
                }}
                className="h-9 px-2 text-muted-foreground hover:text-foreground"
              >
                Clear
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="rounded-none border-t border-border/50">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="py-4 px-6 cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => handleSort('p.name')}>
                    <div className="flex items-center">
                      Product | Variant {getSortIcon('p.name')}
                    </div>
                  </TableHead>
                  <TableHead className="py-4">Category</TableHead>
                  <TableHead
                    className="py-4 text-right cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => handleSort('stock')}
                  >
                    <div className="flex items-center justify-end">
                      Current Stock {getSortIcon('stock')}
                    </div>
                  </TableHead>
                  <TableHead className="py-4 text-right">Threshold</TableHead>
                  <TableHead className="py-4 text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {variantsLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center h-32 text-muted-foreground">
                      <div className="flex items-center justify-center gap-2">
                        <Plus className="h-4 w-4 animate-spin" /> Loading stock data...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : variantsError ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center h-32 text-destructive">
                      Failed to load inventory data. Please check your connection or try again.
                    </TableCell>
                  </TableRow>
                ) : variants.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center h-32 text-muted-foreground">
                      No matching products found.
                    </TableCell>
                  </TableRow>
                ) : (
                  variants.map((v) => {
                    const stock = v.stock ?? 0;
                    const threshold = v.stock_alert_cap ?? 10;
                    const isLow = stock <= threshold && stock > 0;
                    const isOut = stock <= 0;

                    return (
                      <TableRow key={v.id} className="hover:bg-muted/10 transition-colors group">
                        <TableCell className="py-4 px-6">
                          <div className="flex flex-col">
                            <span className="font-semibold text-foreground group-hover:text-primary transition-colors">
                              {v.product_name} | {v.name || 'Default'}
                            </span>
                            <span className="text-xs text-muted-foreground mt-0.5">{v.sku}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-normal bg-background/50">{v.category_name || 'Uncategorized'}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-bold text-lg">
                          <StockAdjustmentCell
                            variantId={v.id}
                            originalStock={stock}
                            productName={v.product_name}
                            variantName={v.name}
                          />
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground font-mono italic">
                          {threshold}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            className={
                              isOut ? 'bg-red-500 hover:bg-red-600 text-white' :
                                isLow ? 'bg-orange-500 hover:bg-orange-600 text-white' :
                                  'bg-green-600 hover:bg-green-700 text-white'
                            }
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

          {/* Pagination */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-border/50">
            <div className="text-sm text-muted-foreground">
              Showing <span className="font-medium">{totalCount === 0 ? 0 : (page - 1) * limit + 1}</span> to <span className="font-medium">{Math.min(page * limit, totalCount)}</span> of <span className="font-medium">{totalCount}</span> results
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center justify-center min-w-[32px] text-sm font-medium">
                {page} / {totalPages || 1}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages || totalPages === 0}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
