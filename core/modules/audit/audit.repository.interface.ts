export interface AuditLogFilters {
    tableName?: string;
    rowId?: number;
    userId?: number;
    action?: string;
    startDate?: string;
    endDate?: string;
    searchTerm?: string;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
    currentPage?: number;
    itemsPerPage?: number;
}

export interface IAuditRepository {
    insertAuditLog(logData: {
        user_id: number;
        action: string;
        table_name: string | null;
        row_id: number | null;
        old_data: any | null;
        new_data: any | null;
        event_details: any | null;
    }): any;
    
    findAuditLogs(params: AuditLogFilters): {
        logs: any[];
        totalCount: number;
        totalPages: number;
        currentPage: number;
    };
}
