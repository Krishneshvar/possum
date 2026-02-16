import React from 'react';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface FilterOption {
    label: string;
    value: string;
}

interface FilterConfig {
    key: string;
    label: string;
    options: FilterOption[];
}

interface GenericFilterProps {
    filtersConfig: FilterConfig[];
    activeFilters: Record<string, string | string[]>;
    onFilterChange: (payload: { key: string; value: string[] }) => void;
    onClearAll: () => void;
}

export default function GenericFilter({
    filtersConfig,
    activeFilters,
    onFilterChange,
    onClearAll
}: GenericFilterProps) {
    if (!filtersConfig || filtersConfig.length === 0) return null;

    const hasActiveFilters = filtersConfig.some(filter =>
        activeFilters[filter.key] && activeFilters[filter.key].length > 0
    );

    return (
        <div className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row flex-wrap gap-4 items-start sm:items-center">
                {filtersConfig.map((filter) => (
                    <div key={filter.key} className="flex flex-col gap-1.5 w-full sm:w-auto">
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider pl-1">
                            {filter.label}
                        </span>
                        <ToggleGroup
                            type="multiple"
                            value={activeFilters[filter.key] as string[] || []}
                            onValueChange={(value) => onFilterChange({ key: filter.key, value })}
                            className="justify-start flex-wrap gap-1.5 sm:gap-2"
                        >
                            {filter.options.map((option) => (
                                <ToggleGroupItem
                                    key={option.value}
                                    value={option.value}
                                    aria-label={`Filter by ${option.label}`}
                                    className={cn(
                                        "h-7 sm:h-8 px-2 sm:px-3 text-xs sm:text-sm border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-all duration-200 ease-in-out data-[state=on]:bg-primary/10 data-[state=on]:text-primary data-[state=on]:border-primary/20",
                                        "flex-grow sm:flex-grow-0"
                                    )}
                                >
                                    {option.label}
                                </ToggleGroupItem>
                            ))}
                        </ToggleGroup>
                    </div>
                ))}

                {hasActiveFilters && (
                    <div className="pt-0 sm:pt-6 w-full sm:w-auto mt-2 sm:mt-0 flex justify-end sm:justify-start">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onClearAll}
                            className="h-8 px-2 lg:px-3 text-muted-foreground hover:text-destructive hover:bg-destructive/10 text-xs sm:text-sm transition-colors"
                        >
                            <X className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                            Clear Filters
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
