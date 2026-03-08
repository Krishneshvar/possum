package com.possum.persistence.repositories.interfaces;

import com.possum.domain.model.AuditLog;
import com.possum.shared.dto.AuditLogFilter;
import com.possum.shared.dto.PagedResult;

public interface AuditRepository {
    long insertAuditLog(AuditLog auditLog);

    PagedResult<AuditLog> findAuditLogs(AuditLogFilter filter);
    
    AuditLog findAuditLogById(Long id);
}
