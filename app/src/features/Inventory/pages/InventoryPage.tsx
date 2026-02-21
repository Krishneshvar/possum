import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import {
  useGetExpiringLotsQuery,
  useGetInventoryStatsQuery,
} from '@/services/inventoryApi';
import { useGetVariantsQuery } from '@/services/productsApi';
import { useGetCategoriesQuery } from '@/services/categoriesApi';
import { flattenCategories } from '@/utils/categories.utils';
import StockAdjustmentCell from '../components/StockAdjustmentCell';
import {
  AlertTriangle,
  Calendar,
  PackageX,
  Container,
  Package
} from 'lucide-react';
import DataTable from '@/components/common/DataTable';
import GenericPageHeader from '@/components/common/GenericPageHeader';
import { KeyboardShortcut } from '@/components/common/KeyboardShortcut';
import { StatCards } from '@/components/common/StatCards';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export default function InventoryPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState<{ category: string[], stockStatus: string[] }>({
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
  const { data: stats } = useGetInventoryStatsQuery(undefined);
  const { data: expiring = [] } = useGetExpiringLotsQuery(30);
  const { data: categories = [] } = useGetCategoriesQuery(undefined);

  const categoryId = activeFilters.category.length > 0 ? Number(activeFilters.category[0]) : undefined;
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
  const totalPages = variantsData?.totalPages || 0;

  const handleSort = (column: any) => {
    const order = sort.sortBy === column.sortField && sort.sortOrder === 'ASC' ? 'DESC' : 'ASC';
    setSort({ sortBy: column.sortField, sortOrder: order });
  };

  const handleFilterChange = ({ key, value }: { key: string, value: string[] }) => {
    setActiveFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const handleClearFilters = () => {
    setActiveFilters({ category: [], stockStatus: [] });
    setSearchTerm('');
    setPage(1);
  };

  // Keyboard shortcut: Ctrl/Cmd + I to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
        e.preventDefault();
        const searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement;
        searchInput?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const filtersConfig = [
    {
      key: 'category',
      label: 'Category',
      placeholder: 'Filter by Category',
      options: flattenCategories(categories).map((cat: any) => ({
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
      renderCell: (v: any) => (
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
      sortable: true,
      sortField: 'c.name',
      renderCell: (v: any) => (
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
      renderCell: (v: any) => {
        const stock = v.stock ?? 0;
        return (
          <div className="text-right">
            <StockAdjustmentCell
              variantId={v.id}
              originalStock={stock}
              productName={v.product_name}
              variantName={v.name}
              sku={v.sku}
              threshold={v.stock_alert_cap ?? 10}
            />
          </div>
        );
      }
    },
    {
      key: 'threshold',
      label: 'Alert Threshold',
      sortable: true,
      sortField: 'v.stock_alert_cap',
      className: 'text-right',
      renderCell: (v: any) => (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="text-muted-foreground font-mono italic cursor-help">
              {v.stock_alert_cap ?? 10}
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p>Low stock alert triggers at this level</p>
          </TooltipContent>
        </Tooltip>
      )
    },
    {
      key: 'status',
      label: 'Status',
      sortable: false,
      className: 'text-center',
      renderCell: (v: any) => {
        const stock = v.stock ?? 0;
        const threshold = v.stock_alert_cap ?? 10;
        const isLow = stock <= threshold && stock > 0;
        const isOut = stock <= 0;

        const statusConfig = isOut
          ? { label: 'Out', variant: 'destructive' as const, className: 'bg-red-500 hover:bg-red-600 text-white' }
          : isLow
            ? { label: 'Low', variant: 'default' as const, className: 'bg-orange-500 hover:bg-orange-600 text-white' }
            : { label: 'OK', variant: 'default' as const, className: 'bg-green-600 hover:bg-green-700 text-white' };

        return (
          <div className="flex justify-center">
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge
                  variant={statusConfig.variant}
                  className={`${statusConfig.className} px-2 py-0.5 text-[10px] font-bold cursor-help`}
                >
                  {statusConfig.label}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  {isOut
                    ? 'No stock available'
                    : isLow
                      ? `Stock is below threshold (${threshold})`
                      : 'Stock level is healthy'}
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
        );
      }
    },
  ];

  const emptyState = (
    <div className="text-center p-12 space-y-3">
      <div className="flex justify-center">
        <div className="rounded-full bg-muted p-4">
          <Package className="h-8 w-8 text-muted-foreground" />
        </div>
      </div>
      <div className="space-y-1">
        <p className="font-medium text-foreground">No inventory items found</p>
        <p className="text-sm text-muted-foreground">
          {searchTerm || activeFilters.category.length > 0 || activeFilters.stockStatus.length > 0
            ? 'Try adjusting your search or filters'
            : 'Add products with variants to start tracking inventory'}
        </p>
      </div>
    </div>
  );

  const statsData = [
    {
      title: 'Items in Stock',
      icon: Container,
      color: 'text-blue-500',
      todayValue: stats?.totalItemsInStock ?? 0,
    },
    {
      title: 'Low Stock',
      icon: AlertTriangle,
      color: 'text-red-500',
      todayValue: stats?.productsWithLowStock ?? 0,
    },
    {
      title: 'Out of Stock',
      icon: PackageX,
      color: 'text-slate-500',
      todayValue: stats?.productsWithNoStock ?? 0,
    },
    {
      title: 'Expiring Soon',
      icon: Calendar,
      color: 'text-orange-500',
      todayValue: expiring.length,
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-6 p-2 sm:p-4 lg:p-2 mb-6 w-full max-w-7xl overflow-hidden mx-auto">
      <div className="w-full">
        <GenericPageHeader
          headerIcon={<Package className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />}
          headerLabel="Inventory Management"
        />
        <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
          <span>Quick search:</span>
          <KeyboardShortcut keys={["Ctrl", "I"]} />
        </div>
      </div>

      <StatCards cardData={statsData} />

      <DataTable
        data={variants}
        columns={columns}
        isLoading={variantsLoading}
        error={variantsError ? (variantsError as any).message || 'Error' : null}
        onRetry={refetch}

        searchTerm={searchTerm}
        onSearchChange={(value) => {
          setSearchTerm(value);
          setPage(1);
        }}
        searchPlaceholder="Search by product name, variant, or SKU..."

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
