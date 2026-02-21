import { Eye, Edit, Package2 } from "lucide-react"
import { Link } from "react-router-dom"
import { useSelector, useDispatch } from "react-redux"
import { DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useGetVariantsQuery } from "@/services/variantsApi"
import { setSearchTerm, setCurrentPage, setSorting, setFilter, clearAllFilters, VariantsState } from "../variantsSlice"
import type { RootState } from "@/store/store"
import ActionsDropdown from "@/components/common/ActionsDropdown"
import { allColumns } from "./variantsTableContents"
import DataTable from "@/components/common/DataTable"
import { statusFilter, stockStatusFilter, categoryFilter } from "../data/variantsFiltersConfig"
import { useGetCategoriesQuery } from "@/services/categoriesApi"
import { flattenCategories } from "@/utils/categories.utils"

export default function VariantsTable() {
    const dispatch = useDispatch()
    const { searchTerm, currentPage, itemsPerPage, sortBy, sortOrder, filters } = useSelector((state: any) => state.variants)

    const { data: categoriesData } = useGetCategoriesQuery();

    const { data, isLoading, isFetching, error, refetch } = useGetVariantsQuery({
        page: currentPage,
        limit: itemsPerPage,
        searchTerm: searchTerm,
        sortBy,
        sortOrder,
        stockStatus: filters.stockStatus,
        status: filters.status,
        categories: filters.categories
    });

    const variants = data?.variants || []
    const totalPages = data?.totalPages || 1;
    const isDataLoading = isLoading || isFetching

    const handlePageChange = (page: number) => {
        dispatch(setCurrentPage(page))
    }

    const handleSort = (column: any) => {
        const order = sortBy === column.sortField && sortOrder === 'ASC' ? 'DESC' : 'ASC';
        dispatch(setSorting({ sortBy: column.sortField, sortOrder: order }))
    }

    const emptyState = (
        <div className="flex flex-col items-center gap-2 py-8 px-4 text-center">
            <Package2 className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm font-medium text-muted-foreground">No variants found</p>
            <p className="text-xs text-muted-foreground max-w-sm">Try adjusting your search</p>
        </div>
    )

    const renderActions = (variant: { product_id: number; product_name: string }) => (
        <div className="flex items-center justify-end gap-1">
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-primary hidden md:flex"
                        asChild
                        aria-label={`View product ${variant.product_name}`}
                    >
                        <Link to={`/products/${variant.product_id}`}>
                            <Eye className="h-4 w-4" />
                        </Link>
                    </Button>
                </TooltipTrigger>
                <TooltipContent>View Product</TooltipContent>
            </Tooltip>

            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-primary hidden md:flex"
                        asChild
                        aria-label={`Edit product ${variant.product_name}`}
                    >
                        <Link to={`/products/edit/${variant.product_id}`}>
                            <Edit className="h-4 w-4" />
                        </Link>
                    </Button>
                </TooltipTrigger>
                <TooltipContent>Edit Product</TooltipContent>
            </Tooltip>

            <div className="md:hidden">
                <ActionsDropdown>
                    <DropdownMenuItem asChild>
                        <Link to={`/products/${variant.product_id}`} className="cursor-pointer">
                            <Eye className="mr-2 h-4 w-4" />
                            <span>View Product</span>
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                        <Link to={`/products/edit/${variant.product_id}`} className="cursor-pointer">
                            <Edit className="mr-2 h-4 w-4" />
                            <span>Edit Product</span>
                        </Link>
                    </DropdownMenuItem>
                </ActionsDropdown>
            </div>
        </div>
    )

    return (
        <DataTable
            data={variants}
            columns={allColumns}
            isLoading={isDataLoading}
            error={error && 'message' in error ? (error as { message: string }).message : undefined}
            onRetry={refetch}

            searchTerm={searchTerm}
            onSearchChange={(value) => dispatch(setSearchTerm(value))}
            searchPlaceholder="Search variants by name, product or SKU..."

            sortBy={sortBy}
            sortOrder={sortOrder}
            onSort={handleSort}

            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}

            filtersConfig={[
                statusFilter,
                stockStatusFilter,
                categoryFilter(flattenCategories(categoriesData || []))
            ]}
            activeFilters={filters}
            onFilterChange={(payload) => dispatch(setFilter(payload as { key: keyof VariantsState['filters']; value: string[] }))}
            onClearAllFilters={() => dispatch(clearAllFilters())}

            emptyState={emptyState}
            renderActions={renderActions}
        />
    );
}
