package com.possum.application.products;

import com.possum.application.variants.VariantService;
import com.possum.domain.exceptions.NotFoundException;
import com.possum.domain.exceptions.ValidationException;
import com.possum.domain.model.Product;
import com.possum.domain.model.TaxRule;
import com.possum.domain.model.Variant;
import com.possum.infrastructure.filesystem.AppPaths;
import com.possum.infrastructure.logging.LoggingConfig;
import com.possum.persistence.db.TransactionManager;
import com.possum.persistence.repositories.interfaces.AuditRepository;
import com.possum.persistence.repositories.interfaces.ProductRepository;
import com.possum.shared.dto.PagedResult;
import com.possum.shared.dto.ProductFilter;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Map;

public class ProductService {
    private final ProductRepository productRepository;
    private final VariantService variantService;
    private final AuditRepository auditRepository;
    private final TransactionManager transactionManager;
    private final AppPaths appPaths;

    public ProductService(ProductRepository productRepository,
                          VariantService variantService,
                          AuditRepository auditRepository,
                          TransactionManager transactionManager,
                          AppPaths appPaths) {
        this.productRepository = productRepository;
        this.variantService = variantService;
        this.auditRepository = auditRepository;
        this.transactionManager = transactionManager;
        this.appPaths = appPaths;
    }

    public long createProductWithVariants(CreateProductCommand command) {
        if (command.variants() == null || command.variants().isEmpty()) {
            throw new ValidationException("At least one variant is required");
        }

        return transactionManager.runInTransaction(() -> {
            Product product = new Product(
                    null,
                    command.name(),
                    command.description(),
                    command.categoryId(),
                    null,
                    command.taxIds() != null && !command.taxIds().isEmpty() ? command.taxIds().get(0) : null,
                    command.status() != null ? command.status() : "active",
                    command.imagePath(),
                    null,
                    null,
                    null,
                    null
            );

            long productId = productRepository.insertProduct(product);

            for (var variantCmd : command.variants()) {
                variantService.addVariantWithoutTransaction(new VariantService.AddVariantCommand(
                        productId,
                        variantCmd.name(),
                        variantCmd.sku(),
                        variantCmd.price(),
                        variantCmd.costPrice(),
                        variantCmd.stockAlertCap(),
                        variantCmd.isDefault(),
                        variantCmd.status(),
                        null,
                        command.userId()
                ));
            }

            auditRepository.insertAuditLog(createAuditLog(
                    command.userId(),
                    "CREATE",
                    "products",
                    productId,
                    null,
                    String.format("{\"name\":\"%s\",\"description\":\"%s\",\"category_id\":%s,\"status\":\"%s\",\"image_path\":\"%s\"}",
                            command.name(), command.description(), command.categoryId(), command.status(), command.imagePath())
            ));

            return productId;
        });
    }

    public ProductWithVariantsDTO getProductWithVariants(long id) {
        var result = productRepository.findProductWithVariants(id)
                .orElseThrow(() -> new NotFoundException("Product not found"));

        List<TaxRule> taxes = productRepository.findProductTaxes(id);

        return new ProductWithVariantsDTO(result.product(), result.variants(), taxes);
    }

    public PagedResult<Product> getProducts(ProductFilter filter) {
        return productRepository.findProducts(filter);
    }

    public Map<String, Object> getProductStats() {
        return productRepository.getProductStats();
    }

