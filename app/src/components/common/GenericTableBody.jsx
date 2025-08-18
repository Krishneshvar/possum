import { TableBody, TableCell, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import React from 'react';

export default function GenericTableBody({ data, allColumns, visibleColumns, emptyState, renderActions, avatarIcon }) {
  const columnsToRender = allColumns.filter(column => visibleColumns[column.key]);
  
  return (
    <TableBody>
      {data.length > 0 ? (
        data.map((item) => (
          <TableRow key={item.id} className="hover:bg-muted/50">
            <TableCell className="py-2">
              <Avatar className="rounded-lg h-10 w-10">
                <AvatarFallback className="bg-primary/10">
                  {avatarIcon}
                </AvatarFallback>
              </Avatar>
            </TableCell>
            {columnsToRender.map((column) => (
              <TableCell key={column.key} className="py-2">
                {column.renderCell(item)}
              </TableCell>
            ))}
            {renderActions && (
              <TableCell className="py-2">{renderActions(item)}</TableCell>
            )}
          </TableRow>
        ))
      ) : (
        <TableRow>
          <TableCell colSpan={columnsToRender.length + 2} className="h-32 text-center">
            {emptyState}
          </TableCell>
        </TableRow>
      )}
    </TableBody>
  );
}
