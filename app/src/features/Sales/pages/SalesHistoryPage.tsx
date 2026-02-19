import { useState, useMemo } from 'react';
import { useGetSalesQuery } from '@/services/salesApi';
import { History, Download, Printer, CheckCircle2, Clock, XCircle, RotateCcw } from "lucide-react";
import SalesHistoryTable from '../components/SalesHistoryTable';
import GenericPageHeader from '@/components/common/GenericPageHeader';
import { StatCards } from '@/components/common/StatCards';
import { KeyboardShortcut } from '@/components/common/KeyboardShortcut';

const billHistoryActions = {
    secondary: [
        {
            label: "Export",
            icon: Download,
            onClick: () => console.log('Export bills'),
        },
        {
            label: "Print Report",
            icon: Printer,
            onClick: () => console.log('Print report'),
        },
    ],
};

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

    const statsData = useMemo(() => {
        const completed = sales.filter(s => s.status === 'completed').length;
        const pending = sales.filter(s => s.status === 'pending').length;
        const cancelled = sales.filter(s => s.status === 'cancelled').length;
        const refunded = sales.filter(s => s.status === 'refunded').length;

        return [
            { title: 'Total Bills', icon: History, color: 'text-blue-500', todayValue: sales.length },
            { title: 'Completed', icon: CheckCircle2, color: 'text-green-500', todayValue: completed },
            { title: 'Pending', icon: Clock, color: 'text-yellow-500', todayValue: pending },
            { title: 'Cancelled/Refunded', icon: XCircle, color: 'text-red-500', todayValue: cancelled + refunded },
        ];
    }, [sales]);

    return (
        <div className="space-y-4 sm:space-y-6 p-2 sm:p-4 lg:p-2 mb-6 w-full max-w-7xl overflow-hidden mx-auto">
            <div className="w-full">
                <GenericPageHeader
                    headerIcon={<History className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />}
                    headerLabel="Bill History"
                    actions={billHistoryActions}
                />
                <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                    <span>Quick search:</span>
                    <KeyboardShortcut keys={["Ctrl", "F"]} />
                </div>
            </div>

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
