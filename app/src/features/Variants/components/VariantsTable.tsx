import { Eye, Edit, Package2 } from "lucide-react"
import { Link } from "react-router-dom"
import { useSelector, useDispatch } from "react-redux"
import { DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { useGetVariantsQuery } from "@/services/productsApi"
import { setSearchTerm, setCurrentPage, setSorting } from "../variantsSlice"
import ActionsDropdown from "@/components/common/ActionsDropdown"
import { allColumns } from "./variantsTableContents"
import DataTable from "@/components/common/DataTable"

export default function VariantsTable() {
    const dispatch = useDispatch()
    const { searchTerm, currentPage, itemsPerPage, sortBy, sortOrder } = useSelector((state: any) => state.variants)

    const { data, isLoading, isFetching, error, refetch } = useGetVariantsQuery({
        page: currentPage,
        limit: itemsPerPage,
        searchTerm: searchTerm,
        sortBy,
        sortOrder
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

    const renderActions = (variant: any) => (
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
    )

    return (
        <DataTable
            data={variants}
            // @ts-ignore
            columns={allColumns}
            isLoading={isDataLoading}
            // @ts-ignore
            error={error?.message}
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

            emptyState={emptyState}
            renderActions={renderActions}
        />
    );
}
