import { Download, Package, Plus, Upload } from "lucide-react"
import { useEffect, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { useGetProductsQuery } from "@/services/productsApi"
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
      label: "Categories",
      url: "/products/categories",
      icon: Package,
    },
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
  const { data: productsData, error: productsError, isLoading: productsLoading } = useGetProductsQuery({ page: 1, limit: 9999 });
  const { data: categories, error: categoriesError } = useGetCategoriesQuery(undefined);

  const statsData = useMemo(() => {
    if (productsLoading || !productsData) {
      return [
        { title: 'Total Products', icon: Box, color: 'text-blue-500', todayValue: 0 },
        { title: 'Active Products', icon: Layers, color: 'text-purple-500', todayValue: 0 },
        { title: 'Categories', icon: Tags, color: 'text-green-500', todayValue: 0 },
        { title: 'Low Stock', icon: AlertTriangle, color: 'text-orange-500', todayValue: 0 },
      ];
    }

    const products = productsData.products || [];
    const activeProducts = products.filter(p => p.status === 'active').length;
    const lowStock = products.filter(p => (p.stock ?? 0) <= (p.stock_alert_cap ?? 10)).length;

    return [
      { title: 'Total Products', icon: Box, color: 'text-blue-500', todayValue: products.length },
      { title: 'Active Products', icon: Layers, color: 'text-purple-500', todayValue: activeProducts },
      { title: 'Categories', icon: Tags, color: 'text-green-500', todayValue: categories?.length || 0 },
      { title: 'Low Stock', icon: AlertTriangle, color: 'text-orange-500', todayValue: lowStock },
    ];
  }, [productsData, categories, productsLoading]);

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

  if (productsError || categoriesError) {
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

      <ProductsTable />
    </div>
  )
}
