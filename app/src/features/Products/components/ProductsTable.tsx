import { Eye, Trash2, Package, Edit } from "lucide-react"
import { Link } from "react-router-dom"
import { useState, useMemo } from "react"
import { useSelector, useDispatch } from "react-redux"
import { DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { useDeleteProductMutation, useGetProductsQuery } from "@/services/productsApi"
import { setSearchTerm, setCurrentPage, setFilter, clearAllFilters } from "../productsSlice"
import GenericDeleteDialog from "@/components/common/GenericDeleteDialog"
import ActionsDropdown from "@/components/common/ActionsDropdown"
import { allColumns } from "./productsTableContents"
import { useGetCategoriesQuery } from "@/services/categoriesApi"
import { statusFilter, categoryFilter } from "../data/productsFiltersConfig"
import { flattenCategories } from "@/utils/categories.utils"
import DataTable from "@/components/common/DataTable"

export default function ProductsTable() {
  const dispatch = useDispatch()
  const { searchTerm, currentPage, itemsPerPage, filters } = useSelector((state: any) => state.products)
  const [sort, setSort] = useState({
    sortBy: 'name',
    sortOrder: 'ASC',
  });

  const { data, isLoading, isFetching, error, refetch } = useGetProductsQuery({
    page: currentPage,
    limit: itemsPerPage,
    searchTerm: searchTerm,
    stockStatus: filters.stockStatus,
    status: filters.status,
    categories: filters.categories,
    sortBy: sort.sortBy,
    sortOrder: sort.sortOrder,
  });

  const products = data?.products || []
  const totalPages = data?.totalPages || 1;
  const isDataLoading = isLoading || isFetching

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [deleteProduct] = useDeleteProductMutation()
  const { data: categories = [] } = useGetCategoriesQuery(undefined)

  const handleFilterChange = ({ key, value }: { key: string, value: string[] }) => {
    dispatch(setFilter({ key, value }))
  }

  const handleClearAllFilters = () => {
    dispatch(clearAllFilters())
  }

  const handlePageChange = (page: number) => {
    dispatch(setCurrentPage(page))
  }

  const handleSort = (column: any) => {
    const order = sort.sortBy === column.sortField && sort.sortOrder === 'ASC' ? 'DESC' : 'ASC';
    setSort({ sortBy: column.sortField, sortOrder: order });
  };

  const handleDeleteClick = (product: any) => {
    setSelectedProduct(product)
    setIsDeleteDialogOpen(true)
  }

  const handleDialogOpenChange = (open: boolean) => {
    setIsDeleteDialogOpen(open)
    if (!open) {
      setTimeout(() => setSelectedProduct(null), 0)
    }
  }

  const handleConfirmDelete = async () => {
    if (!selectedProduct) return
    try {
      await deleteProduct(selectedProduct.id).unwrap()
      setIsDeleteDialogOpen(false)
      setSelectedProduct(null)
      toast.success("Product deleted successfully", {
        description: "The selected product was deleted successfully.",
        duration: 5000,
      })
    } catch (err) {
      console.error("Failed to delete product:", err);
      toast.error("Error deleting product", {
        description: "An error occurred while deleting product. Please try again later.",
        duration: 5000,
      })
    }
  }

  const emptyState = (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center space-y-4 max-w-sm mx-auto">
      <div className="bg-muted/50 p-6 rounded-full">
        <Package className="h-12 w-12 text-muted-foreground/50" />
      </div>
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-foreground">No products found</h3>
        <p className="text-sm text-muted-foreground">
          We couldn't find any products matching your search. Try adjusting filters or add a new product.
        </p>
      </div>
      <Button variant="outline" onClick={handleClearAllFilters}>
        Clear Filters
      </Button>
    </div>
  )

  const renderProductActions = (product: any) => (
    <div className="flex items-center justify-end gap-1">
      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary hidden sm:flex" asChild title="Edit Product">
        <Link to={`/products/edit/${product.id}`}>
          <Edit className="h-4 w-4" />
        </Link>
      </Button>

      <ActionsDropdown>
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuItem asChild>
          <Link to={`/products/${product.id}`} className="cursor-pointer">
            <Eye className="mr-2 h-4 w-4 text-muted-foreground" />
            <span>View Details</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to={`/products/edit/${product.id}`} className="cursor-pointer">
            <Edit className="mr-2 h-4 w-4 text-muted-foreground" />
            <span>Edit Product</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-destructive focus:text-destructive cursor-pointer hover:bg-destructive/10"
          onClick={() => handleDeleteClick(product)}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          <span>Delete Product</span>
        </DropdownMenuItem>
      </ActionsDropdown>
    </div>
  )

  const filtersConfig = useMemo(() => {
    const flatCategories = flattenCategories(categories);
    return [
      statusFilter,
      categoryFilter(flatCategories),
    ];
  }, [categories]);

  // Update columns to include sortable properties
  const columnsWithSort = allColumns.map(col => {
    if (col.key === 'product') {
      return { ...col, sortable: true, sortField: 'name' };
    }
    if (col.key === 'category') {
      return { ...col, sortable: true, sortField: 'category_name' };
    }
    if (col.key === 'status') {
      return { ...col, sortable: true, sortField: 'status' };
    }
    if (col.key === 'stock') {
      return { ...col, sortable: true, sortField: 'stock' };
    }
    return col;
  });

  return (
    <>
      <DataTable
        data={products}
        columns={columnsWithSort}
        isLoading={isDataLoading}
        // @ts-ignore
        error={error?.message}
        onRetry={refetch}

        searchTerm={searchTerm}
        onSearchChange={(value) => dispatch(setSearchTerm(value))}
        searchPlaceholder="Search products by name, SKU, or category..."

        sortBy={sort.sortBy}
        sortOrder={sort.sortOrder}
        onSort={handleSort}

        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}

        filtersConfig={filtersConfig}
        activeFilters={filters}
        onFilterChange={handleFilterChange}
        onClearAllFilters={handleClearAllFilters}

        emptyState={emptyState}
        renderActions={renderProductActions}
        // @ts-ignore
        avatarIcon={<Package className="h-4 w-4 text-primary" />}
        className="border-none shadow-none bg-transparent sm:bg-card sm:border sm:shadow-sm"
      />

      <GenericDeleteDialog
        dialogTitle="Delete Product?"
        itemName={selectedProduct?.name ?? "this product"}
        open={isDeleteDialogOpen}
        onOpenChange={handleDialogOpenChange}
        onConfirm={handleConfirmDelete}
      />
    </>
  );
}
