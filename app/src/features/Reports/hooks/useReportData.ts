import { format } from 'date-fns';
import {
    useGetDailyReportQuery,
    useGetMonthlyReportQuery,
    useGetYearlyReportQuery,
} from '@/services/reportsApi';

type ReportType = 'daily' | 'monthly' | 'yearly';

interface UseReportDataParams {
    reportType: ReportType;
    selectedDate?: Date;
    selectedMonth: string;
    selectedYear: string;
}

export function useReportData({ reportType, selectedDate, selectedMonth, selectedYear }: UseReportDataParams) {
    const dailyQuery = useGetDailyReportQuery(
        selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '',
        { skip: reportType !== 'daily' || !selectedDate }
    );
    
    const monthlyQuery = useGetMonthlyReportQuery(
        { year: selectedYear, month: selectedMonth },
        { skip: reportType !== 'monthly' }
    );
    
    const yearlyQuery = useGetYearlyReportQuery(
        selectedYear,
        { skip: reportType !== 'yearly' }
    );

    const currentQuery = reportType === 'daily' ? dailyQuery :
        reportType === 'monthly' ? monthlyQuery : yearlyQuery;

    const refetch = () => {
        if (reportType === 'daily') dailyQuery.refetch();
        else if (reportType === 'monthly') monthlyQuery.refetch();
        else yearlyQuery.refetch();
    };

    return {
        data: currentQuery.data,
        isLoading: currentQuery.isLoading,
        isError: currentQuery.isError,
        refetch
    };
}
