import React from 'react';
import { Link } from 'react-router-dom';
import { 
  TrendingUp, 
  TrendingDown,
  ShoppingCart, 
  Package, 
  Users, 
  FileText,
  AlertTriangle,
  ArrowRight,
  DollarSign,
  Activity
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useGetDailyStatsQuery, useGetTopProductsQuery, useGetLowStockItemsQuery } from '@/services/dashboardApi';
import { useCurrency } from '@/hooks/useCurrency';

export default function DashboardHome() {
  const currency = useCurrency();
  const today = new Date().toISOString().split('T')[0];
  
  const { data: dailyStats, isLoading: statsLoading } = useGetDailyStatsQuery(today);
  const { data: topProducts, isLoading: productsLoading } = useGetTopProductsQuery({
    startDate: today,
    endDate: today,
    limit: 5
  });
  const { data: lowStockItems, isLoading: stockLoading } = useGetLowStockItemsQuery();

  const quickActions = [
    { label: 'New Sale', to: '/sales', icon: ShoppingCart, variant: 'default' as const },
    { label: 'Products', to: '/products', icon: Package, variant: 'outline' as const },
    { label: 'Customers', to: '/customers', icon: Users, variant: 'outline' as const },
    { label: 'Reports', to: '/reports', icon: FileText, variant: 'outline' as const },
  ];

  const formatCurrency = (value: number) => 
    `${currency}${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back! Here's what's happening today.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {quickActions.map((action) => (
            <Button
              key={action.to}
              variant={action.variant}
              size="sm"
              asChild
              className="gap-2"
            >
              <Link to={action.to}>
                <action.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{action.label}</span>
              </Link>
            </Button>
          ))}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Today's Sales"
          value={formatCurrency(dailyStats?.totalSales || 0)}
          icon={DollarSign}
          loading={statsLoading}
          trend={dailyStats?.salesTrend}
          description="Total revenue today"
        />
        <StatCard
          title="Transactions"
          value={dailyStats?.transactionCount || 0}
          icon={Activity}
          loading={statsLoading}
          trend={dailyStats?.transactionTrend}
          description="Completed sales"
        />
        <StatCard
          title="Items Sold"
          value={dailyStats?.itemsSold || 0}
          icon={Package}
          loading={statsLoading}
          description="Products moved today"
        />
        <StatCard
          title="Avg. Transaction"
          value={formatCurrency(dailyStats?.averageTransaction || 0)}
          icon={TrendingUp}
          loading={statsLoading}
          description="Per sale average"
        />
      </div>

      {/* Two Column Layout */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle>Top Products Today</CardTitle>
            <CardDescription>Best performing items</CardDescription>
          </CardHeader>
          <CardContent>
            {productsLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : topProducts && topProducts.length > 0 ? (
              <div className="space-y-3">
                {topProducts.map((product: any, index: number) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{product.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {product.quantity} sold
                        </p>
                      </div>
                    </div>
                    <p className="font-semibold">{formatCurrency(product.revenue)}</p>
                  </div>
                ))}
                <Button variant="ghost" size="sm" asChild className="w-full mt-2">
                  <Link to="/reports/sales" className="gap-2">
                    View Full Report <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No sales recorded today</p>
                <Button variant="default" size="sm" asChild className="mt-4">
                  <Link to="/sales">Create First Sale</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Alerts & Activity */}
        <div className="space-y-4">
          {/* Low Stock Alert */}
          {!stockLoading && lowStockItems && lowStockItems.length > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                <span>
                  <strong>{lowStockItems.length}</strong> item{lowStockItems.length > 1 ? 's' : ''} low on stock
                </span>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/inventory">View</Link>
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Quick Stats Card */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common tasks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" size="sm" asChild className="w-full justify-start gap-2">
                <Link to="/sales/history">
                  <FileText className="h-4 w-4" />
                  View Sales History
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild className="w-full justify-start gap-2">
                <Link to="/products/add">
                  <Package className="h-4 w-4" />
                  Add New Product
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild className="w-full justify-start gap-2">
                <Link to="/inventory">
                  <AlertTriangle className="h-4 w-4" />
                  Manage Inventory
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild className="w-full justify-start gap-2">
                <Link to="/reports">
                  <TrendingUp className="h-4 w-4" />
                  View All Reports
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  loading?: boolean;
  trend?: number;
  description?: string;
}

function StatCard({ title, value, icon: Icon, loading, trend, description }: StatCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardDescription className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <span>{title}</span>
        </CardDescription>
        {loading ? (
          <Skeleton className="h-8 w-32" />
        ) : (
          <div className="flex items-baseline gap-2">
            <CardTitle className="text-2xl font-bold">{value}</CardTitle>
            {trend !== undefined && trend !== 0 && (
              <span className={`flex items-center text-xs font-medium ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {trend > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {Math.abs(trend)}%
              </span>
            )}
          </div>
        )}
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </CardHeader>
    </Card>
  );
}
