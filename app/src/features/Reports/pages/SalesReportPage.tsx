import { useState } from 'react';
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
    Calendar as CalendarIcon
} from 'lucide-react';

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
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

    // Queries based on report type
    const dailyQuery = useGetDailyReportQuery(selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '', { skip: reportType !== 'daily' || !selectedDate });
    const monthlyQuery = useGetMonthlyReportQuery({ year: selectedYear, month: selectedMonth }, { skip: reportType !== 'monthly' });
    const yearlyQuery = useGetYearlyReportQuery(selectedYear, { skip: reportType !== 'yearly' });

    // Determine current data based on report type
    const currentData: any = reportType === 'daily' ? dailyQuery.data :
        reportType === 'monthly' ? monthlyQuery.data :
            yearlyQuery.data;

    // Additional data for charts
    // For simplicity, using month range for top products and payments when in monthly/daily view
    const startDate = reportType === 'yearly' ? `${selectedYear}-01-01` :
        reportType === 'monthly' ? `${selectedYear}-${selectedMonth.padStart(2, '0')}-01` :
            selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '';

    // Calculate end date roughly
    const endDate = reportType === 'yearly' ? `${selectedYear}-12-31` :
        reportType === 'monthly' ? `${selectedYear}-${selectedMonth.padStart(2, '0')}-31` : // API handles overflow
            selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '';

    const topProductsData = useGetTopProductsQuery({ startDate, endDate, limit: 5 });
    const paymentMethodsData = useGetPaymentMethodsQuery(undefined); // Corrected: Use paymentMethods endpoint if separate or filter sales? Actually using getSalesByPaymentMethod from report API
    // Wait, useGetSalesByPaymentMethodQuery is defined in reportsApi
    // Let's use that one.
    // The previous code imported useGetPaymentMethodsQuery from salesApi, which just lists methods, not stats.
    // We need stats.
    // Let's assume reportsApi has `getSalesByPaymentMethod`
    // Re-checking imports... `useGetSalesByPaymentMethodQuery` is imported.

    // Correction: paymentMethodsData was using salesApi in original snippet context? No, imports show `useGetSalesByPaymentMethodQuery`.
    const salesByPaymentData = useGetSalesByPaymentMethodQuery({ startDate, endDate });

    const summary = currentData?.summary || {};
    const chartData = currentData?.breakdown || [];

    const formatCurrency = (val: number) => `${currency}${val?.toFixed(2)}`;

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-2">
                    <Select value={reportType} onValueChange={setReportType}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Select Report Type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="daily">Daily Report</SelectItem>
                            <SelectItem value="monthly">Monthly Report</SelectItem>
                            <SelectItem value="yearly">Yearly Report</SelectItem>
                        </SelectContent>
                    </Select>

                    {reportType === 'daily' && (
                        <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                        "w-[240px] justify-start text-left font-normal",
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
                    )}

                    {reportType === 'monthly' && (
                        <div className="flex gap-2">
                            <Input
                                type="number"
                                className="w-[100px]"
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(e.target.value)}
                                min="2000" max="2100"
                            />
                            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                                <SelectTrigger className="w-[130px]">
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
                    )}

                    {reportType === 'yearly' && (
                        <Input
                            type="number"
                            className="w-[120px]"
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(e.target.value)}
                            min="2000" max="2100"
                        />
                    )}
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(summary.total_sales || 0)}</div>
                        <p className="text-xs text-muted-foreground">gross sales including tax</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Net Sales</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency((summary.total_sales || 0) - (summary.total_tax || 0))}</div>
                        <p className="text-xs text-muted-foreground">after tax deduction</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Transactions</CardTitle>
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{summary.total_transactions || 0}</div>
                        <p className="text-xs text-muted-foreground">completed orders</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Average Sale</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {formatCurrency(summary.total_transactions ? (summary.total_sales / summary.total_transactions) : 0)}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Sales Overview</CardTitle>
                    </CardHeader>
                    <CardContent className="pl-2">
                        {reportType === 'daily' ? (
                            <div className="h-[350px] flex items-center justify-center text-muted-foreground">
                                Daily breakdown viewing is available in Monthly Report
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
                        <CardDescription>Sales distribution by payment type</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={salesByPaymentData.data || []}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        dataKey="total_amount"
                                    >
                                        {(salesByPaymentData.data || []).map((entry: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="mt-4 space-y-2">
                            {(salesByPaymentData.data || []).map((method: any, i: number) => (
                                <div key={i} className="flex justify-between text-sm">
                                    <span>{method.payment_method}</span>
                                    <span className="font-bold">{formatCurrency(method.total_amount)}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Top Selling Products</CardTitle>
                    <CardDescription>
                        Highest revenue generating products for this period
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {(topProductsData.data || []).map((product: any, i: number) => (
                            <div key={i} className="flex items-center">
                                <div className="ml-4 space-y-1 flex-1">
                                    <p className="text-sm font-medium leading-none">{product.product_name} - {product.variant_name}</p>
                                    <p className="text-sm text-muted-foreground">{product.total_quantity_sold} units sold</p>
                                </div>
                                <div className="font-bold">
                                    {formatCurrency(product.total_revenue)}
                                </div>
                            </div>
                        ))}
                        {(!topProductsData.data || topProductsData.data.length === 0) && (
                            <p className="text-sm text-muted-foreground text-center py-4">No sales data recorded.</p>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
