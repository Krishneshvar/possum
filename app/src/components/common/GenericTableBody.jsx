import { TableBody, TableCell, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

export default function GenericTableBody({ data, allColumns, visibleColumns, emptyState, renderActions, avatarIcon }) {
  const columnsToRender = allColumns.filter((column) => visibleColumns[column.key])

  return (
    <TableBody>
      {data.length > 0 ? (
        data.map((item) => (
          <TableRow key={item.id} className="hover:bg-muted/30 transition-colors border-b border-border/30">
            <TableCell className="">
              <Avatar className="rounded-xl h-10 w-10 border border-border/40">
                <AvatarFallback className="bg-primary/8 text-primary rounded-xl">{avatarIcon}</AvatarFallback>
              </Avatar>
            </TableCell>
            {columnsToRender.map((column) => (
              <TableCell key={column.key} className="text-sm">
                {column.renderCell(item)}
              </TableCell>
            ))}
            {renderActions && <TableCell className="text-right">{renderActions(item)}</TableCell>}
          </TableRow>
        ))
      ) : (
        <TableRow>
          <TableCell colSpan={columnsToRender.length + 2} className="h-40 text-center">
            <div className="flex flex-col items-center justify-center space-y-3">{emptyState}</div>
          </TableCell>
        </TableRow>
      )}
    </TableBody>
  )
}
