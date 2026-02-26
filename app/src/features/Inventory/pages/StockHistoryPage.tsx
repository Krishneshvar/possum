import { useState } from 'react';
import { History } from 'lucide-react';
import { Button } from '@/components/ui/button';

import { useGetStockHistoryQuery } from '@/services/inventoryApi';
import GenericPageHeader from '@/components/common/GenericPageHeader';
import DataTable from '@/components/common/DataTable';
import { allColumns } from '../components/stockHistoryTableContents';

// Using a simplified local slice state approach since this is a new page,
// or we can use local state for simplicity if Redux slice isn't set up yet.
const ITEMS_PER_PAGE = 25;

export default function StockHistoryPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [sort, setSort] = useState({
        sortBy: 'adjusted_at',
        sortOrder: 'DESC',
    });
    const [filters, setFilters] = useState<any>({});

    const handleSearchChange = (value: string) => {
        setSearchTerm(value);
        setCurrentPage(1);
        clearTimeout((window as any).__stockSearchTimer);
        (window as any).__stockSearchTimer = setTimeout(() => setDebouncedSearch(value), 400);
    };

    const offset = (currentPage - 1) * ITEMS_PER_PAGE;

    const { data, isLoading, isFetching, error, refetch } = useGetStockHistoryQuery({
        limit: ITEMS_PER_PAGE,
        offset,
        search: debouncedSearch || undefined,
        reason: filters.reason || undefined,
        sortBy: sort.sortBy,
        sortOrder: sort.sortOrder,
    });

    const adjustments = data?.adjustments ?? [];
    const total = data?.total ?? 0;
    const totalPages = Math.max(1, Math.ceil(total / ITEMS_PER_PAGE));
    const isDataLoading = isLoading || isFetching;

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const handleSort = (column: any) => {
        const order = sort.sortBy === column.sortField && sort.sortOrder === 'ASC' ? 'DESC' : 'ASC';
        setSort({ sortBy: column.sortField, sortOrder: order });
    };

    const emptyState = (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center space-y-4 max-w-md mx-auto">
            <div className="bg-primary/10 p-6 rounded-full">
                <History className="h-12 w-12 text-primary" />
            </div>
            <div className="space-y-2">
                <h3 className="text-lg font-semibold text-foreground">No adjustments found</h3>
                <p className="text-sm text-muted-foreground">
                    {debouncedSearch || Object.keys(filters).length
                        ? "We couldn't find any adjustments matching your active filters."
                        : "Stock adjustments will appear here once recorded via inventory changes, sales, or purchases."}
                </p>
            </div>
            <div className="flex gap-2">
                {(debouncedSearch || Object.keys(filters).length > 0) && (
                    <Button variant="outline" onClick={() => {
                        handleSearchChange('');
                        setFilters({});
                    }}>
                        Clear Filters
                    </Button>
                )}
            </div>
        </div>
    );

    const reasonFilterConfig = {
        key: "reason",
        label: "Reason",
        options: [
            { label: 'Sale', value: 'sale' },
            { label: 'Return', value: 'return' },
            { label: 'Purchase', value: 'confirm_receive' },
            { label: 'Spoilage', value: 'spoilage' },
            { label: 'Damage', value: 'damage' },
            { label: 'Theft', value: 'theft' },
            { label: 'Correction', value: 'correction' },
        ]
    };

    return (
        <div className="space-y-4 sm:space-y-6 p-2 sm:p-4 lg:p-2 mb-6 w-full max-w-7xl mx-auto">
            <GenericPageHeader
                showBackButton
                headerIcon={<History className="h-5 w-5 text-primary" />}
                headerLabel="Stock History"
            />

            <DataTable
                data={adjustments}
                columns={allColumns}
                isLoading={isDataLoading}
                error={error ? 'Failed to fetch stock history' : undefined}
                onRefresh={refetch}
                isRefreshing={isFetching}

                searchTerm={searchTerm}
                onSearchChange={handleSearchChange}
                searchPlaceholder="Search product, variant, SKU..."

                sortBy={sort.sortBy}
                sortOrder={sort.sortOrder}
                onSort={handleSort}

                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}

                filtersConfig={[reasonFilterConfig]}
                activeFilters={filters}
                onFilterChange={(payload) => {
                    setFilters((prev: any) => ({ ...prev, [payload.key]: payload.value }));
                    setCurrentPage(1);
                }}
                onClearAllFilters={() => {
                    setFilters({});
                    setSearchTerm('');
                    setCurrentPage(1);
                }}

                emptyState={emptyState}
                avatarIcon={<History className="h-4 w-4 text-primary" />}
                className="border-none shadow-none bg-transparent sm:bg-card sm:border sm:shadow-sm"
            />
        </div>
    );
}
