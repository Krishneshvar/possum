import React from 'react';
import { Link } from 'react-router-dom';
import { 
  TrendingUp, 
  TrendingDown,
  ShoppingCart, 
  Package, 
  AlertTriangle,
  ArrowRight,
  DollarSign,
  Activity,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useGetDailyStatsQuery, useGetTopProductsQuery, useGetLowStockItemsQuery } from '@/services/dashboardApi';
import { useCurrency } from '@/hooks/useCurrency';
import { getTodayDate } from '@/utils/date.utils';

export default function DashboardHome() {
  const currency = useCurrency();
  const today = getTodayDate();
  
  const { data: dailyStats, isLoading: statsLoading, isError: statsError, refetch: refetchStats } = useGetDailyStatsQuery(today);
  const { data: topProducts, isLoading: productsLoading, isError: productsError, refetch: refetchProducts } = useGetTopProductsQuery({
    startDate: today,
    endDate: today,
    limit: 5
  });
  const { data: lowStockItems, isLoading: stockLoading, isError: stockError } = useGetLowStockItemsQuery();

  const formatCurrency = (value: number) => 
    `${currency}${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const handleRefresh = () => {
    refetchStats();
    refetchProducts();
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            Welcome back! Here's your business overview for today.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={statsLoading || productsLoading}
          className="gap-2 self-start"
          aria-label="Refresh dashboard data"
        >
          <RefreshCw className={`h-4 w-4 ${statsLoading || productsLoading ? 'animate-spin' : ''}`} aria-hidden="true" />
          Refresh
        </Button>
      </div>

      {/* Stats Grid */}
      <section aria-label="Today's statistics">
        {statsError ? (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" aria-hidden="true" />
            <AlertDescription>
              Failed to load statistics. Please try refreshing.
            </AlertDescription>
          </Alert>
        ) : (
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
        )}
      </section>

      {/* Two Column Layout */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Top Products */}
        <section aria-labelledby="top-products-title">
          <Card>
            <CardHeader>
              <CardTitle id="top-products-title">Top Products Today</CardTitle>
              <CardDescription>Best performing items by revenue</CardDescription>
            </CardHeader>
            <CardContent>
              {productsLoading ? (
                <div className="space-y-3" role="status" aria-label="Loading top products">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : productsError ? (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                  <AlertDescription>
                    Failed to load top products. Please try refreshing.
                  </AlertDescription>
                </Alert>
              ) : topProducts && topProducts.length > 0 ? (
                <div className="space-y-3">
                  {topProducts.map((product: any, index: number) => (
                    <div
                      key={product.id}
                      className="flex items-center justify-between p-3 rounded-lg border bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        <div 
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm"
                          aria-label={`Rank ${index + 1}`}
                        >
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{product.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {product.quantity} sold
                          </p>
                        </div>
                      </div>
                      <p className="font-semibold" aria-label={`Revenue: ${formatCurrency(product.revenue)}`}>
                        {formatCurrency(product.revenue)}
                      </p>
                    </div>
                  ))}
                  <Button variant="ghost" size="sm" asChild className="w-full mt-2">
                    <Link to="/reports/sales" className="gap-2">
                      View Full Report <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground" role="status">
                  <Package className="h-12 w-12 mx-auto mb-3 opacity-50" aria-hidden="true" />
                  <p className="text-sm mb-2">No sales recorded today</p>
                  <p className="text-xs mb-4">Start by creating your first sale</p>
                  <Button variant="default" size="sm" asChild>
                    <Link to="/sales">Create First Sale</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Alerts & Quick Access */}
        <div className="space-y-4">
          {/* Low Stock Alert */}
          <section aria-labelledby="inventory-alerts-title">
            {stockLoading ? (
              <Skeleton className="h-16 w-full" />
            ) : stockError ? (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                <AlertDescription>
                  Failed to load inventory alerts.
                </AlertDescription>
              </Alert>
            ) : lowStockItems && lowStockItems.length > 0 ? (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                <AlertDescription className="flex items-center justify-between gap-2">
                  <span>
                    <strong>{lowStockItems.length}</strong> item{lowStockItems.length > 1 ? 's' : ''} low on stock
                  </span>
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/inventory" aria-label="View low stock items in inventory">
                      View Items
                    </Link>
                  </Button>
                </AlertDescription>
              </Alert>
            ) : null}
          </section>

          {/* Quick Access Card */}
          <section aria-labelledby="quick-access-title">
            <Card>
              <CardHeader>
                <CardTitle id="quick-access-title">Quick Access</CardTitle>
                <CardDescription>Frequently used actions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="default" size="sm" asChild className="w-full justify-start gap-2">
                  <Link to="/sales">
                    <ShoppingCart className="h-4 w-4" aria-hidden="true" />
                    New Sale
                  </Link>
                </Button>
                <Button variant="outline" size="sm" asChild className="w-full justify-start gap-2">
                  <Link to="/products/add">
                    <Package className="h-4 w-4" aria-hidden="true" />
                    Add Product
                  </Link>
                </Button>
                <Button variant="outline" size="sm" asChild className="w-full justify-start gap-2">
                  <Link to="/inventory">
                    <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                    Manage Inventory
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </section>
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
  const trendLabel = trend !== undefined && trend !== 0 
    ? `${trend > 0 ? 'Up' : 'Down'} ${Math.abs(trend)}% from yesterday`
    : undefined;

  return (
    <Card>
      <CardHeader>
        <CardDescription className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <span>{title}</span>
        </CardDescription>
        {loading ? (
          <Skeleton className="h-8 w-32" role="status" aria-label={`Loading ${title}`} />
        ) : (
          <div className="flex items-baseline gap-2">
            <CardTitle className="text-2xl font-bold" aria-label={`${title}: ${value}`}>
              {value}
            </CardTitle>
            {trend !== undefined && trend !== 0 && (
              <span 
                className={`flex items-center text-xs font-medium ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}
                aria-label={trendLabel}
              >
                {trend > 0 ? <TrendingUp className="h-3 w-3" aria-hidden="true" /> : <TrendingDown className="h-3 w-3" aria-hidden="true" />}
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
