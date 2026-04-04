package com.possum.application.sales;

import com.possum.application.inventory.InventoryService;
import com.possum.infrastructure.filesystem.SettingsStore;
import com.possum.infrastructure.serialization.JsonService;
import com.possum.persistence.db.TransactionManager;
import com.possum.persistence.repositories.interfaces.*;

public class SalesModule {
    private final SalesService salesService;
    private final TaxEngine taxEngine;
    private final PaymentService paymentService;

    public SalesModule(SalesRepository salesRepository,
                       VariantRepository variantRepository,
                       ProductRepository productRepository,
                       CustomerRepository customerRepository,
                       AuditRepository auditRepository,
                       TaxRepository taxRepository,
                       InventoryService inventoryService,
                       TransactionManager transactionManager,
                       JsonService jsonService,
                       SettingsStore settingsStore) {
        
        this.taxEngine = new TaxEngine(taxRepository, jsonService);
        this.paymentService = new PaymentService(salesRepository);
        this.salesService = new SalesService(
                salesRepository,
                variantRepository,
                productRepository,
                customerRepository,
                auditRepository,
                inventoryService,
                taxEngine,
                paymentService,
                transactionManager,
                jsonService,
                settingsStore
        );
    }

    public SalesService getSalesService() {
        return salesService;
    }

    public TaxEngine getTaxEngine() {
        return taxEngine;
    }

    public PaymentService getPaymentService() {
        return paymentService;
    }
}
