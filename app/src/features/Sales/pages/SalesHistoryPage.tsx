import { useState } from 'react';
import { useGetSalesQuery } from '@/services/salesApi';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
        <Card className="h-full flex flex-col border-border/50 shadow-sm overflow-hidden">
            <CardContent className="p-0 flex flex-col h-full">
                <div className="p-4 border-b bg-muted/20 flex items-center gap-2">
                    <History className="h-5 w-5 text-muted-foreground" />
                    <h2 className="font-semibold text-lg">Sales History</h2>
                </div>
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
    );
}
