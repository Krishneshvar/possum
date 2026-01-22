
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';
import { Search, Filter, ArrowLeft, ArrowRight } from 'lucide-react';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

import { useGetVariantFlowQuery, useGetVariantFlowSummaryQuery } from '@/services/productFlowApi';
import { useGetPaymentMethodsQuery } from '@/services/salesApi';
import { useGetVariantsQuery } from '@/services/productsApi';

export default function ProductFlowPage() {
    const [searchParams, setSearchParams] = useSearchParams();

    // Filters
    const [selectedVariantId, setSelectedVariantId] = useState(searchParams.get('variantId') || '');
    const [startDate, setStartDate] = useState(searchParams.get('startDate') || '');
    const [endDate, setEndDate] = useState(searchParams.get('endDate') || '');
    const [selectedPaymentMethods, setSelectedPaymentMethods] = useState([]);

    // Pagination
    const [page, setPage] = useState(1);
    const limit = 20;
    const offset = (page - 1) * limit;

    // Queries
    // Fetch variants for selector (simple list for now, could be search-based if many)
    const { data: variantsData } = useGetVariantsQuery({ limit: 1000 }); // Assuming reasonably small catalog for now
    const variants = variantsData?.variants || [];

    const { data: paymentMethodsData } = useGetPaymentMethodsQuery();
    const paymentMethods = paymentMethodsData || [];

    const { data: flowData, isLoading: isFlowLoading } = useGetVariantFlowQuery(
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

    // Handlers
    const handleVariantChange = (value) => {
        setSelectedVariantId(value);
        setPage(1);
        setSearchParams(prev => {
            prev.set('variantId', value);
            return prev;
        });
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

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Product Flow Analysis</h1>
                <p className="text-muted-foreground">
                    Track the movement history of products including sales, purchases, and returns.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Filters</CardTitle>
                    <CardDescription>Select a product variant and apply filters to view its history.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Variant Selector */}
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

                        {/* Date Range */}
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

                        {/* Payment Methods (Only for sales) */}
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

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Event Type</TableHead>
                                <TableHead>Quantity</TableHead>
                                <TableHead>Reference</TableHead>
                                <TableHead>Payment Method</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isFlowLoading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center h-24">Loading...</TableCell>
                                </TableRow>
                            ) : flowData?.length > 0 ? (
                                flowData.map((event) => (
                                    <TableRow key={event.id}>
                                        <TableCell>{format(new Date(event.event_date), 'MMM d, yyyy HH:mm')}</TableCell>
                                        <TableCell>
                                            <Badge variant={
                                                event.event_type === 'sale' ? 'default' :
                                                    event.event_type === 'purchase' ? 'secondary' :
                                                        event.event_type === 'return' ? 'destructive' : 'outline'
                                            }>
                                                {event.event_type.toUpperCase()}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className={event.quantity < 0 ? "text-red-500 font-medium" : "text-green-500 font-medium"}>
                                            {event.quantity > 0 ? `+${event.quantity}` : event.quantity}
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-sm font-mono">{event.reference_type} #{event.reference_id}</span>
                                        </TableCell>
                                        <TableCell>
                                            {event.payment_method_names ? (
                                                <Badge variant="outline">{event.payment_method_names}</Badge>
                                            ) : '-'}
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center h-24">
                                        {selectedVariantId ? "No flow history found." : "Select a variant to view history."}
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Pagination Controls */}
            <div className="flex items-center justify-end space-x-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1 || isFlowLoading}
                >
                    <ArrowLeft className="h-4 w-4" />
                    Previous
                </Button>
                <div className="text-sm font-medium">
                    Page {page}
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => p + 1)}
                    disabled={(!flowData || flowData.length < limit) || isFlowLoading}
                >
                    Next
                    <ArrowRight className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
