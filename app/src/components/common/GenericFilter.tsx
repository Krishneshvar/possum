import { Button } from "@/components/ui/button";
import { ChevronDown, Check } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
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
}

export default function GenericFilter({
    filtersConfig,
    activeFilters,
    onFilterChange
}: GenericFilterProps) {
    if (!filtersConfig || filtersConfig.length === 0) return null;

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
                        <PopoverContent className="w-[200px] p-0" align="start">
                            <Command>
                                <CommandInput placeholder={`Search ${filter.label}...`} />
                                <CommandList>
                                    <CommandEmpty>No results found.</CommandEmpty>
                                    <CommandGroup className="p-1">
                                        {filter.options.map((option) => {
                                            const isChecked = (activeFilters[filter.key] as string[] || []).includes(option.value);
                                            return (
                                                <CommandItem
                                                    key={option.value}
                                                    onSelect={() => toggleOption(filter.key, option.value)}
                                                    className="flex items-center px-2 py-1.5"
                                                >
                                                    <div className={cn(
                                                        "mr-2 flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border border-primary transition-colors",
                                                        isChecked
                                                            ? "bg-primary text-primary-foreground"
                                                            : "opacity-50 [&_svg]:invisible"
                                                    )}>
                                                        <Check className={cn("h-4 w-4")} />
                                                    </div>
                                                    <span className="truncate">{option.label}</span>
                                                </CommandItem>
                                            );
                                        })}
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>
                );
            })}

        </div>
    );
}
