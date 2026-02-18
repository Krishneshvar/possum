import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { flattenCategories } from '@/utils/categories.utils.js';
import { useMemo } from "react";

interface CategorySelectorProps {
  categories: any[];
  value: string;
  onChange: (field: string, value: string) => void;
}

export default function CategorySelector({ categories, value, onChange }: CategorySelectorProps) {
  // Use unique key to force re-render when categories arrive or ID changes
  // This ensures the Select component correctly displays the matching item label
  const flatCategories = useMemo(() => flattenCategories(categories), [categories]);

  // Normalize value to string for consistent matching
  const normalizedValue = value !== undefined && value !== null ? String(value).trim() : "";

  return (
    <Select
      key={`category-select-${normalizedValue}-${flatCategories.length}`}
      onValueChange={(val: string) => onChange("category_id", val)}
      value={normalizedValue}
    >
      <SelectTrigger id="category_id" className="w-full py-[1.3rem]">
        <SelectValue placeholder="Select category" />
      </SelectTrigger>
      <SelectContent>
        {flatCategories.length === 0 ? (
          <div className="p-2 text-sm text-muted-foreground text-center">No categories found</div>
        ) : (
          flatCategories.map((category) => {
            const indentation = category.depth ? "\u00A0\u00A0".repeat(category.depth) : "";
            return (
              <SelectItem key={category.id} value={String(category.id)}>
                {indentation}{category.name}
              </SelectItem>
            );
          })
        )}
      </SelectContent>
    </Select>
  );
}
