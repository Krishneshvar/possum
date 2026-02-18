import { Download, Package, Plus, Upload } from "lucide-react"
import { useEffect } from "react"
import { useNavigate } from "react-router-dom"

import ProductsTable from "../components/ProductsTable"
import GenericPageHeader from "@/components/common/GenericPageHeader"
import { KeyboardShortcut } from "@/components/common/KeyboardShortcut"

import { StatCards } from "@/components/common/StatCards"
import { productsStatsData } from "../data/productsStatsData.js"

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

      <StatCards cardData={productsStatsData} />

      <ProductsTable />
    </div>
  )
}
