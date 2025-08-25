import { TableHeader, TableRow, TableHead } from "@/components/ui/table"

export default function GenericTableHeader({ columns, visibleColumns }) {
  return (
    <TableHeader>
      <TableRow className="border-t border-border hover:bg-slate-100">
        <TableHead></TableHead>
        {columns.map(
          (column) =>
            visibleColumns[column.key] && (
              <TableHead
                key={column.key}
                className="font-semibold text-foreground py-3 sm:py-4 text-xs sm:text-sm px-2 sm:px-4"
              >
                <span className="truncate block max-w-[80px] sm:max-w-none min-w-none">{column.label}</span>
              </TableHead>
            ),
        )}
        <TableHead className="text-right"></TableHead>
      </TableRow>
    </TableHeader>
  )
}
