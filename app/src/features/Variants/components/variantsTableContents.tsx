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
        renderCell: (row: any) => (
            // @ts-ignore
            <Badge variant={row.status === 'active' ? 'success' : 'secondary'}>
                {row.status}
            </Badge>
        ),
    }
];
