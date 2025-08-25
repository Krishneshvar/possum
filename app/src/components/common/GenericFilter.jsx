import { ChevronDown, Filter, X } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"

export default function GenericFilter({ filtersConfig, activeFilters, onFilterChange, onClearAll }) {
  const activeFiltersCount = Object.values(activeFilters).reduce((count, value) => {
    return count + (Array.isArray(value) ? value.length : 0);
  }, 0);

  const isFilterActive = activeFiltersCount > 0;

  const handleClearAllFilters = () => {
    onClearAll();
  };

  const renderFilterDropdown = (filter) => {
    const { key, label, placeholder, options } = filter;

    const currentFilterValue = activeFilters[key] || [];

    const isActive = currentFilterValue.length > 0;

    const dropdownLabel = isActive
      ? `${currentFilterValue.length} Selected`
      : placeholder;

    return (
      <DropdownMenu key={key}>
        <DropdownMenuTrigger asChild>
          <Button
            variant={isActive ? "default" : "outline"}
            size="sm"
            className="h-10 sm:h-9 gap-2 text-sm font-medium justify-start xs:justify-center"
          >
            <span className="truncate">{dropdownLabel}</span>
            <ChevronDown className="h-3 w-3 opacity-60 ml-auto xs:ml-0" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="start">
          <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-3 py-2">
            {label}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {options.map((option) => {
            const isChecked = currentFilterValue.includes(option.value);

            return (
              <DropdownMenuItem
                key={option.value}
                onSelect={(e) => {
                  e.preventDefault();
                  const newValues = isChecked
                    ? currentFilterValue.filter((v) => v !== option.value)
                    : [...currentFilterValue, option.value];
                  onFilterChange(key, newValues);
                }}
                className="flex items-center gap-3 py-2.5 px-3 cursor-pointer"
              >
                <Checkbox
                  checked={isChecked}
                  id={`checkbox-${key}-${option.value}`}
                  className="h-4 w-4"
                />
                <label
                  htmlFor={`checkbox-${key}-${option.value}`}
                  className="text-sm cursor-pointer"
                >
                  {option.label}
                </label>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  const renderActiveBadges = () => {
    const badges = [];
    filtersConfig.forEach((filter) => {
      const { key, options, badgeProps = {} } = filter;
      const activeValues = activeFilters[key] || [];

      activeValues.forEach((value) => {
        const option = options.find((opt) => opt.value === value);
        if (option) {
          badges.push(
            <Badge key={`${key}-${value}`} {...badgeProps} className={cn("h-7 px-3 text-xs font-medium", badgeProps.className)}>
              <span className="truncate max-w-[120px] sm:max-w-none">{option.label}</span>
              <button
                onClick={() => onFilterChange(key, activeValues.filter((v) => v !== value))}
                className="ml-1.5 hover:bg-white/20 rounded-full p-0.5 transition-colors"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </Badge>,
          );
        }
      });
    });
    return badges;
  };

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
  );
}
