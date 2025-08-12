import { useEffect, useState } from 'react';
import { productsAPI } from '../api';
import { useReactTable, getCoreRowModel, getFilteredRowModel, getSortedRowModel, getPaginationRowModel } from "@tanstack/react-table";
import ProductsTable from '@/components/products/ProductsTable';
import ProductActions from '@/components/products/ProductsActions';

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [sorting, setSorting] = useState([]);
  const [columnFilters, setColumnFilters] = useState([]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });

  useEffect(() => {
    async function fetchProducts() {
      try {
        const data = await productsAPI.getAll();
        setProducts(data);
      } catch (error) {
        console.error("Failed to fetch products:", error);
      }
    }
    fetchProducts();
  }, []);

  const table = useReactTable({
    data: products,
    columns: ProductsTable.columns,
    state: {
      sorting,
      columnFilters,
      pagination,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <div className="flex flex-col gap-4 p-6">
      <ProductActions table={table} />
      <ProductsTable table={table} />
    </div>
  );
}
