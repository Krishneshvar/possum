import { Badge } from "@/components/ui/badge";
import CurrencyText from "@/components/common/CurrencyText";

export const allColumns = [
    {
        key: "composite_name",
        label: "Product | Variant",
        renderCell: (row) => (
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
        renderCell: (row) => <CurrencyText value={row.mrp} />,
        sortable: true,
        sortField: 'v.mrp',
    },
    {
        key: "cost_price",
        label: "Cost",
        renderCell: (row) => <CurrencyText value={row.cost_price} />,
        sortable: true,
        sortField: 'v.cost_price',
    },
    {
        key: "stock",
        label: "Stock",
        renderCell: (row) => (
            <Badge variant={row.stock <= row.stock_alert_cap ? "destructive" : "secondary"}>
                {row.stock}
            </Badge>
        ),
    },
    {
        key: "status",
        label: "Status",
        renderCell: (row) => (
            <Badge variant={row.status === 'active' ? 'success' : 'secondary'}>
                {row.status}
            </Badge>
        ),
        sortable: true,
        sortField: 'v.status',
    }
];
