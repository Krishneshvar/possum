import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ReturnItem, ReturnRecord, useGetReturnsQuery } from '@/services/returnsApi';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RotateCcw, ChevronDown, ChevronRight, Package } from 'lucide-react';
import DataTable from '@/components/common/DataTable';
import CurrencyText from '@/components/common/CurrencyText';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import DateRangeFilter from '@/components/common/DateRangeFilter';

export default function ReturnsPage() {
    const navigate = useNavigate();
    const [page, setPage] = useState(1);
    const [limit] = useState(20);
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

    const [dateRange, setDateRange] = useState<{ startDate: string | null; endDate: string | null }>({
        startDate: null,
        endDate: null,
    });
    const [sort, setSort] = useState<{ field: 'created_at' | 'total_refund'; order: 'ASC' | 'DESC' }>({
        field: 'created_at',
        order: 'DESC'
    });

    const { data, isLoading, isError, refetch } = useGetReturnsQuery({
        page,
        limit,
        searchTerm,
        sortBy: sort.field,
        sortOrder: sort.order,
        startDate: dateRange.startDate || undefined,
        endDate: dateRange.endDate || undefined,
    });

    const returns = data?.returns ?? [];
    const totalPages = data?.totalPages || 1;
    const totalCount = data?.totalCount || 0;

    const toggleRow = (id: number) => {
        setExpandedRows(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const formatDate = (dateString: string) => {
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
            key: 'expand',
            label: '',
            sortable: false,
            renderCell: (ret: ReturnRecord) => (
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => toggleRow(ret.id)}
                    aria-label={expandedRows.has(ret.id) ? 'Collapse return details' : 'Expand return details'}
                    aria-expanded={expandedRows.has(ret.id)}
                >
                    {expandedRows.has(ret.id) ? (
                        <ChevronDown className="h-4 w-4" />
                    ) : (
                        <ChevronRight className="h-4 w-4" />
                    )}
                </Button>
            )
        },
        {
            key: 'created_at',
            label: 'Date & Time',
            sortable: true,
            sortField: 'created_at',
            renderCell: (ret: ReturnRecord) => (
                <div className="flex flex-col">
                    <span className="font-medium">{formatDate(ret.created_at).split(',')[0]}</span>
                    <span className="text-xs text-muted-foreground">{formatDate(ret.created_at).split(',')[1]}</span>
                </div>
            )
        },
        {
            key: 'invoice_number',
            label: 'Original Invoice',
            sortable: false,
            renderCell: (ret: ReturnRecord) => (
                <Button
                    variant="link"
                    className="p-0 h-auto font-medium text-primary hover:underline"
                    onClick={() => navigate(`/sales/history/${ret.sale_id}`)}
                    aria-label={`View invoice ${ret.invoice_number}`}
                >
                    <Badge variant="outline" className="font-mono text-xs">
                        {ret.invoice_number}
                    </Badge>
                </Button>
            )
        },
        {
            key: 'items_count',
            label: 'Items',
            sortable: false,
            renderCell: (ret: ReturnRecord) => (
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className="flex items-center gap-2">
                                <Package className="h-4 w-4 text-muted-foreground" />
                                <Badge variant="secondary" className="font-mono text-xs">
                                    {ret.items?.length || 0}
                                </Badge>
                            </div>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>{ret.items?.length || 0} item(s) returned</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            )
        },
        {
            key: 'processed_by_name',
            label: 'Processed By',
            sortable: false,
            renderCell: (ret: ReturnRecord) => (
                <div className="flex items-center gap-2">
                    <div
                        className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary"
                        aria-hidden="true"
                    >
                        {ret.processed_by_name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <span className="text-sm font-medium">{ret.processed_by_name || 'Unknown'}</span>
                </div>
            )
        },
        {
            key: 'total_refund',
            label: 'Refund Amount',
            sortable: true,
            sortField: 'total_refund',
            className: 'text-right',
            renderCell: (ret: ReturnRecord) => (
                <div className="text-right">
                    <div className="font-bold text-destructive text-base">
                        -<CurrencyText value={ret.total_refund} />
                    </div>
                </div>
            )
        },
        {
            key: 'reason',
            label: 'Reason',
            sortable: false,
            renderCell: (ret: ReturnRecord) => (
                ret.reason ? (
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <span className="max-w-[200px] truncate block cursor-help text-sm">
                                    {ret.reason}
                                </span>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                                <p>{ret.reason}</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                ) : (
                    <span className="text-muted-foreground italic text-sm">No reason provided</span>
                )
            )
        },
    ];

    const renderActions = (ret: ReturnRecord) => (
        <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/sales/history/${ret.sale_id}`)}
            className="text-muted-foreground hover:text-primary"
            aria-label={`View sale details for invoice ${ret.invoice_number}`}
        >
            View Sale
        </Button>
    );

    const renderExpandedContent = (ret: ReturnRecord) => {
        if (!expandedRows.has(ret.id)) return null;

        return (
            <div className="px-4 py-3 bg-muted/30 border-t border-border/50">
                <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        Returned Items
                    </h4>
                    <div className="">
                        {ret.items?.map((item: ReturnItem) => (
                            <div key={item.id} className="flex items-center justify-between bg-background rounded-md p-3 border border-border/50">
                                <div className="flex-1">
                                    <p className="text-sm font-medium">{item.product_name}</p>
                                    <p className="text-xs text-muted-foreground">{item.variant_name}</p>
                                </div>
                                <div className="flex items-center gap-4 text-sm">
                                    <div className="text-right">
                                        <p className="text-muted-foreground text-xs">Quantity</p>
                                        <p className="font-semibold">{item.quantity}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-muted-foreground text-xs">Unit Price</p>
                                        <p className="font-semibold"><CurrencyText value={item.price_per_unit} /></p>
                                    </div>
                                    <div className="text-right min-w-[80px]">
                                        <p className="text-muted-foreground text-xs">Refund</p>
                                        <p className="font-bold text-destructive">-<CurrencyText value={item.refund_amount} /></p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    const emptyState = (
        <div className="flex flex-col items-center justify-center p-12 text-center space-y-4">
            <div className="rounded-full bg-muted/50 p-6">
                <RotateCcw className="h-12 w-12 text-muted-foreground" />
            </div>
            <div className="space-y-2">
                <h3 className="text-lg font-semibold">No Returns Yet</h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                    Returns will appear here when customers return items from completed sales.
                </p>
                <p className="text-sm text-muted-foreground max-w-sm">
                    Process returns from the sale details page.
                </p>
            </div>
        </div>
    );

    const handleClearFilters = () => {
        setDateRange({ startDate: null, endDate: null });
        setSearchTerm("");
        setPage(1);
    };

    const isAnyFilterActive = dateRange.startDate !== null || dateRange.endDate !== null;

    return (
        <div className="h-[calc(100vh-7rem)] flex flex-col gap-4 p-4 overflow-hidden">
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Returns & Refunds</h1>
                    <p className="text-sm text-muted-foreground">Track and manage all processed returns and refunds</p>
                </div>
                <div className="flex items-center gap-3">
                    <Badge variant="secondary" className="text-sm font-medium px-3 py-1">
                        {totalCount} Total Returns
                    </Badge>
                </div>
            </div>

            <div className="flex-1 overflow-hidden">
                <DataTable
                    data={returns.map((ret: ReturnRecord) => ({
                        ...ret,
                        expandedContent: renderExpandedContent(ret)
                    }))}
                    columns={columns}
                    isLoading={isLoading}
                    error={isError ? 'Failed to load returns.' : null}
                    onRetry={refetch}

                    searchTerm={searchTerm}
                    onSearchChange={(value) => {
                        setSearchTerm(value);
                        setPage(1);
                    }}
                    searchPlaceholder="Search by return ID, invoice, or reason..."

                    currentPage={page}
                    totalPages={totalPages}
                    onPageChange={setPage}

                    emptyState={emptyState}
                    renderActions={renderActions}
                    avatarIcon={<RotateCcw className="h-4 w-4 text-primary" />}

                    onSort={(column) => {
                        const newOrder = sort.field === column.sortField && sort.order === 'ASC' ? 'DESC' : 'ASC';
                        setSort({ field: column.sortField as 'created_at' | 'total_refund', order: newOrder });
                        setPage(1);
                    }}
                    sortOrder={sort.order}
                    sortBy={sort.field}

                    customFilters={
                        <DateRangeFilter
                            startDate={dateRange.startDate}
                            endDate={dateRange.endDate}
                            onApply={(startDate, endDate) => {
                                setDateRange({ startDate, endDate });
                                setPage(1);
                            }}
                        />
                    }
                    onFilterChange={() => { }}
                    onClearAllFilters={handleClearFilters}
                    isAnyFilterActive={isAnyFilterActive}
                />
            </div>
        </div>
    );
}
