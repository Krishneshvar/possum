import { ChevronDown, Filter, X, Package, AlertTriangle, XCircle } from "lucide-react"
import { useDispatch, useSelector } from "react-redux"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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

export default function ProductsFilter() {
  const dispatch = useDispatch()
  const { filters } = useSelector((state) => state.products)

  const handleStockStatusChange = (value) => {
    dispatch(setFilter({ name: "stockStatus", value }))
  }

  const handleClearAllFilters = () => {
    dispatch(setFilter({ name: "stockStatus", value: "all" }))
  }

  const selectedStockStatus = stockStatusOptions.find((option) => option.value === filters.stockStatus)

  const isFilterActive = filters.stockStatus !== "all"
  const activeFiltersCount = (filters.stockStatus !== "all" ? 1 : 0)

  return (
    <div className="space-y-4">
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

        <div className="flex items-center gap-2">
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
        </div>
      )}
    </div>
  )
}
