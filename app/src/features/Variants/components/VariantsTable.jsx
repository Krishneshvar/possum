import { Eye, Edit, Search, Loader2, RefreshCw, AlertCircle, Package2 } from "lucide-react"
import { Link } from "react-router-dom"
import { useState } from "react"
import { useSelector, useDispatch } from "react-redux"
import { Card, CardContent } from "@/components/ui/card"
import { DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableRow, TableCell } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useGetVariantsQuery } from "@/services/productsApi"
import { setSearchTerm, setCurrentPage, setSorting } from "../variantsSlice"
import { Separator } from "@/components/ui/separator"
import GenericTableHeader from "@/components/common/GenericTableHeader"
import GenericTableBody from "@/components/common/GenericTableBody"
import GenericPagination from "@/components/common/GenericPagination"
import ActionsDropdown from "@/components/common/ActionsDropdown"
import { allColumns } from "./variantsTableContents.jsx"

export default function VariantsTable() {
    const dispatch = useDispatch()
    const { searchTerm, currentPage, itemsPerPage, sortBy, sortOrder } = useSelector((state) => state.variants)

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

    const [visibleColumns] = useState(
        allColumns.reduce((acc, col) => {
            acc[col.key] = true
            return acc
        }, {})
    )

    const handlePageChange = (page) => {
        dispatch(setCurrentPage(page))
    }

    const handleSort = (sortBy, sortOrder) => {
        dispatch(setSorting({ sortBy, sortOrder }))
    }

    const emptyState = (
        <div className="flex flex-col items-center gap-2 py-8 px-4 text-center">
            <Package2 className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm font-medium text-muted-foreground">No variants found</p>
            <p className="text-xs text-muted-foreground max-w-sm">Try adjusting your search</p>
        </div>
    )

    const renderActions = (variant) => (
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
        <Card className="border-border/50 shadow-sm w-full overflow-hidden">
            <CardContent className="space-y-4 pt-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="relative w-full sm:max-w-md">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Search variants by name, product or SKU..."
                            className="pl-10 h-10 focus:border-border bg-background"
                            value={searchTerm}
                            onChange={(e) => dispatch(setSearchTerm(e.target.value))}
                        />
                    </div>
                </div>

                <div className="w-full">
                    <div className="overflow-x-auto mb-2">
                        <Table>
                            <GenericTableHeader
                                columns={allColumns}
                                visibleColumns={visibleColumns}
                                onSort={handleSort}
                                sortBy={sortBy}
                                sortOrder={sortOrder}
                            />

                            {isDataLoading ? (
                                <TableBody>
                                    <TableRow>
                                        <TableCell colSpan={allColumns.length + 1} className="h-32 text-center">
                                            <div className="flex flex-col items-center justify-center space-y-3">
                                                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                                                <p className="text-sm text-muted-foreground">Loading variants...</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                </TableBody>
                            ) : error ? (
                                <TableBody>
                                    <TableRow>
                                        <TableCell colSpan={allColumns.length + 1} className="h-32 text-center">
                                            <div className="flex flex-col items-center justify-center space-y-3 px-4">
                                                <AlertCircle className="h-5 w-5 text-destructive" />
                                                <p className="text-sm text-destructive text-center">Failed to load variants. Please try again.</p>
                                                <Button variant="outline" size="sm" onClick={refetch}>
                                                    <RefreshCw className="mr-2 h-4 w-4" />
                                                    Retry
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                </TableBody>
                            ) : (
                                <GenericTableBody
                                    data={variants}
                                    allColumns={allColumns}
                                    visibleColumns={visibleColumns}
                                    emptyState={emptyState}
                                    renderActions={renderActions}
                                />
                            )}
                        </Table>
                        <Separator />
                    </div>

                    <div className="flex justify-center">
                        <GenericPagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={handlePageChange}
                        />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
