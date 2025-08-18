import { TableHeader, TableRow, TableHead } from "@/components/ui/table";

export default function GenericTableHeader({ columns, visibleColumns }) {
  return (
    <TableHeader>
      <TableRow className="border-b">
        <TableHead className="w-12"></TableHead>
        {columns.map(
          (column) =>
            visibleColumns[column.key] && (
              <TableHead key={column.key} className="font-semibold">
                {column.label}
              </TableHead>
            ),
        )}
        <TableHead className="w-12"></TableHead>
      </TableRow>
    </TableHeader>
  );
}
