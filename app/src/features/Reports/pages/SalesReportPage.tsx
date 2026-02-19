import { useState, useEffect } from 'react';
import { format } from 'date-fns';
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
    DollarSign,
    TrendingUp,
    CreditCard,
    Calendar as CalendarIcon,
    AlertCircle,
    RefreshCw,
    FileText,
    ShoppingBag
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { useCurrency } from '@/hooks/useCurrency';

import {
    useGetDailyReportQuery,
    useGetMonthlyReportQuery,
    useGetYearlyReportQuery,
    useGetTopProductsQuery,
    useGetSalesByPaymentMethodQuery
} from '@/services/reportsApi';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function SalesReportPage() {
    const currency = useCurrency();
    const [reportType, setReportType] = useState('monthly');
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
    const [selectedMonth, setSelectedMonth] = useState((new Date().getMonth() + 1).toString());
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);

    const dailyQuery = useGetDailyReportQuery(selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '', { skip: reportType !== 'daily' || !selectedDate });
    const monthlyQuery = useGetMonthlyReportQuery({ year: selectedYear, month: selectedMonth }, { skip: reportType !== 'monthly' });
    const yearlyQuery = useGetYearlyReportQuery(selectedYear, { skip: reportType !== 'yearly' });

    const currentData: any = reportType === 'daily' ? dailyQuery.data :
        reportType === 'monthly' ? monthlyQuery.data :
            yearlyQuery.data;

    const startDate = reportType === 'yearly' ? `${selectedYear}-01-01` :
        reportType === 'monthly' ? `${selectedYear}-${selectedMonth.padStart(2, '0')}-01` :
            selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '';

    const endDate = reportType === 'yearly' ? `${selectedYear}-12-31` :
        reportType === 'monthly' ? `${selectedYear}-${selectedMonth.padStart(2, '0')}-31` :
            selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '';

    const topProductsData = useGetTopProductsQuery({ startDate, endDate, limit: 5 });
    const salesByPaymentData = useGetSalesByPaymentMethodQuery({ startDate, endDate });

    const summary = currentData?.summary || {};
    const chartData = currentData?.breakdown || [];

    const formatCurrency = (val: number) => `${currency}${val?.toFixed(2)}`;

    const isLoading = reportType === 'daily' ? dailyQuery.isLoading :
        reportType === 'monthly' ? monthlyQuery.isLoading : yearlyQuery.isLoading;
    const isError = reportType === 'daily' ? dailyQuery.isError :
        reportType === 'monthly' ? monthlyQuery.isError : yearlyQuery.isError;

    const refetch = () => {
        if (reportType === 'daily') dailyQuery.refetch();
        else if (reportType === 'monthly') monthlyQuery.refetch();
        else yearlyQuery.refetch();
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
                    <h1 className="text-3xl font-bold tracking-tight">Sales Report</h1>
                    <p className="text-muted-foreground mt-1">Analyze sales performance and trends</p>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={refetch}
                    disabled={isLoading}
                    aria-label="Refresh report data"
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
                            {reportType === 'daily' && (
                                <div className="flex-1 min-w-[200px]">
                                    <Label htmlFor="date-picker" className="text-sm mb-1.5 block">Select Date</Label>
                                    <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                                        <PopoverTrigger asChild>
                                            <Button
                                                id="date-picker"
                                                variant="outline"
                                                aria-label="Select date for daily report"
                                                className={cn(
                                                    "w-full justify-start text-left font-normal",
                                                    !selectedDate && "text-muted-foreground"
                                                )}
                                            >
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar
                                                mode="single"
                                                selected={selectedDate}
                                                onSelect={(date) => {
                                                    if (date) {
                                                        setSelectedDate(date);
                                                        setIsCalendarOpen(false);
                                                    }
                                                }}
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </div>
                            )}

                            {reportType === 'monthly' && (
                                <>
                                    <div className="flex-1 min-w-[150px]">
                                        <Label htmlFor="month-select" className="text-sm mb-1.5 block">Month</Label>
                                        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                                            <SelectTrigger id="month-select">
                                                <SelectValue placeholder="Month" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                                                    <SelectItem key={m} value={m.toString()}>
                                                        {format(new Date(2000, m - 1, 1), 'MMMM')}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="w-32">
                                        <Label htmlFor="year-input-monthly" className="text-sm mb-1.5 block">Year</Label>
                                        <Input
                                            id="year-input-monthly"
                                            type="number"
                                            value={selectedYear}
                                            onChange={(e) => setSelectedYear(e.target.value)}
                                            min="2000"
                                            max="2100"
                                            aria-label="Year for monthly report"
                                        />
                                    </div>
                                </>
                            )}

                            {reportType === 'yearly' && (
                                <div className="w-32">
                                    <Label htmlFor="year-input-yearly" className="text-sm mb-1.5 block">Year</Label>
                                    <Input
                                        id="year-input-yearly"
                                        type="number"
                                        value={selectedYear}
                                        onChange={(e) => setSelectedYear(e.target.value)}
                                        min="2000"
                                        max="2100"
                                        aria-label="Year for yearly report"
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {isError && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                        Failed to load report data. Please try refreshing.
                    </AlertDescription>
                </Alert>
            )}

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <Skeleton className="h-8 w-32" />
                        ) : (
                            <div className="text-2xl font-bold">{formatCurrency(summary.total_sales || 0)}</div>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">Gross revenue including tax</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Net Sales</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <Skeleton className="h-8 w-32" />
                        ) : (
                            <div className="text-2xl font-bold">{formatCurrency((summary.total_sales || 0) - (summary.total_tax || 0))}</div>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">Revenue after tax deduction</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Transactions</CardTitle>
                        <CreditCard className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <Skeleton className="h-8 w-20" />
                        ) : (
                            <div className="text-2xl font-bold">{summary.total_transactions || 0}</div>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">Completed orders</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Average Sale</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <Skeleton className="h-8 w-28" />
                        ) : (
                            <div className="text-2xl font-bold">
                                {formatCurrency(summary.total_transactions ? (summary.total_sales / summary.total_transactions) : 0)}
                            </div>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">Per transaction</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Sales Trend</CardTitle>
                        <CardDescription>
                            {reportType === 'daily' ? 'Hourly breakdown not available' :
                             reportType === 'monthly' ? 'Daily sales for selected month' :
                             'Monthly sales for selected year'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pl-2">
                        {isLoading ? (
                            <div className="h-[350px] flex items-center justify-center">
                                <Skeleton className="h-full w-full" />
                            </div>
                        ) : reportType === 'daily' ? (
                            <div className="h-[350px] flex flex-col items-center justify-center text-center px-4">
                                <FileText className="h-12 w-12 text-muted-foreground mb-4" aria-hidden="true" />
                                <h3 className="font-semibold text-lg mb-2">Summary View Only</h3>
                                <p className="text-sm text-muted-foreground max-w-sm">
                                    Daily reports show key metrics. Switch to Monthly or Yearly to view trends over time.
                                </p>
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
                                                {salesByPaymentData.data.map((entry: any, index: number) => (
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
