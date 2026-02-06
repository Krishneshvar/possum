import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableHeader, TableRow, TableCell } from "@/components/ui/table";
import { Search, Loader2, AlertCircle, RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

import GenericTableHeader from "@/components/common/GenericTableHeader";
import GenericTableBody from "@/components/common/GenericTableBody";
import GenericPagination from "@/components/common/GenericPagination";
import GenericFilter from "@/components/common/GenericFilter";
import ColumnVisibilityDropdown from "@/components/common/ColumnVisibilityDropdown";

export default function DataTable({
    // Data & Columns
    data = [],
    columns = [],
    isLoading = false,
    error = null,
    onRetry,

    // Search
    searchTerm = "",
    onSearchChange,
    searchPlaceholder = "Search...",

    // Sorting
    sortBy,
    sortOrder,
    onSort,

    // Pagination
    currentPage = 1,
    totalPages = 1,
    onPageChange,

    // Filters
    filtersConfig,
    activeFilters,
    onFilterChange,
    onClearAllFilters,

    // Content
    emptyState,
    renderActions,
    avatarIcon,
}) {
    const [visibleColumns, setVisibleColumns] = useState(
        columns.reduce((acc, col) => {
            acc[col.key] = col.defaultVisible !== false;
            return acc;
        }, {})
    );

    const getVisibleColumnCount = () => {
        return Object.values(visibleColumns).filter(Boolean).length + (renderActions ? 1 : 0) + 1; // +1 for avatar
    };

    return (
        <Card className="border-border/50 shadow-sm w-full overflow-hidden">
            <CardContent className="pb-0">
                {/* Search Bar - Top Left Corner */}
                <div className="p-4 sm:p-6 pb-0">
                    <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
                        {onSearchChange && (
                            <div className="relative w-full sm:max-w-md">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    placeholder={searchPlaceholder}
                                    className="pl-10 h-10 sm:h-11 focus:border-border bg-background text-sm sm:text-base w-full"
                                    value={searchTerm}
                                    onChange={(e) => onSearchChange(e.target.value)}
                                />
                                {searchTerm && (
                                    <button
                                        onClick={() => onSearchChange("")}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                )}
                            </div>
                        )}

                        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                            <ColumnVisibilityDropdown
                                columns={columns}
                                onChange={setVisibleColumns}
                            />
                        </div>
                    </div>
                </div>

                {/* Filters - Below Search Bar */}
                {filtersConfig && (
                    <div className="px-4 sm:px-6 pt-3">
                        <GenericFilter
                            filtersConfig={filtersConfig}
                            activeFilters={activeFilters}
                            onFilterChange={onFilterChange}
                            onClearAll={onClearAllFilters}
                        />
                    </div>
                )}

                {/* Table Area - Below Filters */}
                <div className="p-4 sm:p-6 pt-4">
                    <div className="w-full border rounded-md border-border overflow-hidden">
                        <div className="overflow-x-auto">
                            <Table>
                                <GenericTableHeader
                                    columns={columns}
                                    visibleColumns={visibleColumns}
                                    onSort={onSort}
                                    sortBy={sortBy}
                                    sortOrder={sortOrder}
                                />

                                {isLoading ? (
                                    <TableBody>
                                        <TableRow className="hover:bg-muted/50">
                                            <TableCell colSpan={getVisibleColumnCount()} className="h-32 sm:h-40 text-center">
                                                <div className="flex flex-col items-center justify-center space-y-3 py-4">
                                                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                                                    <p className="text-sm text-muted-foreground">Loading data...</p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    </TableBody>
                                ) : error ? (
                                    <TableBody>
                                        <TableRow className="hover:bg-muted/50">
                                            <TableCell colSpan={getVisibleColumnCount()} className="h-32 sm:h-40 text-center">
                                                <div className="flex flex-col items-center justify-center space-y-3 py-4 px-4">
                                                    <AlertCircle className="h-5 w-5 text-destructive" />
                                                    <p className="text-sm text-destructive text-center">Failed to load data.</p>
                                                    {onRetry && (
                                                        <Button variant="outline" size="sm" onClick={onRetry} className="w-full sm:w-auto">
                                                            <RefreshCw className="mr-2 h-4 w-4" />
                                                            Retry
                                                        </Button>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    </TableBody>
                                ) : (
                                    <GenericTableBody
                                        data={data}
                                        allColumns={columns}
                                        visibleColumns={visibleColumns}
                                        emptyState={emptyState}
                                        renderActions={renderActions}
                                        avatarIcon={avatarIcon}
                                    />
                                )}
                            </Table>
                        </div>
                    </div>
                </div>

                {/* Pagination - Below Table */}
                {onPageChange && totalPages > 1 && (
                    <div className="px-4 sm:px-6 pb-6 sm:pb-6 pt-0">
                        <div className="flex justify-center pt-2">
                            <GenericPagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={onPageChange}
                            />
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