    public void updateProduct(long productId, UpdateProductCommand command) {
        transactionManager.runInTransaction(() -> {
            Product oldProduct = productRepository.findProductById(productId)
                    .orElseThrow(() -> new NotFoundException("Product not found"));

            String imagePath = command.newImagePath() != null ? command.newImagePath() : oldProduct.imagePath();
            Long taxCategoryId = oldProduct.taxCategoryId();

            if (command.taxIds() != null) {
                taxCategoryId = command.taxIds() != null && !command.taxIds().isEmpty() ? command.taxIds().get(0) : null;
            }

            if (command.variants() != null) {
                for (var variantCmd : command.variants()) {
                    if (variantCmd.id() != null) {
                        variantService.validateVariantOwnership(variantCmd.id(), productId);
                        variantService.updateVariantWithoutTransaction(new VariantService.UpdateVariantCommand(
                                variantCmd.id(),
                                variantCmd.name(),
                                variantCmd.sku(),
                                variantCmd.price(),
                                variantCmd.costPrice(),
                                variantCmd.stockAlertCap(),
                                variantCmd.isDefault(),
                                variantCmd.status(),
                                null,
                                null,
                                command.userId()
                        ));
                    } else {
                        variantService.addVariantWithoutTransaction(new VariantService.AddVariantCommand(
                                productId,
                                variantCmd.name(),
                                variantCmd.sku(),
                                variantCmd.price(),
                                variantCmd.costPrice(),
                                variantCmd.stockAlertCap(),
                                variantCmd.isDefault(),
                                variantCmd.status(),
                                null,
                                command.userId()
                        ));
                    }
                }
            }

            Product updatedProduct = new Product(
                    productId,
                    command.name() != null ? command.name() : oldProduct.name(),
                    command.description() != null ? command.description() : oldProduct.description(),
                    command.categoryId() != null ? command.categoryId() : oldProduct.categoryId(),
                    null,
                    taxCategoryId,
                    command.status() != null ? command.status() : oldProduct.status(),
                    imagePath,
                    null,
                    null,
                    null,
                    null
            );

            int changes = productRepository.updateProductById(productId, updatedProduct);

            if (command.newImagePath() != null && oldProduct.imagePath() != null) {
                deleteImageFile(oldProduct.imagePath());
            }

            if (changes > 0) {
                Product newProduct = productRepository.findProductById(productId).orElse(null);
                auditRepository.insertAuditLog(createAuditLog(
                        command.userId(),
                        "UPDATE",
                        "products",
                        productId,
                        String.format("{\"name\":\"%s\",\"description\":\"%s\"}", oldProduct.name(), oldProduct.description()),
                        String.format("{\"name\":\"%s\",\"description\":\"%s\"}", newProduct.name(), newProduct.description())
                ));
            }

            return null;
        });
    }

    public void deleteProduct(long id, long userId) {
        transactionManager.runInTransaction(() -> {
            Product oldProduct = productRepository.findProductById(id)
                    .orElseThrow(() -> new NotFoundException("Product not found"));

            int changes = productRepository.softDeleteProduct(id);

            if (changes > 0 && oldProduct.imagePath() != null) {
                deleteImageFile(oldProduct.imagePath());
            }

            if (changes > 0) {
                auditRepository.insertAuditLog(createAuditLog(
                        userId,
                        "DELETE",
                        "products",
                        id,
                        String.format("{\"name\":\"%s\",\"description\":\"%s\"}", oldProduct.name(), oldProduct.description()),
                        null
                ));
            }

            return null;
        });
    }

    private void deleteImageFile(String imagePath) {
        try {
            Path path = Paths.get(imagePath);
            if (Files.exists(path)) {
                Files.delete(path);
            }
        } catch (IOException e) {
            LoggingConfig.getLogger().error("Failed to delete product image: {}", imagePath, e);
        }
    }

    private com.possum.domain.model.AuditLog createAuditLog(long userId, String action, String tableName, long rowId, String oldData, String newData) {
        return new com.possum.domain.model.AuditLog(null, userId, action, tableName, rowId, oldData, newData, null, null, null);
    }

    public record CreateProductCommand(
            String name,
            String description,
            Long categoryId,
            String status,
            String imagePath,
            List<VariantCommand> variants,
            List<Long> taxIds,
            Long userId
    ) {}

    public record UpdateProductCommand(
            String name,
            String description,
            Long categoryId,
            String status,
            String newImagePath,
            List<VariantCommand> variants,
            List<Long> taxIds,
            Long userId
    ) {}

    public record VariantCommand(
            Long id,
            String name,
            String sku,
            java.math.BigDecimal price,
            java.math.BigDecimal costPrice,
            Integer stockAlertCap,
            Boolean isDefault,
            String status
    ) {}

    public record ProductWithVariantsDTO(
            Product product,
            List<Variant> variants,
            List<TaxRule> taxes
    ) {}
}

