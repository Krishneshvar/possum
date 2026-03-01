import { Download, Package, Plus, Upload } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useGetProductStatsQuery } from "@/services/productsApi"
import { useGetCategoriesQuery } from "@/services/categoriesApi"

import ProductsTable from "../components/ProductsTable"
import GenericPageHeader from "@/components/common/GenericPageHeader"
import { KeyboardShortcut } from "@/components/common/KeyboardShortcut"
import { StatCards } from "@/components/common/StatCards"
import { Box, Layers, Tags, AlertTriangle } from "lucide-react"

const productActions = {
  primary: {
    label: "Add Product",
    url: "/products/add",
    icon: Plus,
  },
  secondary: [
    {
      label: "Export",
      url: "/products/export",
      icon: Download,
    },
    {
      label: "Import",
      url: "/products/import",
      icon: Upload,
    }
  ],
};

export default function ProductsPage() {
  const navigate = useNavigate();
  const { data: stats, isLoading: statsLoading, error: statsError, refetch: refetchStats } = useGetProductStatsQuery();
  const { data: categories, error: categoriesError, refetch: refetchCategories } = useGetCategoriesQuery(undefined);

  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleRefresh = () => {
    refetchStats();
    refetchCategories();
    setRefreshTrigger(prev => prev + 1);
  };

  const statsData = useMemo(() => {
    if (statsLoading || !stats) {
      return [
        { title: 'Total Products', icon: Box, color: 'text-blue-500', todayValue: 0 },
        { title: 'Active Products', icon: Layers, color: 'text-purple-500', todayValue: 0 },
        { title: 'Categories', icon: Tags, color: 'text-green-500', todayValue: 0 },
        { title: 'Low Stock', icon: AlertTriangle, color: 'text-orange-500', todayValue: 0 },
      ];
    }

    return [
      { title: 'Total Products', icon: Box, color: 'text-blue-500', todayValue: stats.totalProducts || 0 },
      { title: 'Active Products', icon: Layers, color: 'text-purple-500', todayValue: stats.activeProducts || 0 },
      { title: 'Categories', icon: Tags, color: 'text-green-500', todayValue: categories?.length || 0 },
      { title: 'Low Stock', icon: AlertTriangle, color: 'text-orange-500', todayValue: stats.lowStockProducts || 0 },
    ];
  }, [stats, categories, statsLoading]);

  // Keyboard shortcut: Ctrl/Cmd + K to add new product
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        navigate('/products/add');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  if (statsError || categoriesError) {
    return (
      <div className="space-y-4 sm:space-y-6 p-2 sm:p-4 lg:p-2 mb-6 w-full max-w-7xl overflow-hidden mx-auto">
        <div className="text-red-500">Error loading products. Please try again later.</div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-2 sm:p-4 lg:p-2 mb-6 w-full max-w-7xl overflow-hidden mx-auto">
      <div className="w-full">
        <GenericPageHeader
          headerIcon={<Package className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />}
          headerLabel={"Products"}
          actions={productActions}
        />
        <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
          <span>Quick add:</span>
          <KeyboardShortcut keys={["Ctrl", "K"]} />
        </div>
      </div>

      <StatCards cardData={statsData} />

      <ProductsTable refreshTrigger={refreshTrigger} onRefresh={handleRefresh} isRefreshing={statsLoading} />
    </div>
  )
}
