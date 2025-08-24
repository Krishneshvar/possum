import { Eye, Trash2, Package, Edit, Search, Loader2, RefreshCw, AlertCircle } from "lucide-react"
import { Link } from "react-router-dom"
import { useState } from "react"
import { useSelector, useDispatch } from "react-redux"
import { Card, CardContent } from "@/components/ui/card"
import { DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableRow, TableCell } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { useDeleteProductMutation, useGetProductsQuery } from "@/services/productsApi"
import ColumnVisibilityDropdown from "@/components/common/ColumnVisibilityDropdown"
import { setSearchTerm, setCurrentPage, setFilter } from "../productsSlice"
import GenericDeleteDialog from "@/components/common/GenericDeleteDialog"
import { Separator } from "@/components/ui/separator"

import GenericTableHeader from "@/components/common/GenericTableHeader"
import GenericTableBody from "@/components/common/GenericTableBody"
import GenericPagination from "@/components/common/GenericPagination"
import ActionsDropdown from "@/components/common/ActionsDropdown"

import { allColumns } from "./productsTableContents.jsx"
import GenericFilter from "@/components/common/GenericFilter"
import { useGetCategoriesQuery } from "@/services/categoriesApi"
import { stockStatusFilter, statusFilter, categoryFilter } from "../data/productsFiltersConfig"

export default function ProductsTable({ onProductDeleted }) {
  const dispatch = useDispatch()
  const { searchTerm, currentPage, itemsPerPage, filters } = useSelector((state) => state.products)
  const { data, isLoading, isFetching, error, refetch } = useGetProductsQuery()
  const products = data?.products || []
  const isDataLoading = isLoading || isFetching

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [deleteProduct] = useDeleteProductMutation()
  const [visibleColumns, setVisibleColumns] = useState(
    allColumns.reduce((acc, col) => {
      acc[col.key] = true
      return acc
    }, {})
  )
  const { data: categories = [] } = useGetCategoriesQuery()

  const handleFilterChange = (key, value) => {
    dispatch(setFilter({ key, value }))
  }

  const handleClearAllFilters = () => {
    dispatch(
      setFilter({
        key: "all",
        value: {
          stockStatus: "all",
          status: "all",
          categories: [],
        },
      })
    )
  }

  const categoryNameToId = new Map(
    (categories ?? []).map(c => [c.name, String(c.id ?? c.category_id)])
  )

  const filteredProducts = products ? products.filter((product) => {
    const name = (product.name ?? '').toLowerCase()
    const sku  = (product.sku  ?? '').toLowerCase()
    const matchesSearchTerm =
      name.includes(searchTerm.toLowerCase()) ||
      sku.includes(searchTerm.toLowerCase())

    const getStockStatus = (stock) => {
      if (stock === 0) return "out-of-stock"
      if (stock <= 10) return "low-stock"
      return "in-stock"
    }

    const matchesStockStatus = filters.stockStatus === "all" || getStockStatus(product.stock) === filters.stockStatus
    const directCatId =
      product.category_id ??
      product.categoryId ??
      product.category?.id ??
      (product.category_name ? categoryNameToId.get(product.category_name) : null) ??
      (product.category?.name ? categoryNameToId.get(product.category.name) : null)

    const productCatId = directCatId != null ? String(directCatId) : null
    const matchesCategory =
      filters.categories.length === 0 ||
      (productCatId && filters.categories.includes(productCatId))
    const matchesStatus = filters.status === "all" || product.status === filters.status

    return matchesSearchTerm && matchesStockStatus && matchesCategory && matchesStatus
  }) : []

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedProducts = filteredProducts.slice(startIndex, startIndex + itemsPerPage)

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
      onProductDeleted()
      toast.success("Product deleted successfully", {
        description: "The selected product was deleted successfully.",
        duration: 5000,
      })
    } catch (err) {
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

  const filtersConfig = [
    stockStatusFilter,
    statusFilter,
    categoryFilter(categories),
  ];

  return (
    <>
      <Card className="border-border/50 shadow-sm w-full max-w-full overflow-hidden">
        <CardContent className="space-y-4 sm:space-y-6 p-3 sm:p-4 lg:p-6">
          <div className="flex flex-col gap-4 sm:gap-6">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Search products by name or SKU..."
                className="pl-10 h-10 sm:h-11 focus:border-border bg-background text-sm sm:text-base w-full"
                value={searchTerm}
                onChange={(e) => dispatch(setSearchTerm(e.target.value))}
              />
            </div>

            <div className="flex flex-col gap-3 sm:gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex-1 min-w-0">
                <GenericFilter
                  filtersConfig={filtersConfig}
                  activeFilters={filters}
                  onFilterChange={handleFilterChange}
                  onClearAll={handleClearAllFilters}
                />
              </div>

              <div className="flex-shrink-0">
                <ColumnVisibilityDropdown
                  columns={allColumns}
                  onChange={setVisibleColumns}
                />
              </div>
            </div>
          </div>

          <div className="w-full overflow-hidden rounded-md">
            <div className="overflow-x-auto">
              <Separator />
              <Table className="min-w-full">
                <GenericTableHeader columns={allColumns} visibleColumns={visibleColumns} />

                {isDataLoading ? (
                  <TableBody>
                    <TableRow className="hover:bg-slate-50">
                      <TableCell colSpan={allColumns.filter(col => visibleColumns[col.key]).length + 2} className="h-32 sm:h-40 text-center">
                        <div className="flex flex-col items-center justify-center space-y-3 py-4">
                          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">Loading products...</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                ) : error ? (
                  <TableBody>
                    <TableRow className="hover:bg-slate-50">
                      <TableCell colSpan={allColumns.filter(col => visibleColumns[col.key]).length + 2} className="h-32 sm:h-40 text-center">
                        <div className="flex flex-col items-center justify-center space-y-3 py-4 px-4">
                          <AlertCircle className="h-5 w-5 text-destructive" />
                          <p className="text-sm text-destructive text-center">Failed to load products. Please try again.</p>
                          <Button variant="outline" size="sm" onClick={refetch} className="w-full sm:w-auto">
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Retry
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                ) : (
                  <GenericTableBody
                    data={paginatedProducts}
                    allColumns={allColumns}
                    visibleColumns={visibleColumns}
                    emptyState={emptyState}
                    renderActions={renderProductActions}
                    avatarIcon={<Package className="h-4 w-4 text-primary" />}
                  />
                )}
              </Table>
              <Separator />
            </div>
          </div>

          <div className="flex justify-center pt-2">
            <GenericPagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        </CardContent>
      </Card>

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
