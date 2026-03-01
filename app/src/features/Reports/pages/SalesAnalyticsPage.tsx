import { useState, useEffect } from 'react';
import { format, subDays } from 'date-fns';
import {
    Bar,
    BarChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
    PieChart,
    Pie,
    Cell,
    Legend
} from 'recharts';
import {
    AlertCircle,
    RefreshCw,
    ShoppingBag,
    CreditCard
} from 'lucide-react';

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import DateRangeFilter from '@/components/common/DateRangeFilter';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { useCurrency } from '@/hooks/useCurrency';

import { useGetTopProductsQuery, useGetSalesByPaymentMethodQuery } from '@/services/reportsApi';
import { useReportData } from '../hooks/useReportData';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function SalesAnalyticsPage() {
    const currency = useCurrency();
    const [reportType, setReportType] = useState('daily');
    const [dateRange, setDateRange] = useState<{ startDate: string | null; endDate: string | null }>({
        startDate: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
        endDate: format(new Date(), 'yyyy-MM-dd'),
    });

    const activeStartDate = dateRange.startDate || format(subDays(new Date(), 30), 'yyyy-MM-dd');
    const activeEndDate = dateRange.endDate || format(new Date(), 'yyyy-MM-dd');

    const { data: currentData, isLoading, isError, refetch: refetchReport } = useReportData({
        reportType: reportType as 'daily' | 'monthly' | 'yearly',
        startDate: activeStartDate,
        endDate: activeEndDate
    });

    const chartData = currentData?.breakdown || [];

    const topProductsData = useGetTopProductsQuery({ startDate: activeStartDate, endDate: activeEndDate, limit: 5 });
    const salesByPaymentData = useGetSalesByPaymentMethodQuery({ startDate: activeStartDate, endDate: activeEndDate });

    const formatCurrency = (val: number) => `${currency}${val?.toFixed(2)}`;

    const refetch = () => {
        refetchReport();
        topProductsData.refetch();
        salesByPaymentData.refetch();
    };

    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'r') {
                e.preventDefault();
                refetch();
            }
        };
        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [reportType]);

    return (
        <div className="space-y-6 pb-8">
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Sales Analytics</h1>
                    <p className="text-muted-foreground mt-1">Detailed performance trends and product insights</p>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={refetch}
                    disabled={isLoading}
                    aria-label="Refresh analytics data"
                    title="Refresh (⌘R)"
                >
                    <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
                    Refresh
                </Button>
            </div>

            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-4">
                            <Label htmlFor="report-type-tabs" className="text-sm font-medium whitespace-nowrap">
                                Report Period
                            </Label>
                            <Tabs value={reportType} onValueChange={setReportType} className="flex-1">
                                <TabsList id="report-type-tabs" className="grid w-full max-w-md grid-cols-3">
                                    <TabsTrigger value="daily">Daily</TabsTrigger>
                                    <TabsTrigger value="monthly">Monthly</TabsTrigger>
                                    <TabsTrigger value="yearly">Yearly</TabsTrigger>
                                </TabsList>
                            </Tabs>
                        </div>

                        <div className="flex flex-wrap items-end gap-4">
                            <div className="flex-1 min-w-[300px]">
                                <Label className="text-sm mb-1.5 block">Date Range</Label>
                                <DateRangeFilter
                                    startDate={dateRange.startDate}
                                    endDate={dateRange.endDate}
                                    onApply={(start, end) => setDateRange({ startDate: start, endDate: end })}
                                />
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {isError && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                        Failed to load analytics data. Please try refreshing.
                    </AlertDescription>
                </Alert>
            )}

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Sales Trend</CardTitle>
                        <CardDescription>
                            {reportType === 'daily' ? 'Daily sales breakdown' :
                                reportType === 'monthly' ? 'Monthly sales breakdown' :
                                    'Yearly sales breakdown'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pl-2">
                        {isLoading ? (
                            <div className="h-[350px] flex items-center justify-center">
                                <Skeleton className="h-full w-full" />
                            </div>
                        ) : chartData.length === 0 ? (
                            <div className="h-[350px] flex flex-col items-center justify-center text-center px-4">
                                <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" aria-hidden="true" />
                                <h3 className="font-semibold text-lg mb-2">No Sales Data</h3>
                                <p className="text-sm text-muted-foreground max-w-sm">
                                    No transactions recorded for this period. Data will appear once sales are made.
                                </p>
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height={350}>
                                <BarChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${currency}${value}`} />
                                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                                    <Bar dataKey="sales" fill="#adfa1d" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Payment Methods</CardTitle>
                        <CardDescription>Distribution by payment type</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoading || salesByPaymentData.isLoading ? (
                            <div className="h-[350px] flex items-center justify-center">
                                <Skeleton className="h-full w-full" />
                            </div>
                        ) : !salesByPaymentData.data || salesByPaymentData.data.length === 0 ? (
                            <div className="h-[350px] flex flex-col items-center justify-center text-center px-4">
                                <CreditCard className="h-10 w-10 text-muted-foreground mb-3" aria-hidden="true" />
                                <h3 className="font-semibold mb-2">No Payment Data</h3>
                                <p className="text-sm text-muted-foreground">
                                    Payment breakdown will appear after sales are recorded.
                                </p>
                            </div>
                        ) : (
                            <>
                                <div className="h-[250px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={salesByPaymentData.data}
                                                cx="50%"
                                                cy="50%"
                                                labelLine={false}
                                                outerRadius={80}
                                                fill="#8884d8"
                                                dataKey="total_amount"
                                                nameKey="payment_method"
                                            >
                                                {salesByPaymentData.data.map((_entry: any, index: number) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip formatter={(value: number) => formatCurrency(value)} />
                                            <Legend />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <Separator className="my-4" />
                                <div className="space-y-2">
                                    {salesByPaymentData.data.map((method: any, i: number) => (
                                        <div key={i} className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">{method.payment_method}</span>
                                            <span className="font-semibold">{formatCurrency(method.total_amount)}</span>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Top Products</CardTitle>
                    <CardDescription>
                        Best performing products by revenue
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading || topProductsData.isLoading ? (
                        <div className="space-y-4">
                            {Array.from({ length: 3 }).map((_, i) => (
                                <div key={i} className="flex items-center gap-4">
                                    <Skeleton className="h-12 flex-1" />
                                    <Skeleton className="h-6 w-24" />
                                </div>
                            ))}
                        </div>
                    ) : !topProductsData.data || topProductsData.data.length === 0 ? (
                        <div className="flex flex-col items-center justify-center text-center py-8 px-4">
                            <ShoppingBag className="h-10 w-10 text-muted-foreground mb-3" aria-hidden="true" />
                            <h3 className="font-semibold mb-2">No Product Sales</h3>
                            <p className="text-sm text-muted-foreground max-w-md">
                                Product performance data will appear once transactions are completed.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {topProductsData.data.map((product: any, i: number) => (
                                <div key={i} className="flex items-center gap-4">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-sm font-semibold">
                                        {i + 1}
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <p className="text-sm font-medium leading-none">
                                            {product.product_name} - {product.variant_name}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            {product.total_quantity_sold} units sold
                                        </p>
                                    </div>
                                    <div className="font-semibold">
                                        {formatCurrency(product.total_revenue)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
