import { Download, Package, Plus, Upload } from "lucide-react"

import ProductsTable from "../components/ProductsTable"
import GenericPageHeader from "@/components/common/GenericPageHeader"

import { StatCards } from "@/components/common/StatCards"
import { productsStatsConfig } from "../data/productsStatsData.js"

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
  return (
    <div className="space-y-4 sm:space-y-6 p-2 sm:p-4 lg:p-2 mb-6 w-full max-w-7xl overflow-hidden mx-auto">
      <div className="w-full">
        <GenericPageHeader
          headerIcon={<Package className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />}
          headerLabel={"Products"}
          actions={productActions}
        />
      </div>

      <StatCards cardData={productsStatsConfig} />

      <ProductsTable />
    </div>
  )
}
