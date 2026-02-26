import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { TrendingDown, TrendingUp } from 'lucide-react';

const REASON_LABELS: Record<string, { label: string; color: string }> = {
    sale: { label: 'Sale', color: 'bg-blue-100 text-blue-700 border-blue-200' },
    return: { label: 'Return', color: 'bg-purple-100 text-purple-700 border-purple-200' },
    confirm_receive: { label: 'Purchase', color: 'bg-green-100 text-green-700 border-green-200' },
    spoilage: { label: 'Spoilage', color: 'bg-orange-100 text-orange-700 border-orange-200' },
    damage: { label: 'Damage', color: 'bg-red-100 text-red-700 border-red-200' },
    theft: { label: 'Theft', color: 'bg-rose-100 text-rose-700 border-rose-200' },
    correction: { label: 'Correction', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
};

function formatDateTime(str: string) {
    if (!str) return '—';
    const d = new Date(str);
    return new Intl.DateTimeFormat('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
        hour12: true,
    }).format(d);
}

export const allColumns = [
    {
        key: 'product',
        label: 'Product / Variant',
        sortable: true,
        sortField: 'product_name',
        renderCell: (adj: any) => (
            <div className="flex flex-col min-w-0">
                <Link
                    to={`/products/${adj.product_id}`}
                    className="font-medium text-foreground hover:text-primary transition-colors truncate text-sm"
                >
                    {adj.product_name ?? '—'}
                </Link>
                <span className="text-xs text-muted-foreground truncate">
                    {adj.variant_name}
                    {adj.sku && (
                        <span className="ml-1 font-mono text-[10px] bg-muted px-1 py-0.5 rounded">
                            {adj.sku}
                        </span>
                    )}
                </span>
            </div>
        )
    },
    {
        key: 'quantity_change',
        label: 'Change',
        sortable: true,
        sortField: 'quantity_change',
        renderCell: (adj: any) => {
            const isPositive = adj.quantity_change > 0;
            return (
                <span className={`inline-flex items-center gap-1 font-semibold tabular-nums ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                    {isPositive ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                    {isPositive ? `+${adj.quantity_change}` : adj.quantity_change}
                </span>
            );
        }
    },
    {
        key: 'reason',
        label: 'Reason',
        renderCell: (adj: any) => {
            const cfg = REASON_LABELS[adj.reason] ?? { label: adj.reason, color: 'bg-gray-100 text-gray-700 border-gray-200' };
            return (
                <Badge variant="outline" className={`${cfg.color} capitalize font-medium border px-2 py-0.5 text-xs shadow-sm`}>
                    {cfg.label}
                </Badge>
            );
        }
    },
    {
        key: 'adjusted_by_name',
        label: 'Adjusted By',
        renderCell: (adj: any) => (
            <span className="text-sm text-foreground truncate">
                {adj.adjusted_by_name ?? `User #${adj.adjusted_by}`}
            </span>
        )
    },
    {
        key: 'adjusted_at',
        label: 'Date & Time',
        sortable: true,
        sortField: 'adjusted_at',
        renderCell: (adj: any) => (
            <span className="text-xs text-muted-foreground">
                {formatDateTime(adj.adjusted_at)}
            </span>
        )
    }
];
