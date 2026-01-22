import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear, eachDayOfInterval, eachMonthOfInterval, subDays } from "date-fns";
import {
    useGetDailyReportQuery,
    useGetMonthlyReportQuery,
    useGetYearlyReportQuery,
    useGetTopProductsQuery,
    useGetSalesByPaymentMethodQuery
} from "@/services/reportsApi";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { CalendarIcon, CreditCard, DollarSign, TrendingUp, Package, Loader2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export default function SalesReportPage() {
    const [reportType, setReportType] = useState('daily');
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
    const [selectedMonth, setSelectedMonth] = useState((new Date().getMonth() + 1).toString());
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);

    // Calculate start/end dates for auxiliary queries (payment methods, top products)
    const [dateRange, setDateRange] = useState({ start: '', end: '' });

    useEffect(() => {
        let start, end;
        if (reportType === 'daily') {
            start = format(selectedDate, 'yyyy-MM-dd');
            end = format(selectedDate, 'yyyy-MM-dd');
        } else if (reportType === 'monthly') {
            const date = new Date(parseInt(selectedYear), parseInt(selectedMonth) - 1, 1);
            start = format(startOfMonth(date), 'yyyy-MM-dd');
            end = format(endOfMonth(date), 'yyyy-MM-dd');
        } else {
            const date = new Date(parseInt(selectedYear), 0, 1);
            start = format(startOfYear(date), 'yyyy-MM-dd');
            end = format(endOfYear(date), 'yyyy-MM-dd');
        }
        setDateRange({ start, end });
    }, [reportType, selectedDate, selectedYear, selectedMonth]);

    // Queries
    const dailyReport = useGetDailyReportQuery(
        selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '',
        { skip: reportType !== 'daily' || !selectedDate }
    );
    const monthlyReport = useGetMonthlyReportQuery({ year: selectedYear, month: selectedMonth }, { skip: reportType !== 'monthly' });
    const yearlyReport = useGetYearlyReportQuery(selectedYear, { skip: reportType !== 'yearly' });

    // Auxiliary Data
    const paymentMethodsData = useGetSalesByPaymentMethodQuery(
        { startDate: dateRange.start, endDate: dateRange.end },
        { skip: !dateRange.start || !dateRange.end }
    );
    const topProductsData = useGetTopProductsQuery(
        { startDate: dateRange.start, endDate: dateRange.end, limit: 5 },
        { skip: !dateRange.start || !dateRange.end }
    );

    const currentReport = reportType === 'daily' ? dailyReport : (reportType === 'monthly' ? monthlyReport : yearlyReport);

    const isLoading = currentReport.isLoading || paymentMethodsData.isLoading || topProductsData.isLoading;
    const isFetching = currentReport.isFetching || paymentMethodsData.isFetching || topProductsData.isFetching;
    const reportData = currentReport.data || {};
    const summary = reportType === 'daily' ? reportData : reportData.summary || {};
    const breakdown = reportData.breakdown || []; // For charts

    // Format chart data
    let chartData = [];
    if (reportType === 'monthly' && breakdown.length > 0) {
        chartData = breakdown.map(item => ({
            name: format(new Date(item.date), 'dd MMM'),
            sales: item.total_sales
        }));
    } else if (reportType === 'yearly' && breakdown.length > 0) {
        chartData = breakdown.map(item => ({
            name: format(new Date(selectedYear, parseInt(item.month) - 1), 'MMM'),
            sales: item.total_sales
        }));
    }

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount || 0);
    };

    return (
        <div className="space-y-6 container mx-auto pb-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Sales Report</h1>
                    <p className="text-muted-foreground">
                        View your sales performance, breakdowns, and trends.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                    <Select value={reportType} onValueChange={setReportType}>
                        <SelectTrigger className="w-[150px]">
                            <SelectValue placeholder="Report Type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                            <SelectItem value="yearly">Yearly</SelectItem>
                        </SelectContent>
                    </Select>

                    {reportType === 'daily' && (
                        <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                        "w-[200px] justify-start text-left font-normal",
                                        !selectedDate && "text-muted-foreground",
                                        isFetching && "opacity-70"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                                    {isFetching && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
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
                        <div className="text-2xl font-bold">{formatCurrency(summary.total_sales)}</div>
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
                                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                                    <Tooltip formatter={(value) => formatCurrency(value)} />
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
                                        data={paymentMethodsData.data || []}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        dataKey="total_amount"
                                    >
                                        {(paymentMethodsData.data || []).map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value) => formatCurrency(value)} />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="mt-4 space-y-2">
                            {(paymentMethodsData.data || []).map((method, i) => (
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
                        {(topProductsData.data || []).map((product, i) => (
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
