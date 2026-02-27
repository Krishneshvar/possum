import { useState, useMemo, useCallback } from 'react';
import { useGetSalesQuery } from '@/services/salesApi';
import { History, CheckCircle2, Clock, XCircle } from "lucide-react";
import SalesHistoryTable from '../components/SalesHistoryTable';
import GenericPageHeader from '@/components/common/GenericPageHeader';
import { StatCards } from '@/components/common/StatCards';
import { useSaleStats } from '../hooks/useSaleStats';
import type { Column } from '@/components/common/DataTable';
import DateRangeFilter from '@/components/common/DateRangeFilter';

type SortableField = 'sale_date' | 'total_amount' | 'customer_name';
type SortOrder = 'ASC' | 'DESC';

type ActiveFilters = {
    status: string[];
};

export default function SalesHistoryPage() {
    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [searchTerm, setSearchTerm] = useState('');
    const [sort, setSort] = useState<{ sortBy: SortableField; sortOrder: SortOrder }>({
        sortBy: 'sale_date',
        sortOrder: 'DESC',
    });
    const [activeFilters, setActiveFilters] = useState<ActiveFilters>({
        status: [],
    });
    const [dateRange, setDateRange] = useState<{ startDate: string | null; endDate: string | null }>({
        startDate: null,
        endDate: null,
    });

    const { data, isLoading } = useGetSalesQuery({
        page,
        limit,
        searchTerm: searchTerm || undefined,
        sortBy: sort.sortBy,
        sortOrder: sort.sortOrder,
        status: activeFilters.status.length > 0 ? activeFilters.status : undefined,
        startDate: dateRange.startDate || undefined,
        endDate: dateRange.endDate || undefined,
    });

    const sales = data?.sales || [];
    const totalPages = data?.totalPages || 1;

    const stats = useSaleStats(sales, data?.totalRecords);

    const statsData = useMemo(() => [
        { title: 'Total Bills', icon: History, color: 'text-blue-500', todayValue: stats.totalBills },
        { title: 'Paid', icon: CheckCircle2, color: 'text-green-500', todayValue: stats.paid },
        { title: 'Partial / Draft', icon: Clock, color: 'text-yellow-500', todayValue: stats.partialOrDraft },
        { title: 'Cancelled / Refunded', icon: XCircle, color: 'text-red-500', todayValue: stats.cancelledOrRefunded },
    ], [stats]);

    const handleSort = useCallback((column: Column) => {
        if (!column.sortField) return;
        const field = column.sortField as SortableField;
        setSort(prev => ({
            sortBy: field,
            sortOrder: prev.sortBy === field && prev.sortOrder === 'ASC' ? 'DESC' : 'ASC',
        }));
        setPage(1);
    }, []);

    const handleFilterChange = useCallback(({ key, value }: { key: string; value: string[] }) => {
        setActiveFilters(prev => ({
            ...prev,
            [key]: value,
        }));
        setPage(1);
    }, []);

    const handleDateRangeApply = useCallback((startDate: string, endDate: string) => {
        setDateRange({ startDate, endDate });
        setPage(1);
    }, []);

    const handleClearFilters = useCallback(() => {
        setActiveFilters({ status: [] });
        setDateRange({ startDate: null, endDate: null });
        setSearchTerm('');
        setPage(1);
    }, []);

    const handleSearchChange = useCallback((value: string) => {
        setSearchTerm(value);
        setPage(1);
    }, []);

    const isAnyFilterActive = activeFilters.status.length > 0 ||
        dateRange.startDate !== null ||
        dateRange.endDate !== null;

    return (
        <div className="space-y-4 sm:space-y-6 p-2 sm:p-4 lg:p-2 mb-6 w-full max-w-7xl overflow-hidden mx-auto">
            <GenericPageHeader
                headerIcon={<History className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />}
                headerLabel="Bill History"
            />

            <StatCards cardData={statsData} />

            <SalesHistoryTable
                sales={sales}
                currentPage={page}
                itemsPerPage={limit}
                totalPages={totalPages}
                onPageChange={setPage}
                isLoading={isLoading}
                searchTerm={searchTerm}
                onSearchChange={handleSearchChange}
                sortBy={sort.sortBy}
                sortOrder={sort.sortOrder}
                onSort={handleSort}
                activeFilters={activeFilters}
                onFilterChange={handleFilterChange}
                onClearAllFilters={handleClearFilters}
                isAnyFilterActive={isAnyFilterActive}
                customFilters={
                    <DateRangeFilter
                        startDate={dateRange.startDate}
                        endDate={dateRange.endDate}
                        onApply={handleDateRangeApply}
                    />
                }
            />
        </div>
    );
}
