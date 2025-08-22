import { Package } from "lucide-react"

import ProductsTable from "../components/ProductsTable"
import { useGetProductsQuery } from "@/services/productsApi"
import GenericPageHeader from "@/components/common/GenericPageHeader"

import { StatCards } from "@/components/common/stat-cards"
import { productsStatsData } from "../data/productsStatsData.js"

export default function ProductsPage() {
  const { refetch } = useGetProductsQuery()

  return (
    <div className="container mx-auto space-y-4 p-4 sm:space-y-6 sm:p-6 max-w-7xl">
      <GenericPageHeader
        headerIcon={<Package className="h-5 w-5 text-primary" />}
        headerLabel={"Products"}
        headerDescription={"Manage your inventory and product catalog"}
        actionLabel={"Add Product"}
        actionUrl={"/products/add"}
      />

      <StatCards cardData={productsStatsData} />

      <ProductsTable onProductDeleted={refetch} />
    </div>
  )
}
