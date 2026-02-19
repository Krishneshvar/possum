import { useState } from 'react';
import { useGetSalesQuery } from '@/services/salesApi';
import { Card, CardContent } from "@/components/ui/card";
import { History } from "lucide-react";
import SalesHistoryTable from '../components/SalesHistoryTable';

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

    return (
        <div className="flex flex-col gap-4 h-full">
            {/* Page Header */}
            <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10">
                    <History className="h-5 w-5 text-primary" />
                </div>
                <div>
                    <h1 className="text-xl font-bold text-foreground">Bill History</h1>
                    <p className="text-sm text-muted-foreground">View and search all past sales transactions</p>
                </div>
            </div>

            {/* History Table */}
            <Card className="flex-1 flex flex-col border-border/50 shadow-sm overflow-hidden">
                <CardContent className="p-0 flex flex-col h-full">
                    <div className="flex-1 overflow-hidden p-4">
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
                </CardContent>
            </Card>
        </div>
    );
}
