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
      newCategories = filters.categories.filter((c) => c !== categoryName)
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
    dispatch(setFilter({ name: "status", value: "all" }))
  }

  const selectedStockStatus = stockStatusOptions.find((option) => option.value === filters.stockStatus)

  const isFilterActive = filters.stockStatus !== "all" || filters.categories.length > 0 || filters.status !== "all"

  const activeFiltersCount =
    (filters.stockStatus !== "all" ? 1 : 0) + filters.categories.length + (filters.status !== "all" ? 1 : 0)

  return (
    <div className="flex flex-col gap-3 sm:gap-4">
      <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span>Filters</span>
          {activeFiltersCount > 0 && (
            <Badge
              variant="secondary"
              className="h-5 px-2 text-xs font-semibold bg-primary/10 text-primary border-primary/20"
            >
              {activeFiltersCount}
            </Badge>
          )}
        </div>

        <div className="flex lg:flex-row md:flex-row sm:flex-row xs:flex-row flex-wrap items-stretch xs:items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant={filters.stockStatus !== "all" ? "default" : "outline"}
                size="sm"
                className="h-10 sm:h-9 gap-2 text-sm font-medium border-border/60 hover:border-border justify-start xs:justify-center"
              >
                {selectedStockStatus?.icon && (
                  <selectedStockStatus.icon className={cn("h-4 w-4", selectedStockStatus.color)} />
                )}
                <span className="truncate">{selectedStockStatus?.label}</span>
                <ChevronDown className="h-3 w-3 opacity-60 ml-auto xs:ml-0" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="start">
              <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-3 py-2">
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
                      className="flex items-center gap-3 py-2.5 px-3"
                    >
                      <IconComponent className={cn("h-4 w-4", option.color)} />
                      <span className="flex-1 text-sm">{option.label}</span>
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
                className="h-10 sm:h-9 gap-2 text-sm font-medium border-border/60 hover:border-border justify-start xs:justify-center"
              >
                <span className="truncate">Status: {statusOptions.find((s) => s.value === filters.status)?.label}</span>
                <ChevronDown className="h-3 w-3 opacity-60 ml-auto xs:ml-0" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="start">
              <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-3 py-2">
                Product Status
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup value={filters.status} onValueChange={handleStatusChange}>
                {statusOptions.map((option) => (
                  <DropdownMenuRadioItem
                    key={option.value}
                    value={option.value}
                    className="flex items-center gap-3 py-2.5 px-3"
                  >
                    <span className="text-sm">{option.label}</span>
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
                className="h-10 sm:h-9 gap-2 text-sm font-medium border-border/60 hover:border-border justify-start xs:justify-center"
              >
                <Layers className="h-4 w-4" />
                <span className="truncate">
                  {filters.categories.length > 0 ? `${filters.categories.length} Selected` : "Categories"}
                </span>
                <ChevronDown className="h-3 w-3 opacity-60 ml-auto xs:ml-0" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-60" align="start">
              <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-3 py-2">
                Categories
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {categories.map((cat) => (
                <DropdownMenuCheckboxItem
                  key={cat.id}
                  checked={filters.categories.includes(cat.name)}
                  onCheckedChange={() => handleCategoryToggle(cat.name)}
                  className="flex items-center gap-3 py-2.5 px-3"
                >
                  <Layers className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{cat.name}</span>
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {isFilterActive && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearAllFilters}
              className="h-10 sm:h-9 px-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 justify-start xs:justify-center"
            >
              Clear All
            </Button>
          )}
        </div>
      </div>

      {isFilterActive && (
        <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2 pt-2">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Active:</span>

          <div className="flex flex-wrap items-center gap-2">
            {filters.stockStatus !== "all" && (
              <Badge
                variant="secondary"
                className="h-7 px-3 text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100"
              >
                <Package className="h-3 w-3 mr-1.5" />
                <span className="truncate max-w-[120px] sm:max-w-none">{selectedStockStatus?.label}</span>
                <button
                  onClick={() => handleStockStatusChange("all")}
                  className="ml-1.5 hover:bg-blue-200 rounded-full p-0.5 transition-colors"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </Badge>
            )}

            {filters.status !== "all" && (
              <Badge
                variant="secondary"
                className="h-7 px-3 text-xs font-medium bg-green-50 text-green-700 border border-green-200 hover:bg-green-100"
              >
                <span className="truncate max-w-[120px] sm:max-w-none">
                  {statusOptions.find((s) => s.value === filters.status)?.label}
                </span>
                <button
                  onClick={() => handleStatusChange("all")}
                  className="ml-1.5 hover:bg-green-200 rounded-full p-0.5 transition-colors"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </Badge>
            )}

            {filters.categories.map((category) => (
              <Badge
                key={category}
                variant="secondary"
                className="h-7 px-3 text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100"
              >
                <Layers className="h-3 w-3 mr-1.5" />
                <span className="truncate max-w-[120px] sm:max-w-none">{category}</span>
                <button
                  onClick={() => handleCategoryToggle(category)}
                  className="ml-1.5 hover:bg-purple-200 rounded-full p-0.5 transition-colors"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
