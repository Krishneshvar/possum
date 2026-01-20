import { TableHeader, TableRow, TableHead } from "@/components/ui/table"
import { ChevronDown, ChevronUp, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"

export default function GenericTableHeader({ columns, visibleColumns, onSort, sortBy, sortOrder }) {
  const handleSort = (column) => {
    if (!column.sortable || !onSort) return;

    const newSortOrder = (sortBy === column.sortField && sortOrder === 'ASC') ? 'DESC' : 'ASC';
    onSort(column.sortField, newSortOrder);
  };

  return (
    <TableHeader>
      <TableRow className="border-t border-border hover:bg-muted/50">
        <TableHead className="w-[50px]"></TableHead>
        {columns.map(
          (column) =>
            visibleColumns[column.key] && (
              <TableHead
                key={column.key}
                className={cn(
                  "font-semibold text-foreground py-3 sm:py-4 text-xs sm:text-sm px-2 sm:px-4",
                  column.sortable && "cursor-pointer select-none hover:bg-muted/80 transition-colors"
                )}
                onClick={() => handleSort(column)}
              >
                <div className="flex items-center gap-1">
                  <span className="truncate block max-w-[80px] sm:max-w-none min-w-none">{column.label}</span>
                  {column.sortable && (
                    <div className="flex flex-col shrink-0">
                      {sortBy === column.sortField ? (
                        sortOrder === 'ASC' ? (
                          <ChevronUp className="h-3 w-3" />
                        ) : (
                          <ChevronDown className="h-3 w-3" />
                        )
                      ) : (
                        <ChevronsUpDown className="h-3 w-3 opacity-30" />
                      )}
                    </div>
                  )}
                </div>
              </TableHead>
            ),
        )}
        <TableHead className="text-right"></TableHead>
      </TableRow>
    </TableHeader>
  )
}
