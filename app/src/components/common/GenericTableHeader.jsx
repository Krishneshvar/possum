import { useState, useRef, useEffect } from "react"
import { TableHeader, TableRow, TableHead } from "@/components/ui/table"
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react"
import { cn } from "@/lib/utils"

export default function GenericTableHeader({ columns, visibleColumns, onSort, sortBy, sortOrder }) {
  const [columnWidths, setColumnWidths] = useState({});
  const [resizingColumn, setResizingColumn] = useState(null);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  const handleSort = (column) => {
    if (!column.sortable || !onSort) return;

    const newSortOrder = (sortBy === column.sortField && sortOrder === 'ASC') ? 'DESC' : 'ASC';
    onSort(column.sortField, newSortOrder);
  };

  const handleMouseDown = (e, columnKey) => {
    e.preventDefault();
    e.stopPropagation();
    setResizingColumn(columnKey);
    startXRef.current = e.clientX;
    const th = e.target.closest('th');
    startWidthRef.current = th?.offsetWidth || 150;
  };

  useEffect(() => {
    if (!resizingColumn) return;

    const handleMouseMove = (e) => {
      const diff = e.clientX - startXRef.current;
      const newWidth = Math.max(80, startWidthRef.current + diff);
      setColumnWidths(prev => ({
        ...prev,
        [resizingColumn]: newWidth
      }));
    };

    const handleMouseUp = () => {
      setResizingColumn(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizingColumn]);

  return (
    <TableHeader>
      <TableRow className="border-t border-border hover:bg-muted/50">
        <TableHead className="w-[50px] border-r border-border last:border-r-0"></TableHead>
        {columns.map(
          (column) =>
            visibleColumns[column.key] && (
              <TableHead
                key={column.key}
                className={cn(
                  "relative font-semibold text-foreground py-3 sm:py-4 text-xs sm:text-sm px-2 sm:px-4 border-r border-border last:border-r-0",
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

