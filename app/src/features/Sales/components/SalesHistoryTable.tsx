import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import CurrencyText from "@/components/common/CurrencyText";
import { Link } from "react-router-dom";
import { Eye, Printer, Receipt } from "lucide-react";
import ActionsDropdown from "@/components/common/ActionsDropdown";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import DataTable from "@/components/common/DataTable";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface SalesHistoryTableProps {
    sales: any[];
    currentPage: number;
    itemsPerPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    isLoading: boolean;
    searchTerm: string;
    onSearchChange: (value: string) => void;
}

export default function SalesHistoryTable({ sales, currentPage, itemsPerPage, totalPages, onPageChange, isLoading, searchTerm, onSearchChange }: SalesHistoryTableProps) {
    const getStatusBadge = (status: string) => {
        let variant: "default" | "secondary" | "destructive" | "outline" | "success" = "secondary";
        switch (status) {
            case 'completed': variant = 'success'; break;
            case 'pending': variant = 'secondary'; break;
            case 'cancelled': variant = 'destructive'; break;
            case 'refunded': variant = 'outline'; break;
            default: variant = 'secondary';
        }
        return <Badge variant={variant} className="capitalize">{status}</Badge>;
    };

    const columns = [
        {
            key: "invoice_number",
            label: "Invoice #",
            renderCell: (order: any) => <span className="font-mono font-medium text-primary">{order.invoice_number}</span>,
            sortable: true,
            sortField: "invoice_number",
        },
        {
            key: "customer_name",
            label: "Customer",
            renderCell: (order: any) => (
                <div className="flex flex-col">
                    <span className="font-medium">{order.customer_name || "Walk-in Customer"}</span>
                    {order.customer_phone && <span className="text-xs text-muted-foreground">{order.customer_phone}</span>}
                </div>
            ),
            sortable: true,
            sortField: "customer_name",
        },
        {
            key: "sale_date",
            label: "Date & Time",
            renderCell: (order: any) => (
                <div className="flex flex-col">
                    <span className="font-medium">{format(new Date(order.sale_date), "MMM dd, yyyy")}</span>
                    <span className="text-xs text-muted-foreground">{format(new Date(order.sale_date), "hh:mm a")}</span>
                </div>
            ),
            sortable: true,
            sortField: "sale_date",
        },
        {
            key: "total_amount",
            label: "Total Amount",
            renderCell: (order: any) => <CurrencyText value={order.total_amount} className="font-bold" />,
            sortable: true,
            sortField: "total_amount",
            align: "right" as const,
        },
        {
            key: "payment_status",
            label: "Payment Status",
            renderCell: (order: any) => {
                const isPaid = order.paid_amount >= order.total_amount;
                const isPartial = order.paid_amount > 0 && order.paid_amount < order.total_amount;
                return (
                    <Badge variant={isPaid ? "success" : isPartial ? "secondary" : "destructive"} className="text-xs">
                        {isPaid ? "Paid" : isPartial ? "Partial" : "Unpaid"}
                    </Badge>
                );
            },
        },
        {
            key: "status",
            label: "Status",
            renderCell: (order: any) => getStatusBadge(order.status),
            sortable: true,
            sortField: "status",
        },
        {
            key: "actions",
            label: "Actions",
            renderCell: (order: any) => (
                <div className="flex items-center gap-2 justify-end">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="outline"
                                size="icon-sm"
                                asChild
                                aria-label={`View details for invoice ${order.invoice_number}`}
                            >
                                <Link to={`/sales/${order.id}`}>
                                    <Eye className="h-4 w-4" />
                                    <span className="sr-only">View details for invoice {order.invoice_number}</span>
                                </Link>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>View Details</TooltipContent>
                    </Tooltip>
                    {renderOrderActions(order)}
                </div>
            ),
            align: "right" as const,
        },
    ];

    const renderOrderActions = (order: any) => (
        <ActionsDropdown aria-label={`Actions for invoice ${order.invoice_number}`}>
            <DropdownMenuItem asChild>
                <Link to={`/sales/${order.id}`} className="cursor-pointer">
                    <Receipt className="mr-2 h-4 w-4" />
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
            // @ts-ignore
            columns={columns}
            isLoading={isLoading}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={onPageChange}
            searchTerm={searchTerm}
            onSearchChange={onSearchChange}
            searchPlaceholder="Search by invoice number, customer name, or phone..."
            emptyState={emptyState}
        />
    );
}
