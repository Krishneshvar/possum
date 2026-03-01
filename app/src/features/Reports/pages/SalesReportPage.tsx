import { BarChart3, AlertCircle, RefreshCw } from "lucide-react";
import { useState } from 'react';
import { format, subDays } from 'date-fns';
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import DateRangeFilter from '@/components/common/DateRangeFilter';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { useReportData } from '../hooks/useReportData';
import { cn } from "@/lib/utils";
import { useGetPaymentMethodsQuery } from '@/services/salesApi';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export default function SalesReportPage() {
    const [reportType, setReportType] = useState('daily');
    const [dateRange, setDateRange] = useState<{ startDate: string | null; endDate: string | null }>({
        startDate: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
        endDate: format(new Date(), 'yyyy-MM-dd'),
    });
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('all');

    const { data: paymentMethods } = useGetPaymentMethodsQuery({});

    const activeStartDate = dateRange.startDate || format(subDays(new Date(), 30), 'yyyy-MM-dd');
    const activeEndDate = dateRange.endDate || format(new Date(), 'yyyy-MM-dd');

    const { isLoading, isError, refetch: refetchReport } = useReportData({
        reportType: reportType as 'daily' | 'monthly' | 'yearly',
        startDate: activeStartDate,
        endDate: activeEndDate,
        paymentMethod: selectedPaymentMethod === 'all' ? undefined : selectedPaymentMethod
    });

    return (
        <div className="space-y-6 pb-8">
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Sales Report</h1>
                    <p className="text-muted-foreground mt-1">High-level sales overview and period filtering</p>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => refetchReport()}
                    disabled={isLoading}
                >
                    <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
                    Refresh
                </Button>
            </div>

            <Card>
                <CardContent>
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-4">
                            <Label className="text-sm font-medium whitespace-nowrap">Report Period</Label>
                            <Tabs value={reportType} onValueChange={setReportType} className="flex-1">
                                <TabsList className="grid max-w-md grid-cols-3">
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

                            <div className="w-full sm:w-[200px]">
                                <Label className="text-sm mb-1.5 block">Payment Mode</Label>
                                <Select value={selectedPaymentMethod} onValueChange={setSelectedPaymentMethod}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="All Payment Modes" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Payment Modes</SelectItem>
                                        {paymentMethods?.map((method: any) => (
                                            <SelectItem key={method.id} value={method.id.toString()}>
                                                {method.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
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

            <div className="flex flex-col items-center justify-center py-24 text-center border rounded-lg bg-muted/20">
                <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
                <h2 className="text-xl font-semibold">Sales Summary Overview</h2>
                <p className="text-muted-foreground max-w-sm mt-2">
                    No reports available for selected filters.
                </p>
            </div>
        </div>
    );
}
