import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import CurrencyText from "@/components/common/CurrencyText";
import { Link } from "react-router-dom";
import { Eye, Receipt, Printer, XCircle } from "lucide-react";
import ActionsDropdown from "@/components/common/ActionsDropdown";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import DataTable, { type Column } from "@/components/common/DataTable";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
    getStatusBadgeVariant,
    getPaymentStatusBadgeVariant,
    getPaymentStatusLabel,
} from '../utils/saleStatus.utils';
import { useCancelSaleMutation } from '@/services/salesApi';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import { Sale } from '../../../../../models/index.js';

interface SalesHistoryTableProps {
    sales: Sale[];
    currentPage: number;
    itemsPerPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    isLoading: boolean;
    searchTerm: string;
    onSearchChange: (value: string) => void;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
    onSort?: (column: Column) => void;
    activeFilters?: Record<string, string[]>;
    onFilterChange?: (payload: { key: string; value: string[] }) => void;
    onClearAllFilters?: () => void;
    isAnyFilterActive?: boolean;
    customFilters?: React.ReactNode;
    onRefresh?: () => void;
    isRefreshing?: boolean;
}

const filtersConfig = [
    {
        key: 'status',
        label: 'Payment Status',
        options: [
            { label: 'Paid', value: 'paid' },
            { label: 'Partially Paid', value: 'partially_paid' },
            { label: 'Draft', value: 'draft' },
            { label: 'Cancelled', value: 'cancelled' },
            { label: 'Refunded', value: 'refunded' },
        ],
    },
];

