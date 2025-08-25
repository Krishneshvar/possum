import { Download, Package, Plus, Upload } from "lucide-react"

import ProductsTable from "../components/ProductsTable"
import { useGetProductsQuery } from "@/services/productsApi"
import GenericPageHeader from "@/components/common/GenericPageHeader"

import { StatCards } from "@/components/common/stat-cards"
import { productsStatsData } from "../data/productsStatsData.js"

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
  const { refetch } = useGetProductsQuery()

  return (
    <div className="space-y-4 sm:space-y-6 sm:p-4 lg:p-2 mb-6 w-full max-w-full overflow-hidden">
      <div className="w-full">
        <GenericPageHeader
          headerIcon={<Package className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />}
          headerLabel={"Products"}
          actions={productActions}
        />
      </div>

      <div className="w-full">
        <StatCards cardData={productsStatsData} />
      </div>

      <div className="w-full">
        <ProductsTable onProductDeleted={refetch} />
      </div>
    </div>
  )
}
