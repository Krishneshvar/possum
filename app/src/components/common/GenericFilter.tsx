import React from 'react';
import { Button } from "@/components/ui/button";
import { X, ChevronDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
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
    onClearAllFilters: () => void;
}

export default function GenericFilter({
    filtersConfig,
    activeFilters,
    onFilterChange,
    onClearAllFilters
}: GenericFilterProps) {
    if (!filtersConfig || filtersConfig.length === 0) return null;

    const hasActiveFilters = filtersConfig.some(filter =>
        activeFilters[filter.key] && activeFilters[filter.key].length > 0
    );

    const toggleOption = (filterKey: string, optionValue: string) => {
        const current = (activeFilters[filterKey] as string[]) || [];
        const newValue = current.includes(optionValue)
            ? current.filter(v => v !== optionValue)
            : [...current, optionValue];
        onFilterChange({ key: filterKey, value: newValue });
    };

    return (
        <div className="flex flex-wrap gap-2 items-center">
            {filtersConfig.map((filter) => {
                const activeCount = (activeFilters[filter.key] as string[] || []).length;
                return (
                    <Popover key={filter.key}>
                        <PopoverTrigger asChild>
                            <Button variant="outline" size="sm" className="h-8">
                                {filter.label}
                                {activeCount > 0 && (
                                    <Badge variant="secondary" className="ml-2 h-5 px-1.5">
                                        {activeCount}
                                    </Badge>
                                )}
                                <ChevronDown className="ml-2 h-4 w-4" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-56 p-3" align="start">
                            <div className="space-y-2">
                                {filter.options.map((option) => {
                                    const isChecked = (activeFilters[filter.key] as string[] || []).includes(option.value);
                                    return (
                                        <div key={option.value} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={`${filter.key}-${option.value}`}
                                                checked={isChecked}
                                                onCheckedChange={() => toggleOption(filter.key, option.value)}
                                            />
                                            <label
                                                htmlFor={`${filter.key}-${option.value}`}
                                                className="text-sm cursor-pointer flex-1"
                                            >
                                                {option.label}
                                            </label>
                                        </div>
                                    );
                                })}
                            </div>
                        </PopoverContent>
                    </Popover>
                );
            })}

            {hasActiveFilters && (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClearAllFilters}
                    className="h-8 text-muted-foreground hover:text-destructive"
                >
                    <X className="h-4 w-4 mr-1" />
                    Clear
                </Button>
            )}
        </div>
    );
}
