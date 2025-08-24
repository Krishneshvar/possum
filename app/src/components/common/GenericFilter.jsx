import { ChevronDown, Filter, X } from "lucide-react"
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
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export default function GenericFilter({ filtersConfig, activeFilters, onFilterChange, onClearAll }) {
  const activeFiltersCount = Object.values(activeFilters).reduce((count, value) => {
    if (Array.isArray(value)) {
      return count + value.length
    }
    if (value !== null && value !== "" && value !== "all") {
      return count + 1
    }
    return count
  }, 0)

  const isFilterActive = activeFiltersCount > 0

  const handleClearAllFilters = () => {
    onClearAll()
  }

  const renderFilterDropdown = (filter) => {
    const { key, type, label, placeholder, icon: Icon, options, show = true } = filter

    if (!show) {
      return null
    }

    const currentFilterValue = type === "checkbox" ? (activeFilters[key] || []) : activeFilters[key]

    const isActive = Array.isArray(currentFilterValue)
      ? currentFilterValue.length > 0
      : currentFilterValue !== "all" && currentFilterValue !== null

    const dropdownLabel =
      type === "checkbox"
        ? `${currentFilterValue.length > 0 ? `${currentFilterValue.length} Selected` : placeholder}`
        : `${options.find((opt) => opt.value === currentFilterValue)?.label ?? placeholder}`

    return (
      <DropdownMenu key={key}>
        <DropdownMenuTrigger asChild>
          <Button
            variant={isActive ? "default" : "outline"}
            size="sm"
            className="h-10 sm:h-9 gap-2 text-sm font-medium border-border/60 hover:border-border justify-start xs:justify-center"
          >
            {Icon && <Icon className="h-4 w-4" />}
            <span className="truncate">{dropdownLabel}</span>
            <ChevronDown className="h-3 w-3 opacity-60 ml-auto xs:ml-0" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="start">
          <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-3 py-2">
            {label}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {type === "radio" ? (
            <DropdownMenuRadioGroup value={currentFilterValue} onValueChange={(value) => onFilterChange(key, value)}>
              {options.map((option) => {
                const OptionIcon = option.icon
                return (
                  <DropdownMenuRadioItem
                    key={option.value}
                    value={option.value}
                    className="flex items-center gap-3 py-2.5 px-3"
                  >
                    {OptionIcon && <OptionIcon className={cn("h-4 w-4", option.color)} />}
                    <span className="flex-1 text-sm">{option.label}</span>
                  </DropdownMenuRadioItem>
                )
              })}
            </DropdownMenuRadioGroup>
          ) : (
            options.map((option) => {
              const OptionIcon = option.icon
              return (
                <DropdownMenuCheckboxItem
                  key={option.value}
                  checked={currentFilterValue.includes(option.value)}
                  onCheckedChange={() => {
                    const newValues = currentFilterValue.includes(option.value)
                      ? currentFilterValue.filter((v) => v !== option.value)
                      : [...currentFilterValue, option.value]
                    onFilterChange(key, newValues)
                  }}
                  className="flex items-center gap-3 py-2.5 px-3"
                >
                  {OptionIcon && <OptionIcon className={cn("h-4 w-4", option.color)} />}
                  <span className="text-sm">{option.label}</span>
                </DropdownMenuCheckboxItem>
              )
            })
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  const renderActiveBadges = () => {
    const badges = []
    filtersConfig.forEach((filter) => {
      const { key, type, options, badgeProps = {} } = filter
      const activeValue = type === "checkbox" ? (activeFilters[key] || []) : activeFilters[key]

      if (type === "radio" && activeValue && activeValue !== "all") {
        const option = options.find((opt) => opt.value === activeValue)
        if (option) {
          const BadgeIcon = option.icon
          badges.push(
            <Badge key={key} {...badgeProps} className={cn("h-7 px-3 text-xs font-medium", badgeProps.className)}>
              {BadgeIcon && <BadgeIcon className="h-3 w-3 mr-1.5" />}
              <span className="truncate max-w-[120px] sm:max-w-none">{option.label}</span>
              <button
                onClick={() => onFilterChange(key, "all")}
                className="ml-1.5 hover:bg-white/20 rounded-full p-0.5 transition-colors"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </Badge>,
          )
        }
      } else if (type === "checkbox" && activeValue && activeValue.length > 0) {
        activeValue.forEach((value) => {
          const option = options.find((opt) => opt.value === value)
          if (option) {
            const BadgeIcon = option.icon
            badges.push(
              <Badge key={`${key}-${value}`} {...badgeProps} className={cn("h-7 px-3 text-xs font-medium", badgeProps.className)}>
                {BadgeIcon && <BadgeIcon className="h-3 w-3 mr-1.5" />}
                <span className="truncate max-w-[120px] sm:max-w-none">{option.label}</span>
                <button
                  onClick={() => onFilterChange(key, activeValue.filter((v) => v !== value))}
                  className="ml-1.5 hover:bg-white/20 rounded-full p-0.5 transition-colors"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </Badge>,
            )
          }
        })
      }
    })
    return badges
  }

  return (
    <div className="flex flex-col gap-3 sm:gap-4">
      <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span>Filters</span>
          {isFilterActive && (
            <Badge
              variant="secondary"
              className="h-5 px-2 text-xs font-semibold bg-primary/10 text-primary border-primary/20"
            >
              {activeFiltersCount}
            </Badge>
          )}
        </div>

        <div className="flex lg:flex-row md:flex-row sm:flex-row xs:flex-row flex-wrap items-stretch xs:items-center gap-2">
          {filtersConfig.map(renderFilterDropdown)}
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
          <div className="flex flex-wrap items-center gap-2">{renderActiveBadges()}</div>
        </div>
      )}
    </div>
  )
}
