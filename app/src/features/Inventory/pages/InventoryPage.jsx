import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  Calendar,
  PackageX,
  Container,
  Package
} from 'lucide-react';
import DataTable from '@/components/common/DataTable';

export default function InventoryPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState({
    category: [],
    stockStatus: [],
  });
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [sort, setSort] = useState({
    sortBy: 'p.name',
    sortOrder: 'ASC',
  });

  // Fetch data
  const { data: stats, isLoading: statsLoading } = useGetInventoryStatsQuery();
  const { data: expiring = [], isLoading: expiringLoading } = useGetExpiringLotsQuery(30);
  const { data: categories = [] } = useGetCategoriesQuery();

  const categoryId = activeFilters.category.length > 0 ? activeFilters.category[0] : undefined;
  const stockStatus = activeFilters.stockStatus.length > 0 ? activeFilters.stockStatus[0] : undefined;

  const { data: variantsData, isLoading: variantsLoading, error: variantsError, refetch } = useGetVariantsQuery({
    page,
    limit,
    searchTerm: searchTerm || undefined,
    categoryId,
    stockStatus,
    sortBy: sort.sortBy,
    sortOrder: sort.sortOrder
  });

  const variants = variantsData?.variants || [];
  const totalCount = variantsData?.totalCount || 0;
  const totalPages = variantsData?.totalPages || 0;

  const handleSort = (field, order) => {
    setSort({ sortBy: field, sortOrder: order });
  };

  const handleFilterChange = (key, value) => {
    setActiveFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const handleClearFilters = () => {
    setActiveFilters({ category: [], stockStatus: [] });
    setSearchTerm('');
    setPage(1);
  };

  const filtersConfig = [
    {
      key: 'category',
      label: 'Category',
      placeholder: 'Filter by Category',
      options: categories.map(cat => ({
        label: cat.name,
        value: cat.id.toString()
      })),
    },
    {
      key: 'stockStatus',
      label: 'Stock Status',
      placeholder: 'Filter by Status',
      options: [
        { label: 'In Stock', value: 'ok' },
        { label: 'Low Stock', value: 'low' },
        { label: 'Out of Stock', value: 'out' },
      ],
    },
  ];

  const columns = [
    {
      key: 'product',
      label: 'Product | Variant',
      sortable: true,
      sortField: 'p.name',
      renderCell: (v) => (
        <div className="flex flex-col">
          <span className="font-semibold text-foreground">
            {v.product_name} | {v.name || 'Default'}
          </span>
          <span className="text-xs text-muted-foreground mt-0.5">{v.sku}</span>
        </div>
      )
    },
    {
      key: 'category',
      label: 'Category',
      sortable: false,
      renderCell: (v) => (
        <Badge variant="outline" className="font-normal bg-background/50">
          {v.category_name || 'Uncategorized'}
        </Badge>
      )
    },
    {
      key: 'stock',
      label: 'Current Stock',
      sortable: true,
      sortField: 'stock',
      className: 'text-right',
      renderCell: (v) => {
        const stock = v.stock ?? 0;
        return (
          <div className="text-right font-bold text-lg">
            <StockAdjustmentCell
              variantId={v.id}
              originalStock={stock}
              productName={v.product_name}
              variantName={v.name}
            />
          </div>
        );
      }
    },
    {
      key: 'threshold',
      label: 'Threshold',
      sortable: false,
      className: 'text-right',
      renderCell: (v) => (
        <span className="text-muted-foreground font-mono italic">
          {v.stock_alert_cap ?? 10}
        </span>
      )
    },
    {
      key: 'status',
      label: 'Status',
      sortable: false,
      className: 'text-center',
      renderCell: (v) => {
        const stock = v.stock ?? 0;
        const threshold = v.stock_alert_cap ?? 10;
        const isLow = stock <= threshold && stock > 0;
        const isOut = stock <= 0;

        return (
          <div className="flex justify-center">
            <Badge
              className={
                isOut ? 'bg-red-500 hover:bg-red-600 text-white px-2 py-0.5 text-[10px] font-bold' :
                  isLow ? 'bg-orange-500 hover:bg-orange-600 text-white px-2 py-0.5 text-[10px] font-bold' :
                    'bg-green-600 hover:bg-green-700 text-white px-2 py-0.5 text-[10px] font-bold'
              }
            >
              {isOut ? 'Out' : isLow ? 'Low' : 'OK'}
            </Badge>
          </div>
        );
      }
    },
  ];

  const emptyState = (
    <div className="text-center p-8 text-muted-foreground">
      No matching products found.
    </div>
  );

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
            setActiveFilters({ ...activeFilters, stockStatus: ['low'] });
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
            setActiveFilters({ ...activeFilters, stockStatus: ['out'] });
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

      <DataTable
        data={variants}
        columns={columns}
        isLoading={variantsLoading}
        error={variantsError}
        onRetry={refetch}

        searchTerm={searchTerm}
        onSearchChange={(value) => {
          setSearchTerm(value);
          setPage(1);
        }}
        searchPlaceholder="Filter by SKU or name..."

        sortBy={sort.sortBy}
        sortOrder={sort.sortOrder}
        onSort={handleSort}

        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}

        filtersConfig={filtersConfig}
        activeFilters={activeFilters}
        onFilterChange={handleFilterChange}
        onClearAllFilters={handleClearFilters}

        emptyState={emptyState}
        avatarIcon={<Package className="h-4 w-4 text-primary" />}
      />
    </div>
  );
}
