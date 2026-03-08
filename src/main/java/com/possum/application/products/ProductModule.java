package com.possum.application.products;

import com.possum.application.variants.VariantService;
import com.possum.infrastructure.filesystem.AppPaths;
import com.possum.persistence.db.TransactionManager;
import com.possum.persistence.repositories.interfaces.AuditRepository;
import com.possum.persistence.repositories.interfaces.InventoryRepository;
import com.possum.persistence.repositories.interfaces.ProductRepository;
import com.possum.persistence.repositories.interfaces.VariantRepository;

public class ProductModule {
    private final ProductService productService;
    private final VariantService variantService;

    public ProductModule(ProductRepository productRepository,
                         VariantRepository variantRepository,
                         InventoryRepository inventoryRepository,
                         AuditRepository auditRepository,
                         TransactionManager transactionManager,
                         AppPaths appPaths) {
        this.variantService = new VariantService(
                variantRepository,
                inventoryRepository,
                auditRepository,
                transactionManager
        );

        this.productService = new ProductService(
                productRepository,
                variantService,
                auditRepository,
                transactionManager,
                appPaths
        );
    }

    public ProductService getProductService() {
        return productService;
    }

    public VariantService getVariantService() {
        return variantService;
    }
}
