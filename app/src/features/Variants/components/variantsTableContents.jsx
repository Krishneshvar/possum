import { Badge } from "@/components/ui/badge";

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
        key: "sku",
        label: "SKU",
        renderCell: (row) => row.sku,
        sortable: true,
        sortField: 'v.sku',
    },
    {
        key: "mrp",
        label: "MRP",
        renderCell: (row) => `₹${Number(row.mrp).toFixed(2)}`,
        sortable: true,
        sortField: 'v.mrp',
    },
    {
        key: "cost_price",
        label: "Cost",
        renderCell: (row) => `₹${Number(row.cost_price).toFixed(2)}`,
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
