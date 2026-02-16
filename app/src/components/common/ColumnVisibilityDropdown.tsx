import { ChevronDown } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { useState } from "react"

interface Column {
    key: string;
    label: string;
    defaultVisible?: boolean;
}

interface ColumnVisibilityDropdownProps {
    columns: Column[];
    onChange: (visibleColumns: Record<string, boolean>) => void;
}

export default function ColumnVisibilityDropdown({ columns, onChange }: ColumnVisibilityDropdownProps) {
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(
    columns.reduce((acc, col) => {
      acc[col.key] = col.defaultVisible !== false
      return acc
    }, {} as Record<string, boolean>),
  )

  const handleToggle = (key: string) => {
    const updated = { ...visibleColumns, [key]: !visibleColumns[key] }
    setVisibleColumns(updated)
    onChange(updated)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild className="flex sm:w-auto w-full justify-between">
        <Button
          variant="outline"
          size="sm"
          className="h-9 gap-2 text-sm font-medium bg-transparent"
        >
          Columns
          <ChevronDown className="h-3 w-3 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end">
        <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-3 py-2">
          Toggle Columns
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {columns.map((col) => {
          const isChecked = visibleColumns[col.key]
          return (
            <DropdownMenuItem
              key={col.key}
              onSelect={(e) => {
                e.preventDefault()
                handleToggle(col.key)
              }}
              className="flex items-center gap-3 py-2.5 px-3 cursor-pointer"
            >
              <Checkbox
                checked={isChecked}
                id={`col-checkbox-${col.key}`}
                className="h-4 w-4 data-[state=checked]:bg-primary [data-state=checked]:text-white"
              />
              <label
                htmlFor={`col-checkbox-${col.key}`}
                className="text-sm cursor-pointer"
              >
                {col.label}
              </label>
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
