import { ClipboardCheck, Eye } from "lucide-react"
import { useState, useMemo } from "react"
import { useSelector, useDispatch } from "react-redux"
import { DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { useGetAuditLogsQuery } from "@/services/auditLogApi"
import { setSearchTerm, setCurrentPage, setSort, setFilter, clearAllFilters } from "../auditLogSlice"
import ActionsDropdown from "@/components/common/ActionsDropdown"
import { allColumns } from "./auditLogTableContents"
import DataTable from "@/components/common/DataTable"
import { actionFilter, resourceFilter } from "../data/auditLogFiltersConfig"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { format } from "date-fns"

export default function AuditLogTable() {
    const dispatch = useDispatch()
    const { searchTerm, currentPage, itemsPerPage, filters, sortBy, sortOrder } = useSelector((state) => state.auditLog)

    const { data, isLoading, isFetching, error, refetch } = useGetAuditLogsQuery({
        page: currentPage,
        limit: itemsPerPage,
        searchTerm: searchTerm,
        action: filters.action,
        tableName: filters.tableName,
        userId: filters.userId,
        startDate: filters.startDate,
        endDate: filters.endDate,
        sortBy: sortBy,
        sortOrder: sortOrder,
    });

    const logs = data?.logs || []
    const totalPages = data?.totalPages || 1;
    const isDataLoading = isLoading || isFetching

    const [selectedLog, setSelectedLog] = useState(null)
    const [isDetailsOpen, setIsDetailsOpen] = useState(false)

    const handleFilterChange = (key, value) => {
        dispatch(setFilter({ key, value }))
    }

    const handleClearAllFilters = () => {
        dispatch(clearAllFilters())
    }

    const handlePageChange = (page) => {
        dispatch(setCurrentPage(page))
    }

    const handleViewDetails = (log) => {
        setSelectedLog(log)
        setIsDetailsOpen(true)
    }

    const emptyState = (
        <div className="flex flex-col items-center gap-2 py-8 px-4 text-center">
            <ClipboardCheck className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm font-medium text-muted-foreground">No audit logs found</p>
            <p className="text-xs text-muted-foreground max-w-sm">Try adjusting your filters or search</p>
        </div>
    )

    const renderLogActions = (log) => (
        <ActionsDropdown>
            <DropdownMenuItem onClick={() => handleViewDetails(log)} className="cursor-pointer">
                <Eye className="mr-2 h-4 w-4" />
                <span>View Full Details</span>
            </DropdownMenuItem>
        </ActionsDropdown>
    )

    const filtersConfig = [
        actionFilter,
        resourceFilter,
    ];

    const parseJson = (data) => {
        if (!data) return null;
        try {
            return typeof data === 'string' ? JSON.parse(data) : data;
        } catch (e) {
            return data;
        }
    }

    return (
        <>
            <DataTable
                data={logs}
                columns={allColumns}
                isLoading={isDataLoading}
                error={error}
                onRetry={refetch}

                searchTerm={searchTerm}
                onSearchChange={(value) => dispatch(setSearchTerm(value))}
                searchPlaceholder="Search logs..."

                sortBy={sortBy}
                sortOrder={sortOrder}
                onSort={(key, order) => dispatch(setSort({ sortBy: key, sortOrder: order }))}

                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}

                filtersConfig={filtersConfig}
                activeFilters={filters}
                onFilterChange={handleFilterChange}
                onClearAllFilters={handleClearAllFilters}

                emptyState={emptyState}
                renderActions={renderLogActions}
                avatarIcon={<ClipboardCheck className="h-4 w-4 text-primary" />}
            />

            <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
                <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle>Audit Log Details</DialogTitle>
                    </DialogHeader>
                    <ScrollArea className="flex-1 mt-4">
                        <div className="space-y-6 pr-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-muted-foreground">Action</p>
                                    <p className="font-medium capitalize">{selectedLog?.action}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">User</p>
                                    <p className="font-medium">{selectedLog?.user_name || 'System'}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Resource</p>
                                    <p className="font-medium capitalize">{selectedLog?.table_name?.replace(/_/g, ' ') || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Resource ID</p>
                                    <p className="font-medium">{selectedLog?.row_id || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Timestamp</p>
                                    <p className="font-medium">{selectedLog && format(new Date(selectedLog.created_at), "MMM dd, yyyy HH:mm:ss")}</p>
                                </div>
                            </div>

                            {selectedLog?.event_details && (
                                <div>
                                    <p className="text-sm font-semibold mb-2">Event Details</p>
                                    <pre className="bg-muted p-3 rounded-md text-xs overflow-auto">
                                        {JSON.stringify(parseJson(selectedLog.event_details), null, 2)}
                                    </pre>
                                </div>
                            )}

                            {selectedLog?.old_data && (
                                <div>
                                    <p className="text-sm font-semibold mb-2">Previous Data</p>
                                    <pre className="bg-muted p-3 rounded-md text-xs overflow-auto max-h-40">
                                        {JSON.stringify(parseJson(selectedLog.old_data), null, 2)}
                                    </pre>
                                </div>
                            )}

                            {selectedLog?.new_data && (
                                <div>
                                    <p className="text-sm font-semibold mb-2">New Data</p>
                                    <pre className="bg-muted p-3 rounded-md text-xs overflow-auto max-h-40">
                                        {JSON.stringify(parseJson(selectedLog.new_data), null, 2)}
                                    </pre>
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                </DialogContent>
            </Dialog>
        </>
    );
}
