import { Badge } from "@/components/ui/badge";
import CurrencyText from "@/components/common/CurrencyText";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";

export const allColumns = [
    {
        key: "composite_name",
        label: "Product | Variant",
        renderCell: (row: any) => (
            <div className="flex flex-col">
                <span className="font-medium text-foreground">
                    {row.product_name} | {row.name}
                </span>
                <span className="text-xs text-muted-foreground">{row.sku}</span>
            </div>
        ),
        sortable: true,
        sortField: 'p.name',
    },
    {
        key: "mrp",
        label: "MRP",
        renderCell: (row: any) => <CurrencyText value={row.price} />,
        sortable: true,
        sortField: 'v.mrp',
    },
    {
        key: "cost_price",
        label: "Cost",
        renderCell: (row: any) => <CurrencyText value={row.cost_price} />,
        sortable: true,
        sortField: 'v.cost_price',
    },
    {
        key: "stock",
        label: "Stock",
        renderCell: (row: any) => {
            const stock = row.stock ?? 0;
            const threshold = row.stock_alert_cap ?? 10;
            const isLow = stock <= threshold && stock > 0;
            const isOut = stock <= 0;

            const statusConfig = isOut
                ? { variant: 'destructive' as const, className: 'bg-red-500 hover:bg-red-600 text-white' }
                : isLow
                    ? { variant: 'default' as const, className: 'bg-orange-500 hover:bg-orange-600 text-white' }
                    : { variant: 'default' as const, className: 'bg-green-600 hover:bg-green-700 text-white' };

            return (
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Badge
                            variant={statusConfig.variant}
                            className={`${statusConfig.className} cursor-help font-mono`}
                        >
                            {stock}
                        </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>
                            {isOut
                                ? 'Out of stock'
                                : isLow
                                    ? `Low stock (threshold: ${threshold})`
                                    : `Healthy stock level (threshold: ${threshold})`}
                        </p>
                    </TooltipContent>
                </Tooltip>
            );
        },
    },
    {
        key: "status",
        label: "Status",
        renderCell: (row: any) => {
            const status = (row.status || 'inactive').toLowerCase();
            const styles: Record<string, string> = {
                active: "bg-green-100 text-green-700 hover:bg-green-200 border-green-200",
                inactive: "bg-yellow-100 text-yellow-700 hover:bg-yellow-200 border-yellow-200",
                discontinued: "bg-red-100 text-red-700 hover:bg-red-200 border-red-200",
            };

            const className = styles[status] || "bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-200";

            return (
                <Badge variant="outline" className={`${className} capitalize font-medium border px-2 py-0.5 shadow-sm`}>
                    {status}
                </Badge>
            );
        },
    }
];
