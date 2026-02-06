import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGetReturnsQuery } from '@/services/returnsApi';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileDown, RotateCcw } from 'lucide-react';
import DataTable from '@/components/common/DataTable';
import CurrencyText from '@/components/common/CurrencyText';

export default function ReturnsPage() {
    const navigate = useNavigate();
    const [page, setPage] = useState(1);
    const [limit] = useState(20);
    const [searchTerm, setSearchTerm] = useState('');

    const { data, isLoading, isError, refetch } = useGetReturnsQuery({
        page,
        limit,
    });

    const returns = data?.returns || [];
    const totalPages = data?.totalPages || 1;
    const totalCount = data?.totalCount || 0;

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const columns = [
        {
            key: 'id',
            label: 'Return ID',
            sortable: false,
            renderCell: (ret) => <span className="font-mono text-xs">#{ret.id}</span>
        },
        {
            key: 'created_at',
            label: 'Date',
            sortable: false,
            renderCell: (ret) => (
                <div className="flex flex-col">
                    <span>{formatDate(ret.created_at).split(',')[0]}</span>
                    <span className="text-xs text-muted-foreground">{formatDate(ret.created_at).split(',')[1]}</span>
                </div>
            )
        },
        {
            key: 'invoice_number',
            label: 'Sale / Invoice',
            sortable: false,
            renderCell: (ret) => (
                <Button
                    variant="link"
                    className="p-0 h-auto font-medium"
                    onClick={() => navigate(`/sales/history/${ret.sale_id}`)}
                >
                    <Badge variant="outline" className="font-mono text-xs">
                        {ret.invoice_number}
                    </Badge>
                </Button>
            )
        },
        {
            key: 'processed_by_name',
            label: 'Processed By',
            sortable: false,
            renderCell: (ret) => (
                <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                        {ret.processed_by_name?.charAt(0) || 'U'}
                    </div>
                    <span className="text-sm">{ret.processed_by_name}</span>
                </div>
            )
        },
        {
            key: 'total_refund',
            label: 'Refund Amount',
            sortable: false,
            className: 'text-right',
            renderCell: (ret) => (
                <div className="text-right font-bold text-destructive">
                    -<CurrencyText value={ret.total_refund} />
                </div>
            )
        },
        {
            key: 'reason',
            label: 'Reason',
            sortable: false,
            renderCell: (ret) => (
                <span className="max-w-[200px] truncate block" title={ret.reason}>
                    {ret.reason || <span className="text-muted-foreground italic">No reason provided</span>}
                </span>
            )
        },
    ];

    const renderActions = (ret) => (
        <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/sales/history/${ret.sale_id}`)}
            className="text-muted-foreground hover:text-primary"
        >
            View Details
        </Button>
    );

    const emptyState = (
        <div className="text-center p-8 text-muted-foreground">
            No returns found.
        </div>
    );

    return (
        <div className="h-[calc(100vh-7rem)] flex flex-col gap-4 p-4 overflow-hidden">
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Returns</h1>
                    <p className="text-sm text-muted-foreground">Manage and view processed returns.</p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-muted-foreground">{totalCount} Returns</span>
                    <Button variant="outline">
                        <FileDown className="mr-2 h-4 w-4" />
                        Export
                    </Button>
                </div>
            </div>

            <DataTable
                data={returns}
                columns={columns}
                isLoading={isLoading}
                error={isError}
                onRetry={refetch}

                searchTerm={searchTerm}
                onSearchChange={(value) => {
                    setSearchTerm(value);
                    setPage(1);
                }}
                searchPlaceholder="Search returns..."

                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}

                emptyState={emptyState}
                renderActions={renderActions}
                avatarIcon={<RotateCcw className="h-4 w-4 text-primary" />}
            />
        </div>
    );
}
