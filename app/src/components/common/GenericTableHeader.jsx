import { TableHeader, TableRow, TableHead } from "@/components/ui/table"

export default function GenericTableHeader({ columns, visibleColumns }) {
  return (
    <TableHeader>
      <TableRow className="border-b border-border hover:bg-slate-100">
        <TableHead className="w-12 sm:w-16 ">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-muted/30 flex items-center justify-center">
            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-muted-foreground/30" />
          </div>
        </TableHead>
        {columns.map(
          (column) =>
            visibleColumns[column.key] && (
              <TableHead
                key={column.key}
                className="font-semibold text-foreground py-3 sm:py-4 text-xs sm:text-sm px-2 sm:px-4"
              >
                <span className="truncate block max-w-[80px] sm:max-w-none">{column.label}</span>
              </TableHead>
            ),
        )}
        <TableHead className="text-right"></TableHead>
      </TableRow>
    </TableHeader>
  )
}
