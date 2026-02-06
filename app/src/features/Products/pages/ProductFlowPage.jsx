import { useState } from 'react';
import { format } from 'date-fns';
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { TrendingUp } from 'lucide-react';
import { useGetVariantFlowQuery, useGetVariantFlowSummaryQuery } from '@/services/productFlowApi';
import { useGetPaymentMethodsQuery } from '@/services/salesApi';
import { useGetVariantsQuery } from '@/services/productsApi';
import DataTable from '@/components/common/DataTable';

export default function ProductFlowPage() {
    const [selectedVariantId, setSelectedVariantId] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [selectedPaymentMethods, setSelectedPaymentMethods] = useState([]);
    const [page, setPage] = useState(1);
    const limit = 20;
    const offset = (page - 1) * limit;

    const { data: variantsData } = useGetVariantsQuery({ limit: 1000 });
    const variants = variantsData?.variants || [];

    const { data: paymentMethodsData } = useGetPaymentMethodsQuery();
    const paymentMethods = paymentMethodsData || [];

    const { data: flowData, isLoading: isFlowLoading, refetch } = useGetVariantFlowQuery(
        {
            variantId: selectedVariantId,
            limit,
            offset,
            startDate,
            endDate,
            paymentMethods: selectedPaymentMethods
        },
        { skip: !selectedVariantId }
    );

    const { data: summaryData } = useGetVariantFlowSummaryQuery(selectedVariantId, { skip: !selectedVariantId });

    const handleVariantChange = (value) => {
        setSelectedVariantId(value);
        setPage(1);
    };

    const handlePaymentMethodToggle = (methodName) => {
        setSelectedPaymentMethods(prev => {
            if (prev.includes(methodName)) {
                return prev.filter(m => m !== methodName);
            } else {
                return [...prev, methodName];
            }
        });
        setPage(1);
    };

    const handleDateChange = (type, value) => {
        if (type === 'start') setStartDate(value);
        else setEndDate(value);
        setPage(1);
    };

    const columns = [
        {
            key: 'event_date',
            label: 'Date',
            sortable: false,
            renderCell: (event) => (
                <span className="text-muted-foreground whitespace-nowrap">
                    {format(new Date(event.event_date), 'MMM d, yyyy HH:mm')}
                </span>
            )
        },
        {
            key: 'event_type',
            label: 'Event Type',
            sortable: false,
            renderCell: (event) => (
                <Badge variant={
                    event.event_type === 'sale' ? 'default' :
                        event.event_type === 'purchase' ? 'secondary' :
                            event.event_type === 'return' ? 'destructive' : 'outline'
                }>
                    {event.event_type.toUpperCase()}
                </Badge>
            )
        },
        {
            key: 'quantity',
            label: 'Quantity',
            sortable: false,
            renderCell: (event) => (
                <span className={event.quantity < 0 ? "text-red-500 font-medium" : "text-green-500 font-medium"}>
                    {event.quantity > 0 ? `+${event.quantity}` : event.quantity}
                </span>
            )
        },
        {
            key: 'reference',
            label: 'Reference',
            sortable: false,
            renderCell: (event) => (
                <span className="text-sm font-mono">{event.reference_type} #{event.reference_id}</span>
            )
        },
        {
            key: 'payment_method_names',
            label: 'Payment Method',
            sortable: false,
            renderCell: (event) => (
                event.payment_method_names ? (
                    <Badge variant="outline">{event.payment_method_names}</Badge>
                ) : '-'
            )
        },
    ];

    const emptyState = (
        <div className="text-center p-8 text-muted-foreground">
            {selectedVariantId ? "No flow history found." : "Select a variant to view history."}
        </div>
    );

    return (
        <div className="h-[calc(100vh-7rem)] flex flex-col gap-4 p-4 overflow-hidden">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Product Flow Analysis</h1>
                <p className="text-sm text-muted-foreground">
                    Track the movement history of products including sales, purchases, and returns.
                </p>
            </div>

            {/* Filters Card */}
            <Card>
                <CardHeader>
                    <CardTitle>Filters</CardTitle>
                    <CardDescription>Select a product variant and apply filters to view its history.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label>Product Variant</Label>
                            <Select value={selectedVariantId} onValueChange={handleVariantChange}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a variant..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {variants.map(variant => (
                                        <SelectItem key={variant.id} value={String(variant.id)}>
                                            {variant.product_name} - {variant.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Date Range</Label>
                            <div className="flex gap-2">
                                <Input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => handleDateChange('start', e.target.value)}
                                />
                                <span className="self-center">-</span>
                                <Input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => handleDateChange('end', e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Payment Methods (Sales)</Label>
                            <div className="flex flex-wrap gap-2 pt-2">
                                {paymentMethods.map(pm => (
                                    <div key={pm.id} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={`pm-${pm.id}`}
                                            checked={selectedPaymentMethods.includes(pm.name)}
                                            onCheckedChange={() => handlePaymentMethodToggle(pm.name)}
                                        />
                                        <label
                                            htmlFor={`pm-${pm.id}`}
                                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                        >
                                            {pm.name}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Summary Cards */}
            {selectedVariantId && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-2xl font-bold">{summaryData?.totalSold || 0}</div>
                            <p className="text-xs text-muted-foreground">Total Sold</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-2xl font-bold">{summaryData?.totalPurchased || 0}</div>
                            <p className="text-xs text-muted-foreground">Total Purchased</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-2xl font-bold">{summaryData?.totalReturned || 0}</div>
                            <p className="text-xs text-muted-foreground">Total Returned</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-2xl font-bold text-blue-600">{summaryData?.netMovement || 0}</div>
                            <p className="text-xs text-muted-foreground">Net Movement</p>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Data Table */}
            <DataTable
                data={flowData || []}
                columns={columns}
                isLoading={isFlowLoading}
                onRetry={refetch}

                currentPage={page}
                totalPages={Math.ceil((flowData?.length || 0) / limit) || 1}
                onPageChange={setPage}

                emptyState={emptyState}
                avatarIcon={<TrendingUp className="h-4 w-4 text-primary" />}
            />
        </div>
    );
}
