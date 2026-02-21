import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { LucideIcon } from 'lucide-react';

interface ReportMetricCardProps {
    title: string;
    value: string;
    description: string;
    icon: LucideIcon;
    isLoading: boolean;
}

export function ReportMetricCard({ title, value, description, icon: Icon, isLoading }: ReportMetricCardProps) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <Skeleton className="h-8 w-32" />
                ) : (
                    <div className="text-2xl font-bold">{value}</div>
                )}
                <p className="text-xs text-muted-foreground mt-1">{description}</p>
            </CardContent>
        </Card>
    );
}
