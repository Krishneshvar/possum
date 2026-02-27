import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { ClipboardCheck, Eye } from 'lucide-react';
import { useGetAuditLogsQuery } from '@/services/auditLogApi';
import { setSearchTerm, setCurrentPage, setSort, setFilter, clearAllFilters, setDateRange } from '../auditLogSlice';
import type { RootState } from '@/store/store';
import type { AuditLog } from '@shared/index';
import DataTable from '@/components/common/DataTable';
import ActionsDropdown from '@/components/common/ActionsDropdown';
import { DropdownMenuItem, DropdownMenuLabel } from '@/components/ui/dropdown-menu';
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { allColumns } from './auditLogTableContents';
import { actionFilter, resourceFilter } from '../data/auditLogFiltersConfig';
import AuditLogDetailsDialog from './AuditLogDetailsDialog';
import DateRangeFilter from '@/components/common/DateRangeFilter';

export default function AuditLogTable() {
    const dispatch = useDispatch();
    const auditLogState = useSelector((state: RootState) => state.auditLog);
    const { searchTerm, currentPage, itemsPerPage, sortBy, sortOrder, filters } = auditLogState;
    const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);

    const { data, isLoading: isDataLoading, error, refetch } = useGetAuditLogsQuery({
        page: currentPage,
        limit: itemsPerPage,
        searchTerm,
        sortBy,
        sortOrder,
        ...filters,
    });

    const logs = (data?.logs || []) as AuditLog[];
    const totalPages = data?.totalPages || 1;

    const handleFilterChange = ({ key, value }: { key: string, value: string[] }) => {
        dispatch(setFilter({ key, value }));
    }

    const handleClearAllFilters = () => {
        dispatch(clearAllFilters());
    }

    const handleDateRangeApply = (start: string, end: string) => {
        dispatch(setDateRange({ startDate: start, endDate: end }));
    }

    const handlePageChange = (page: number) => {
        dispatch(setCurrentPage(page));
    }

    const handleViewDetails = (log: AuditLog) => {
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

    const renderLogActions = (log: AuditLog) => (
        <div className="flex items-center justify-end gap-1">
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-primary hidden md:flex"
                        onClick={() => handleViewDetails(log)}
                        aria-label="View log details"
                    >
                        <Eye className="h-4 w-4" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent>View Details</TooltipContent>
            </Tooltip>
            <div className="md:hidden">
                <ActionsDropdown>
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => handleViewDetails(log)} className="cursor-pointer">
                        <Eye className="mr-2 h-4 w-4" />
                        <span>View Full Details</span>
                    </DropdownMenuItem>
                </ActionsDropdown>
            </div>
        </div>
    );

    const filtersConfig = [
        actionFilter,
        resourceFilter,
    ];

    const isAnyFilterActive = filters.action?.length > 0 ||
        filters.resource?.length > 0 ||
        !!filters.startDate ||
        !!filters.endDate;

    return (
        <>
            <DataTable
                data={logs}
                columns={allColumns}
                isLoading={isDataLoading}
                error={(error as any)?.message}
                onRetry={refetch}

                searchTerm={searchTerm}
                onSearchChange={(value) => dispatch(setSearchTerm(value))}
                searchPlaceholder="Search logs..."

                sortBy={sortBy}
                sortOrder={sortOrder}
                onSort={(column: any) => dispatch(setSort({ sortBy: column.sortField, sortOrder: sortBy === column.sortField && sortOrder === 'ASC' ? 'DESC' : 'ASC' }))}

                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}

                filtersConfig={filtersConfig}
                customFilters={<DateRangeFilter startDate={filters.startDate} endDate={filters.endDate} onApply={handleDateRangeApply} />}
                activeFilters={filters}
                onFilterChange={handleFilterChange}
                onClearAllFilters={handleClearAllFilters}
                isAnyFilterActive={isAnyFilterActive}

                emptyState={emptyState}
                renderActions={renderLogActions}
                avatarIcon={<ClipboardCheck className="h-4 w-4 text-primary" />}
            />

            <AuditLogDetailsDialog
                log={selectedLog}
                open={isDetailsOpen}
                onOpenChange={setIsDetailsOpen}
            />
        </>
    );
}
