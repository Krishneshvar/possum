import { TableBody, TableCell, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import React, { Fragment } from "react"

interface Column {
    key: string;
    label: string;
    renderCell?: (item: any) => React.ReactNode;
}

interface GenericTableBodyProps {
    data: any[];
    allColumns: Column[];
    visibleColumns: Record<string, boolean>;
    emptyState?: React.ReactNode;
    renderActions?: (item: any) => React.ReactNode;
    avatarIcon?: React.ReactNode;
}

export default function GenericTableBody({ data, allColumns, visibleColumns, emptyState, renderActions, avatarIcon }: GenericTableBodyProps) {
  const columnsToRender = allColumns.filter((column) => visibleColumns[column.key])

  return (
    <TableBody className="overflow-x-auto">
      {data.length > 0 ? (
        data.map((item) => (
          <Fragment key={item.id}>
            <TableRow className="hover:bg-muted/50 transition-colors border-b border-border">
              <TableCell className="min-w-none border-r border-border last:border-r-0">
                <Avatar className="rounded-lg h-10 w-10 border border-border">
                  {item.imageUrl ? (
                    <AvatarImage src={item.imageUrl} alt={item.name} className="object-cover" />
                  ) : (
                    <AvatarFallback className="bg-primary/8 text-primary rounded-lg">{avatarIcon}</AvatarFallback>
                  )}
                </Avatar>
              </TableCell>
              {columnsToRender.map((column) => (
                <TableCell key={column.key} className="text-sm min-w-none border-r border-border last:border-r-0">
                  {column.renderCell ? column.renderCell(item) : item[column.key]}
                </TableCell>
              ))}
              {renderActions && <TableCell className="text-right">{renderActions(item)}</TableCell>}
            </TableRow>
            {item.expandedContent && (
              <TableRow className="hover:bg-muted/50">
                <TableCell colSpan={columnsToRender.length + 2} className="p-0">
                  {item.expandedContent}
                </TableCell>
              </TableRow>
            )}
          </Fragment>
        ))
      ) : (
        <TableRow>
          <TableCell colSpan={columnsToRender.length + 2} className="h-40 text-center hover:bg-muted/50">
            <div className="flex flex-col items-center justify-center space-y-3">{emptyState}</div>
          </TableCell>
        </TableRow>
      )}
    </TableBody>
  )
}
