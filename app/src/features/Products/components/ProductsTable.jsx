import { Eye, Trash2, Package, Edit } from "lucide-react"
import { Link } from "react-router-dom"
import { useState, useMemo } from "react"
import { useSelector, useDispatch } from "react-redux"
import { DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { toast } from "sonner"
import { useDeleteProductMutation, useGetProductsQuery } from "@/services/productsApi"
import { setSearchTerm, setCurrentPage, setFilter, clearAllFilters } from "../productsSlice"
import GenericDeleteDialog from "@/components/common/GenericDeleteDialog"
import ActionsDropdown from "@/components/common/ActionsDropdown"
import { allColumns } from "./productsTableContents.jsx"
import { useGetCategoriesQuery } from "@/services/categoriesApi"
import { statusFilter, categoryFilter } from "../data/productsFiltersConfig"
import { flattenCategories } from "@/utils/categories.utils"
import DataTable from "@/components/common/DataTable"

export default function ProductsTable() {
  const dispatch = useDispatch()
  const { searchTerm, currentPage, itemsPerPage, filters } = useSelector((state) => state.products)

  const { data, isLoading, isFetching, error, refetch } = useGetProductsQuery({
    page: currentPage,
    limit: itemsPerPage,
    searchTerm: searchTerm,
    stockStatus: filters.stockStatus,
    status: filters.status,
    categories: filters.categories,
  });

  const products = data?.products || []
  const totalPages = data?.totalPages || 1;
  const isDataLoading = isLoading || isFetching

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [deleteProduct] = useDeleteProductMutation()
  const { data: categories = [] } = useGetCategoriesQuery()

  const handleFilterChange = (key, value) => {
    dispatch(setFilter({ key, value }))
  }

  const handleClearAllFilters = () => {
    dispatch(clearAllFilters())
  }

  const handlePageChange = (page) => {
    dispatch(setCurrentPage(page))
  }

  const handleDeleteClick = (product) => {
    setSelectedProduct(product)
    setIsDeleteDialogOpen(true)
  }

  const handleDialogOpenChange = (open) => {
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
    <div className="flex flex-col items-center gap-2 py-8 px-4 text-center">
      <Package className="h-8 w-8 text-muted-foreground" />
      <p className="text-sm font-medium text-muted-foreground">No products found</p>
      <p className="text-xs text-muted-foreground max-w-sm">Try adjusting your search or add a new product</p>
    </div>
  )

  const renderProductActions = (product) => (
    <ActionsDropdown>
      <DropdownMenuItem asChild>
        <Link to={`/products/${product.id}`} className="cursor-pointer">
          <Eye className="mr-2 h-4 w-4" />
          <span className="hidden sm:inline">View Details</span>
          <span className="sm:hidden">View</span>
        </Link>
      </DropdownMenuItem>
      <DropdownMenuItem asChild>
        <Link to={`/products/edit/${product.id}`} className="cursor-pointer">
          <Edit className="mr-2 h-4 w-4" />
          <span className="hidden sm:inline">Edit Product</span>
          <span className="sm:hidden">Edit</span>
        </Link>
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem
        className="text-destructive focus:text-destructive cursor-pointer"
        onClick={() => handleDeleteClick(product)}
      >
        <Trash2 className="mr-2 h-4 w-4 text-destructive" />
        <span className="hidden sm:inline">Delete Product</span>
        <span className="sm:hidden">Delete</span>
      </DropdownMenuItem>
    </ActionsDropdown>
  )

  const filtersConfig = useMemo(() => {
    const flatCategories = flattenCategories(categories);

    return [
      statusFilter,
      categoryFilter(flatCategories),
    ];
  }, [categories]);

  return (
    <>
      <DataTable
        data={products}
        columns={allColumns}
        isLoading={isDataLoading}
        error={error}
        onRetry={refetch}

        searchTerm={searchTerm}
        onSearchChange={(value) => dispatch(setSearchTerm(value))}
        searchPlaceholder="Search products by name or SKU..."

        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}

        filtersConfig={filtersConfig}
        activeFilters={filters}
        onFilterChange={handleFilterChange}
        onClearAllFilters={handleClearAllFilters}

        emptyState={emptyState}
        renderActions={renderProductActions}
        avatarIcon={<Package className="h-4 w-4 text-primary" />}
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
