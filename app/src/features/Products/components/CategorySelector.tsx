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
  const flatCategories = useMemo(() => flattenCategories(categories), [categories]);

  return (
    <Select
      onValueChange={(val) => onChange("category_id", val)}
      value={value ? String(value) : ""}
    >
      <SelectTrigger id="category_id" className="w-full py-[1.3rem]">
        <SelectValue placeholder="Select category" />
      </SelectTrigger>
      <SelectContent>
        {flatCategories.map((category) => (
          <SelectItem key={category.id} value={String(category.id)}>
            {category.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
