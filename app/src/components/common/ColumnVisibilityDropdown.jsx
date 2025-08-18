import { ChevronDown, SlidersHorizontal } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { useState } from "react"

export default function ColumnVisibilityDropdown({ columns, onChange }) {
  const [visibleColumns, setVisibleColumns] = useState(
    columns.reduce((acc, col) => {
      acc[col.key] = col.defaultVisible !== false
      return acc
    }, {})
  )

  const handleToggle = (key) => {
    const updated = { ...visibleColumns, [key]: !visibleColumns[key] }
    setVisibleColumns(updated)
    onChange(updated)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-2 text-sm font-medium">
          <SlidersHorizontal className="h-4 w-4" />
          Columns
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-52">
        <DropdownMenuLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Toggle Columns
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {columns.map((col) => (
          <DropdownMenuCheckboxItem
            key={col.key}
            checked={visibleColumns[col.key]}
            onCheckedChange={() => handleToggle(col.key)}
            className="flex items-center gap-2 py-2"
          >
            {col.label}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
