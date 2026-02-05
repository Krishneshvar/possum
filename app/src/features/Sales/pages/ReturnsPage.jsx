import React, { useState } from 'react';
import { useGetReturnsQuery } from '@/services/returnsApi';
import { Button } from '@/components/ui/button';
import { Loader2, FileDown } from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useDebounce } from '@/hooks/useDebounce';
import { useCurrency } from '@/hooks/useCurrency';
import { useNavigate } from 'react-router-dom';

export default function ReturnsPage() {
    const navigate = useNavigate();
    const currency = useCurrency();
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const debouncedSearch = useDebounce(search, 500);

    // TODO: Implement advanced filtering if needed (startDate, endDate)
    const { data, isLoading, isError } = useGetReturnsQuery({
        page,
        limit: 20,
        // search: debouncedSearch // Backend doesn't support search by text yet, maybe add later or filter client side?
        // Actually backend supports saleId or userId.
    });

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="flex flex-col gap-6 max-w-[1600px] mx-auto w-full">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Returns</h1>
                    <p className="text-muted-foreground mt-1">
                        Manage and view processed returns.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline">
                        <FileDown className="mr-2 h-4 w-4" />
                        Export
                    </Button>
                </div>
            </div>

            <Card className="border-border/50 shadow-sm">
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <CardTitle>Returns History</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/30">
                                <TableHead className="pl-6">Return ID</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Sale / Invoice</TableHead>
                                <TableHead>Processed By</TableHead>
                                <TableHead className="text-right">Refund Amount</TableHead>
                                <TableHead>Reason</TableHead>
                                <TableHead className="text-right pr-6">Items</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-24 text-center">
                                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                                    </TableCell>
                                </TableRow>
                            ) : isError ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-24 text-center text-destructive">
                                        Failed to load returns.
                                    </TableCell>
                                </TableRow>
                            ) : data?.returns?.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                                        No returns found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                data?.returns.map((ret) => (
                                    <TableRow
                                        key={ret.id}
                                        className="cursor-pointer hover:bg-muted/30 transition-colors"
                                        onClick={() => navigate(`/sales/history/${ret.sale_id}`)}
                                    >
                                        <TableCell className="pl-6 font-mono text-xs">#{ret.id}</TableCell>
                                        <TableCell className="text-sm">
                                            <div className="flex flex-col">
                                                <span>{formatDate(ret.created_at).split(',')[0]}</span>
                                                <span className="text-xs text-muted-foreground">{formatDate(ret.created_at).split(',')[1]}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline" className="font-mono text-xs">
                                                    {ret.invoice_number}
                                                </Badge>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                                                    {ret.processed_by_name?.charAt(0) || 'U'}
                                                </div>
                                                <span className="text-sm">{ret.processed_by_name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right font-bold text-destructive">
                                            -{currency}{ret.total_refund?.toFixed(2)}
                                        </TableCell>
                                        <TableCell className="max-w-[200px] truncate" title={ret.reason}>
                                            {ret.reason || <span className="text-muted-foreground italic">No reason provided</span>}
                                        </TableCell>
                                        <TableCell className="text-right pr-6 text-muted-foreground">
                                            View Details
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
