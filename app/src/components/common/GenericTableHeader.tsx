import React, { useRef, useState } from 'react';
import { TableHeader, TableRow, TableHead } from "@/components/ui/table";
import { ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface Column {
    key: string;
    label: string;
    sortable?: boolean;
    sortField?: string;
    defaultVisible?: boolean;
    align?: 'left' | 'center' | 'right';
    minWidth?: string;
}

interface GenericTableHeaderProps {
    columns: Column[];
    visibleColumns: Record<string, boolean>;
    onSort?: (column: Column) => void;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC' | string;
}

export default function GenericTableHeader({ columns, visibleColumns, onSort, sortBy, sortOrder }: GenericTableHeaderProps) {
  const [columnWidths, setColumnWidths] = useState<Record<string, number | string>>({});
  const resizingRef = useRef<string | null>(null);
  const startXRef = useRef<number>(0);
  const startWidthRef = useRef<number>(0);

  const handleMouseDown = (e: React.MouseEvent, columnKey: string) => {
    resizingRef.current = columnKey;
    startXRef.current = e.pageX;
    const th = (e.target as HTMLElement).closest('th');
    if (th) {
        startWidthRef.current = th.offsetWidth;
    }
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (resizingRef.current) {
      const diff = e.pageX - startXRef.current;
      const newWidth = Math.max(50, startWidthRef.current + diff);
      setColumnWidths((prev) => ({ ...prev, [resizingRef.current!]: newWidth }));
    }
  };

  const handleMouseUp = () => {
    resizingRef.current = null;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  const handleSort = (column: Column) => {
    if (column.sortable && onSort) {
      onSort(column);
    }
  };

  return (
    <TableHeader className="bg-muted/30 sticky top-0 z-10 backdrop-blur-sm">
      <TableRow className="border-b border-border/60 hover:bg-muted/40 transition-colors">
        <TableHead className="w-16 px-3 sm:px-4"></TableHead>
        {columns.map(
          (column) =>
            visibleColumns[column.key] && (
              <TableHead
                key={column.key}
                className={cn(
                  "relative h-10 sm:h-11 px-3 sm:px-4 text-xs sm:text-sm font-semibold text-muted-foreground select-none first:pl-4 sm:first:pl-6 last:pr-4 sm:last:pr-6",
                  column.align === 'center' ? 'text-center' : column.align === 'right' ? 'text-right' : 'text-left',
                  column.sortable && "cursor-pointer select-none hover:bg-muted/80 transition-colors"
                )}
                onClick={() => handleSort(column)}
                style={{ width: columnWidths[column.key] || 'auto' }}
              >
                <div className="flex items-center gap-1 justify-between">
                  <div className="flex items-center gap-1 flex-1">
                    <span className="truncate block max-w-[80px] sm:max-w-none min-w-none">{column.label}</span>
                    {column.sortable && (
                      <div className="flex flex-col shrink-0">
                        {sortBy === column.sortField ? (
                          sortOrder === 'ASC' ? (
                            <ArrowUp className="h-4 w-4" />
                          ) : (
                            <ArrowDown className="h-4 w-4" />
                          )
                        ) : (
                          <ArrowUpDown className="h-4 w-4 opacity-30" />
                        )}
                      </div>
                    )}
                  </div>
                  {/* Resize Handle */}
                  <div
                    className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-primary/50 active:bg-primary"
                    onMouseDown={(e) => handleMouseDown(e, column.key)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              </TableHead>
            ),
        )}
        <TableHead className="text-right"></TableHead>
      </TableRow>
    </TableHeader>
  )
}
