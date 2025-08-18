import { ChevronDown, Filter, X, Package, Layers, AlertTriangle, XCircle } from "lucide-react"
import { useDispatch, useSelector } from "react-redux"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useGetCategoriesQuery } from "@/services/categoriesApi"
import { setFilter } from "../productsSlice"
import { cn } from "@/lib/utils"

const stockStatusOptions = [
  {
    value: "all",
    label: "All Stock",
    icon: Package,
    color: "text-muted-foreground",
  },
  {
    value: "in-stock",
    label: "In Stock",
    icon: Package,
    color: "text-green-600",
  },
  {
    value: "low-stock",
    label: "Low Stock",
    icon: AlertTriangle,
    color: "text-amber-600",
  },
  {
    value: "out-of-stock",
    label: "Out of Stock",
    icon: XCircle,
    color: "text-red-600",
  },
]

const statusOptions = [
  { value: "all", label: "All Status" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "discontinued", label: "Discontinued" },
]


export default function ProductsFilter() {
  const dispatch = useDispatch()
  const { filters } = useSelector((state) => state.products)
  const { data: categories = [] } = useGetCategoriesQuery()

  const handleStockStatusChange = (value) => {
    dispatch(setFilter({ name: "stockStatus", value }))
  }

  const handleCategoryToggle = (categoryName) => {
    let newCategories = []
    if (filters.categories.includes(categoryName)) {
      newCategories = filters.categories.filter(c => c !== categoryName)
    } else {
      newCategories = [...filters.categories, categoryName]
    }
    dispatch(setFilter({ name: "categories", value: newCategories }))
  }

  const handleStatusChange = (value) => {
    dispatch(setFilter({ name: "status", value }))
  }

  const handleClearAllFilters = () => {
    dispatch(setFilter({ name: "stockStatus", value: "all" }))
    dispatch(setFilter({ name: "categories", value: [] }))
  }

  const selectedStockStatus = stockStatusOptions.find((option) => option.value === filters.stockStatus)

  const isFilterActive =
    filters.stockStatus !== "all" ||
    filters.categories.length > 0 ||
    filters.status !== "all"

  const activeFiltersCount =
    (filters.stockStatus !== "all" ? 1 : 0) +
    filters.categories.length +
    (filters.status !== "all" ? 1 : 0)

  return (
    <div className="flex flex-wrap items-center gap-2 space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Filter className="h-4 w-4" />
          <span>Filters</span>
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="h-5 px-2 text-xs font-medium">
              {activeFiltersCount}
            </Badge>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant={filters.stockStatus !== "all" ? "default" : "outline"}
                size="sm"
                className="h-8 gap-2 text-sm font-medium"
              >
                {selectedStockStatus?.icon && (
                  <selectedStockStatus.icon className={cn("h-4 w-4", selectedStockStatus.color)} />
                )}
                {selectedStockStatus?.label}
                <ChevronDown className="h-3 w-3 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-52" align="start">
              <DropdownMenuLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Stock Status
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup value={filters.stockStatus} onValueChange={handleStockStatusChange}>
                {stockStatusOptions.map((option) => {
                  const IconComponent = option.icon
                  return (
                    <DropdownMenuRadioItem
                      key={option.value}
                      value={option.value}
                      className="flex items-center gap-3 py-2"
                    >
                      <IconComponent className={cn("h-4 w-4", option.color)} />
                      <span className="flex-1">{option.label}</span>
                    </DropdownMenuRadioItem>
                  )
                })}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant={filters.status !== "all" ? "default" : "outline"}
                size="sm"
                className="h-8 gap-2 text-sm font-medium"
              >
                Status: {statusOptions.find(s => s.value === filters.status)?.label}
                <ChevronDown className="h-3 w-3 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-52" align="start">
              <DropdownMenuLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Product Status
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup
                value={filters.status}
                onValueChange={handleStatusChange}
              >
                {statusOptions.map(option => (
                  <DropdownMenuRadioItem
                    key={option.value}
                    value={option.value}
                    className="flex items-center gap-3 py-2"
                  >
                    <span>{option.label}</span>
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant={filters.categories.length > 0 ? "default" : "outline"}
                size="sm"
                className="h-8 gap-2 text-sm font-medium"
              >
                <Layers className="h-4 w-4" />
                {filters.categories.length > 0
                  ? `${filters.categories.length} Selected`
                  : "Categories"}
                <ChevronDown className="h-3 w-3 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="start">
              <DropdownMenuLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Categories
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {categories.map((cat) => (
                <DropdownMenuCheckboxItem
                  key={cat.id}
                  checked={filters.categories.includes(cat.name)}
                  onCheckedChange={() => handleCategoryToggle(cat.name)}
                  className="flex items-center gap-2 py-2"
                >
                  <Layers className="h-4 w-4 text-muted-foreground" />
                  <span>{cat.name}</span>
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {isFilterActive && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearAllFilters}
              className="h-8 px-3 text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              Clear All
            </Button>
          )}
        </div>
      </div>

      {isFilterActive && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Active Filters:</span>

          {filters.stockStatus !== "all" && (
            <Badge
              variant="secondary"
              className="h-6 px-2 text-xs font-medium bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
            >
              <Package className="h-3 w-3 mr-1" />
              {selectedStockStatus?.label}
              <button
                onClick={() => handleStockStatusChange("all")}
                className="ml-1 hover:bg-blue-200 rounded-full p-0.5"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </Badge>
          )}

          {filters.status !== "all" && (
            <Badge
              variant="secondary"
              className="h-6 px-2 text-xs font-medium bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
            >
              {statusOptions.find(s => s.value === filters.status)?.label}
              <button
                onClick={() => handleStatusChange("all")}
                className="ml-1 hover:bg-green-200 rounded-full p-0.5"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </Badge>
          )}

          {filters.categories.map((category) => (
            <Badge
              key={category}
              variant="secondary"
              className="h-6 px-2 text-xs font-medium bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100"
            >
              <Layers className="h-3 w-3 mr-1" />
              {category}
              <button
                onClick={() => handleCategoryToggle(category)}
                className="ml-1 hover:bg-purple-200 rounded-full p-0.5"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}
