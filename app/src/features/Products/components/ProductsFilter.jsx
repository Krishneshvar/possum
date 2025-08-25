import { useDispatch, useSelector } from "react-redux"
import GenericFilter from "./GenericFilter"
import { useGetCategoriesQuery } from "@/services/categoriesApi"
import { setFilter } from "../productsSlice"
import {
  stockStatusFilter,
  statusFilter,
  categoryFilter,
} from "./productsFilterConfig"

export default function ProductsFilter() {
  const dispatch = useDispatch()
  const { filters } = useSelector((state) => state.products)
  const { data: categories = [] } = useGetCategoriesQuery()

  const handleFilterChange = (name, value) => {
    dispatch(setFilter({ name, value }))
  }

  const handleClearAllFilters = () => {
    dispatch(setFilter({ name: "stockStatus", value: [] }))
    dispatch(setFilter({ name: "categories", value: [] }))
    dispatch(setFilter({ name: "status", value: [] }))
  }

  const filtersConfig = [
    statusFilter,
    stockStatusFilter,
    categoryFilter(categories),
  ]

  const activeFilters = {
    status: filters.status || [],
    stockStatus: filters.stockStatus || [],
    categories: filters.categories || [],
  }

  return (
    <GenericFilter
      filtersConfig={filtersConfig}
      activeFilters={activeFilters}
      onFilterChange={handleFilterChange}
      onClearAll={handleClearAllFilters}
    />
  )
}