export default function SalesHistoryTable({
    sales,
    currentPage,
    itemsPerPage: _itemsPerPage,
    totalPages,
    onPageChange,
    isLoading,
    searchTerm,
    onSearchChange,
    sortBy,
    sortOrder,
    onSort,
    activeFilters,
    onFilterChange,
    onClearAllFilters,
    isAnyFilterActive,
    customFilters,
    onRefresh,
    isRefreshing = false,
}: SalesHistoryTableProps) {
    const [cancelSale, { isLoading: isCancelling }] = useCancelSaleMutation();

    const handleCancel = async (saleId: number) => {
        try {
            await cancelSale(saleId).unwrap();
            toast.success('Sale cancelled successfully');
        } catch (err: any) {
            toast.error(err?.data?.error || 'Failed to cancel sale');
        }
    };

    const columns: Column[] = [
        {
            key: "invoice_number",
            label: "Invoice #",
            renderCell: (order: Sale) => (
                <span className="font-mono font-medium text-primary">{order.invoice_number}</span>
            ),
        },
        {
            key: "customer_name",
            label: "Customer",
            sortable: true,
            sortField: "customer_name",
            renderCell: (order: Sale) => (
                <div className="flex flex-col">
                    <span className="font-medium">{order.customer_name || "Walk-in Customer"}</span>
                    {order.customer_phone && (
                        <span className="text-xs text-muted-foreground">{order.customer_phone}</span>
                    )}
                </div>
            ),
        },
        {
            key: "sale_date",
            label: "Date & Time",
            sortable: true,
            sortField: "sale_date",
            renderCell: (order: Sale) => (
                <div className="flex flex-col">
                    <span className="font-medium">{format(new Date(order.sale_date), "MMM dd, yyyy")}</span>
                    <span className="text-xs text-muted-foreground">{format(new Date(order.sale_date), "hh:mm a")}</span>
                </div>
            ),
        },
        {
            key: "total_amount",
            label: "Total Amount",
            sortable: true,
            sortField: "total_amount",
            align: "right" as const,
            renderCell: (order: Sale) => <CurrencyText value={order.total_amount} className="font-bold" />,
        },
        {
            key: "payment_status",
            label: "Payment",
            renderCell: (order: Sale) => (
                <Badge
                    variant={getPaymentStatusBadgeVariant(order.paid_amount, order.total_amount)}
                    className="text-xs"
                >
                    {getPaymentStatusLabel(order.paid_amount, order.total_amount)}
                </Badge>
            ),
        },
        {
            key: "status",
            label: "Status",
            renderCell: (order: Sale) => (
                <Badge variant={getStatusBadgeVariant(order.status)} className="capitalize w-fit text-xs">
                    {order.status.replace('_', ' ')}
                </Badge>
            ),
        },
        {
            key: "actions",
            label: "Actions",
            align: "right" as const,
            renderCell: (order: Sale) => {
                const isActive = order.status !== 'cancelled' && order.status !== 'refunded';
                const canAddPayment = isActive && order.status !== 'paid';
                const canCancel = isActive;

                return (
                    <div className="flex items-center gap-1 justify-end">
                        <div className="hidden md:flex items-center gap-1">

                            {/* Cancel Action */}
                            {canCancel && (
                                <AlertDialog>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <AlertDialogTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                    aria-label="Cancel Sale"
                                                    disabled={isCancelling}
                                                >
                                                    {isCancelling ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <XCircle className="h-4 w-4" />
                                                    )}
                                                </Button>
                                            </AlertDialogTrigger>
                                        </TooltipTrigger>
                                        <TooltipContent>Cancel Sale</TooltipContent>
                                    </Tooltip>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Cancel this Sale?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                This will cancel Invoice <strong>#{order.invoice_number}</strong> and restore all inventory. This action cannot be undone.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Back</AlertDialogCancel>
                                            <AlertDialogAction
                                                onClick={() => handleCancel(order.id)}
                                                className="bg-destructive hover:bg-destructive/90"
                                            >
                                                Yes, Cancel Sale
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            )}

                            {/* Print Action */}
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-muted-foreground hover:text-primary"
                                        aria-label="Print Invoice"
                                    >
                                        <Printer className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Print Invoice</TooltipContent>
                            </Tooltip>

                            {/* View Details Action */}
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-muted-foreground hover:text-primary"
                                        asChild
                                        aria-label={`View details for invoice ${order.invoice_number}`}
                                    >
                                        <Link to={`/sales/history/${order.id}`}>
                                            <Eye className="h-4 w-4" />
                                        </Link>
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>View Details</TooltipContent>
                            </Tooltip>
                        </div>
                        <div className="md:hidden">
                            {renderOrderActions(order)}
                        </div>
                    </div>
                );
            },
        },
    ];

    const renderOrderActions = (order: Sale) => (
        <ActionsDropdown aria-label={`Actions for invoice ${order.invoice_number}`}>
            <DropdownMenuItem asChild>
                <Link to={`/sales/history/${order.id}`} className="cursor-pointer">
                    <Eye className="mr-2 h-4 w-4" />
                    <span>View Full Details</span>
                </Link>
            </DropdownMenuItem>
        </ActionsDropdown>
    );

    const emptyState = (
        <div className="flex flex-col items-center justify-center p-12 text-center">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-muted/50 mb-4">
                <Receipt className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">No Bills Found</h3>
            <p className="text-sm text-muted-foreground max-w-md mb-4">
                {searchTerm
                    ? `No bills match your search "${searchTerm}". Try adjusting your search terms.`
                    : "There are no sales transactions yet. Bills will appear here once you complete sales."
                }
            </p>
            {searchTerm && (
                <Button variant="outline" size="sm" onClick={() => onSearchChange('')}>
                    Clear Search
                </Button>
            )}
        </div>
    );

    return (
        <DataTable
            data={sales}
            columns={columns}
            isLoading={isLoading}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={onPageChange}
            searchTerm={searchTerm}
            onSearchChange={onSearchChange}
            searchPlaceholder="Search by invoice #, customer name..."
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSort={onSort}
            filtersConfig={filtersConfig}
            activeFilters={activeFilters}
            onFilterChange={onFilterChange}
            onClearAllFilters={onClearAllFilters}
            isAnyFilterActive={isAnyFilterActive}
            customFilters={customFilters}
            emptyState={emptyState}
            onRefresh={onRefresh}
            isRefreshing={isRefreshing}
        />
    );
}
