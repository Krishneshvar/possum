import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { ClipboardCheck, Eye } from 'lucide-react';
import { format } from 'date-fns';

import { useGetAuditLogsQuery } from '@/services/auditLogApi';
import { setSearchTerm, setCurrentPage, setSort, setFilter, clearAllFilters } from '../auditLogSlice';
import DataTable from '@/components/common/DataTable';
import ActionsDropdown from '@/components/common/ActionsDropdown';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

import { allColumns } from './auditLogTableContents';
import { actionFilter, resourceFilter } from '../data/auditLogFiltersConfig';

export default function AuditLogTable() {
    const dispatch = useDispatch();
    const { searchTerm, currentPage, itemsPerPage, sortBy, sortOrder, filters } = useSelector((state: any) => state.auditLog);
    const [selectedLog, setSelectedLog] = useState<any>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);

    const { data, isLoading: isDataLoading, error, refetch } = useGetAuditLogsQuery({
        page: currentPage,
        limit: itemsPerPage,
        searchTerm,
        sortBy,
        sortOrder,
        ...filters,
    });

    const logs = data?.logs || [];
    const totalPages = data?.totalPages || 1;

    const handleFilterChange = ({ key, value }: { key: string, value: string[] }) => {
        dispatch(setFilter({ key, value }));
    }

    const handleClearAllFilters = () => {
        dispatch(clearAllFilters());
    }

    const handlePageChange = (page: number) => {
        dispatch(setCurrentPage(page));
    }

    const handleViewDetails = (log: any) => {
        setSelectedLog(log);
        setIsDetailsOpen(true);
    }

    const emptyState = (
        <div className="flex flex-col items-center gap-2 py-8 px-4 text-center">
            <ClipboardCheck className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm font-medium text-muted-foreground">No audit logs found</p>
            <p className="text-xs text-muted-foreground max-w-sm">Try adjusting your filters or search</p>
        </div>
    );

    const renderLogActions = (log: any) => (
        <ActionsDropdown>
            <DropdownMenuItem onClick={() => handleViewDetails(log)} className="cursor-pointer">
                <Eye className="mr-2 h-4 w-4" />
                <span>View Full Details</span>
            </DropdownMenuItem>
        </ActionsDropdown>
    );

    const filtersConfig = [
        actionFilter,
        resourceFilter,
    ];

    const parseJson = (data: any) => {
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
                // @ts-ignore
                columns={allColumns}
                isLoading={isDataLoading}
                // @ts-ignore
                error={error?.message}
                onRetry={refetch}

                searchTerm={searchTerm}
                onSearchChange={(value) => dispatch(setSearchTerm(value))}
                searchPlaceholder="Search logs..."

                sortBy={sortBy}
                sortOrder={sortOrder}
                // @ts-ignore
                onSort={(column) => dispatch(setSort({ sortBy: column.sortField, sortOrder: sortOrder === 'ASC' ? 'DESC' : 'ASC' }))}

                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}

                filtersConfig={filtersConfig}
                activeFilters={filters}
                onFilterChange={handleFilterChange}
                onClearAllFilters={handleClearAllFilters}

                emptyState={emptyState}
                renderActions={renderLogActions}
                // @ts-ignore
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
