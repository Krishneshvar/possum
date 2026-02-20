import { useState, useMemo } from 'react';
import { useGetSalesQuery } from '@/services/salesApi';
import { History, CheckCircle2, Clock, XCircle } from "lucide-react";
import SalesHistoryTable from '../components/SalesHistoryTable';
import GenericPageHeader from '@/components/common/GenericPageHeader';
import { StatCards } from '@/components/common/StatCards';
import { useSaleStats } from '../hooks/useSaleStats';

export default function SalesHistoryPage() {
    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [searchTerm, setSearchTerm] = useState('');

    const { data, isLoading } = useGetSalesQuery({
        page,
        limit,
        searchTerm
    });

    const sales = data?.sales || [];
    const totalPages = data?.totalPages || 1;

    const stats = useSaleStats(sales, data?.totalRecords);

    const statsData = useMemo(() => [
        { title: 'Total Bills', icon: History, color: 'text-blue-500', todayValue: stats.totalBills },
        { title: 'Completed', icon: CheckCircle2, color: 'text-green-500', todayValue: stats.completed },
        { title: 'Pending', icon: Clock, color: 'text-yellow-500', todayValue: stats.pending },
        { title: 'Cancelled/Refunded', icon: XCircle, color: 'text-red-500', todayValue: stats.cancelledOrRefunded },
    ], [stats]);

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
                onSearchChange={setSearchTerm}
            />
        </div>
    );
}
