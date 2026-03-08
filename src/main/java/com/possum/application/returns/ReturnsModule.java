package com.possum.application.returns;

import com.possum.application.inventory.InventoryService;
import com.possum.infrastructure.serialization.JsonService;
import com.possum.persistence.db.TransactionManager;
import com.possum.persistence.repositories.interfaces.AuditRepository;
import com.possum.persistence.repositories.interfaces.ReturnsRepository;
import com.possum.persistence.repositories.interfaces.SalesRepository;

public class ReturnsModule {
    private final ReturnsService returnsService;

    public ReturnsModule(ReturnsRepository returnsRepository,
                         SalesRepository salesRepository,
                         InventoryService inventoryService,
                         AuditRepository auditRepository,
                         TransactionManager transactionManager,
                         JsonService jsonService) {
        this.returnsService = new ReturnsService(
                returnsRepository,
                salesRepository,
                inventoryService,
                auditRepository,
                transactionManager,
                jsonService
        );
    }

    public ReturnsService getReturnsService() {
        return returnsService;
    }
}
