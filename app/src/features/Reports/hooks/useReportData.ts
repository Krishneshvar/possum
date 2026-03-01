
import {
    useGetDailyReportQuery,
    useGetMonthlyReportQuery,
    useGetYearlyReportQuery,
} from '@/services/reportsApi';

type ReportType = 'daily' | 'monthly' | 'yearly';

interface UseReportDataParams {
    reportType: ReportType;
    startDate: string;
    endDate: string;
    paymentMethod?: string;
}

export function useReportData({ reportType, startDate, endDate, paymentMethod }: UseReportDataParams) {
    const dailyQuery = useGetDailyReportQuery(
        { startDate, endDate, paymentMethod },
        { skip: reportType !== 'daily' || !startDate || !endDate }
    );

    const monthlyQuery = useGetMonthlyReportQuery(
        { startDate, endDate, paymentMethod },
        { skip: reportType !== 'monthly' || !startDate || !endDate }
    );

    const yearlyQuery = useGetYearlyReportQuery(
        { startDate, endDate, paymentMethod },
        { skip: reportType !== 'yearly' || !startDate || !endDate }
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
