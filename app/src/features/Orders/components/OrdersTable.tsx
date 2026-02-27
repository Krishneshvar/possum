import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import CurrencyText from "@/components/common/CurrencyText";
import { Link } from "react-router-dom";
import { Eye } from "lucide-react";
import ActionsDropdown from "@/components/common/ActionsDropdown";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";

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

export const allColumns = [
    {
        key: "invoice_number",
        label: "Invoice #",
        renderCell: (order: any) => <span className="font-mono font-medium">{order.invoice_number}</span>,
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
        label: "Date",
        renderCell: (order: any) => (
            <div className="flex flex-col">
                <span>{format(new Date(order.sale_date), "MMM dd, yyyy")}</span>
                <span className="text-xs text-muted-foreground">{format(new Date(order.sale_date), "hh:mm a")}</span>
            </div>
        ),
        sortable: true,
        sortField: "sale_date",
    },
    {
        key: "total_amount",
        label: "Total",
        renderCell: (order: any) => <CurrencyText value={order.total_amount} className="font-bold" />,
        sortable: true,
        sortField: "total_amount",
        align: "right" as const,
    },
    {
        key: "payment_status",
        label: "Payment",
        renderCell: (order: any) => {
            const isPaid = order.paid_amount >= order.total_amount;
            const isPartial = order.paid_amount > 0 && order.paid_amount < order.total_amount;
            return (
                <Badge variant={isPaid ? "outline" : isPartial ? "secondary" : "destructive"}>
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
];

export const renderOrderActions = (order: any) => (
    <ActionsDropdown>
        <DropdownMenuItem asChild>
            <Link to={`/sales/${order.id}`} className="cursor-pointer">
                <Eye className="mr-2 h-4 w-4" />
                <span>View Details</span>
            </Link>
        </DropdownMenuItem>
    </ActionsDropdown>
);
