import { ChevronDown, SlidersHorizontal } from "lucide-react"
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

export default function ColumnVisibilityDropdown({ columns, onChange }) {
  const [visibleColumns, setVisibleColumns] = useState(
    columns.reduce((acc, col) => {
      acc[col.key] = col.defaultVisible !== false
      return acc
    }, {}),
  )

  const handleToggle = (key) => {
    const updated = { ...visibleColumns, [key]: !visibleColumns[key] }
    setVisibleColumns(updated)
    onChange(updated)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-9 gap-2 text-sm font-medium bg-transparent"
        >
          <SlidersHorizontal className="h-4 w-4" />
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
