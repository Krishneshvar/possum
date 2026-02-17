import { useState } from 'react';
import { ShoppingCart } from 'lucide-react';
import GenericPageHeader from '@/components/common/GenericPageHeader';
import DataTable from '@/components/common/DataTable';
import { useGetSalesQuery } from '@/services/salesApi';
import { allColumns, renderOrderActions } from '../components/OrdersTable';

export default function OrdersPage() {
    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [searchTerm, setSearchTerm] = useState('');
    const [sort, setSort] = useState({ sortBy: 'sale_date', sortOrder: 'DESC' });

    const { data, isLoading, refetch } = useGetSalesQuery({
        page,
        limit,
        searchTerm,
        sortBy: sort.sortBy,
        sortOrder: sort.sortOrder,
    });

    const orders = data?.sales || [];
    const totalPages = data?.totalPages || 1;

    const handleSort = (column: any) => {
        const order = sort.sortBy === column.sortField && sort.sortOrder === 'ASC' ? 'DESC' : 'ASC';
        setSort({ sortBy: column.sortField, sortOrder: order });
    };

    return (
        <div className="flex flex-col gap-6">
            <GenericPageHeader
                headerIcon={<ShoppingCart className="h-6 w-6 text-primary" />}
                headerLabel="Orders"
            />

            <DataTable
                data={orders}
                // @ts-ignore
                columns={allColumns}
                isLoading={isLoading}
                onRetry={refetch}
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                searchPlaceholder="Search invoices or customers..."
                sortBy={sort.sortBy}
                sortOrder={sort.sortOrder}
                onSort={handleSort}
                renderActions={renderOrderActions}
                emptyState={
                    <div className="text-center p-8 text-muted-foreground">
                        No orders found.
                    </div>
                }
            />
        </div>
    );
}
