package com.possum.application.inventory;

import com.possum.domain.enums.FlowEventType;
import com.possum.domain.enums.InventoryReason;
import com.possum.domain.exceptions.InsufficientStockException;
import com.possum.domain.model.AuditLog;
import com.possum.domain.model.InventoryAdjustment;
import com.possum.domain.model.InventoryLot;
import com.possum.domain.model.Variant;
import com.possum.infrastructure.filesystem.SettingsStore;
import com.possum.infrastructure.serialization.JsonService;
import com.possum.persistence.db.TransactionManager;
import com.possum.persistence.repositories.interfaces.AuditRepository;
import com.possum.persistence.repositories.interfaces.InventoryRepository;
import com.possum.shared.dto.AvailableLot;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import com.possum.shared.util.TimeUtil;
import java.util.Comparator;
import java.util.List;
import java.util.Map;

public class InventoryService {
    private final InventoryRepository inventoryRepository;
    private final ProductFlowService productFlowService;
    private final AuditRepository auditRepository;
    private final TransactionManager transactionManager;
    private final JsonService jsonService;
    private final SettingsStore settingsStore;

    public InventoryService(InventoryRepository inventoryRepository,
                            ProductFlowService productFlowService,
                            AuditRepository auditRepository,
                            TransactionManager transactionManager,
                            JsonService jsonService,
                            SettingsStore settingsStore) {
        this.inventoryRepository = inventoryRepository;
        this.productFlowService = productFlowService;
        this.auditRepository = auditRepository;
        this.transactionManager = transactionManager;
        this.jsonService = jsonService;
        this.settingsStore = settingsStore;
    }

    public int getVariantStock(long variantId) {
        return inventoryRepository.getStockByVariantId(variantId);
    }

    public List<InventoryLot> getVariantLots(long variantId) {
        return inventoryRepository.findLotsByVariantId(variantId);
    }

    public List<InventoryAdjustment> getVariantAdjustments(long variantId, int limit, int offset) {
        return inventoryRepository.findAdjustmentsByVariantId(variantId, limit, offset);
    }

    public List<com.possum.shared.dto.StockHistoryDto> getStockHistory(String search, List<String> reasons, String fromDate, String toDate, List<Long> userIds, int limit, int offset) {
        return inventoryRepository.findStockHistory(search, reasons, fromDate, toDate, userIds, limit, offset);
    }

    public List<Variant> getLowStockAlerts() {
        return inventoryRepository.findLowStockVariants();
    }

    public List<InventoryLot> getExpiringLots(int days) {
        return inventoryRepository.findExpiringLots(days);
    }

    public Map<String, Object> getInventoryStats() {
        return inventoryRepository.getInventoryStats();
    }

    public ReceiveInventoryResult receiveInventory(long variantId, int quantity, BigDecimal unitCost,
                                                   String batchNumber, LocalDateTime manufacturedDate,
                                                   LocalDateTime expiryDate, Long purchaseOrderItemId, long userId) {
        return transactionManager.runInTransaction(() -> {
            InventoryLot lot = new InventoryLot(null, variantId, batchNumber, manufacturedDate, expiryDate,
                    quantity, unitCost, purchaseOrderItemId, TimeUtil.nowUTC());
            long lotId = inventoryRepository.insertInventoryLot(lot);

            InventoryAdjustment adjustment = new InventoryAdjustment(null, variantId, lotId, quantity,
                    InventoryReason.CONFIRM_RECEIVE.getValue(), "purchase_order_item", purchaseOrderItemId,
                    userId, null, TimeUtil.nowUTC());
            inventoryRepository.insertInventoryAdjustment(adjustment);

            int newStock = inventoryRepository.getStockByVariantId(variantId);

            productFlowService.logProductFlow(variantId, FlowEventType.PURCHASE, quantity,
                    "purchase_order_item", purchaseOrderItemId);

            Map<String, Object> auditData = Map.of(
                    "variant_id", variantId,
                    "quantity", quantity,
                    "unit_cost", unitCost,
                    "batch_number", batchNumber != null ? batchNumber : "",
                    "new_stock", newStock
            );
            AuditLog auditLog = new AuditLog(null, userId, "CREATE", "inventory_lots", lotId,
                    null, jsonService.toJson(auditData), null, null, TimeUtil.nowUTC());
            auditRepository.insertAuditLog(auditLog);

            return new ReceiveInventoryResult(lotId, variantId, quantity, newStock);
        });
    }

    public DeductStockResult deductStock(long variantId, int quantity, long userId, InventoryReason reason,
                                         String referenceType, Long referenceId) {
        if (quantity <= 0) {
            return new DeductStockResult(true, 0);
        }

        int currentStock = inventoryRepository.getStockByVariantId(variantId);
        if (isInventoryRestrictionsEnabled() && currentStock < quantity) {
            throw new InsufficientStockException(currentStock, quantity);
        }

        return transactionManager.runInTransaction(() -> {
            deductStockInternal(variantId, quantity, userId, reason, referenceType, referenceId);
            return new DeductStockResult(true, quantity);
        });
    }

    public RestoreStockResult restoreStock(long variantId, String referenceType, long referenceId,
                                           int quantity, long userId, InventoryReason reason,
                                           String newReferenceType, Long newReferenceId) {
        if (quantity <= 0) {
            return new RestoreStockResult(true, 0);
        }

        return transactionManager.runInTransaction(() -> {
            List<InventoryAdjustment> originalAdjustments = inventoryRepository
                    .findAdjustmentsByReference(referenceType, referenceId);

            originalAdjustments.sort(Comparator.comparing(InventoryAdjustment::adjustedAt).reversed());

            int remainingToRestore = quantity;
            for (InventoryAdjustment adj : originalAdjustments) {
                if (remainingToRestore <= 0) break;

                int originalDeduction = Math.abs(adj.quantityChange());
                int restoreToThisLot = Math.min(remainingToRestore, originalDeduction);

                InventoryAdjustment restoreAdj = new InventoryAdjustment(null, variantId, adj.lotId(),
                        restoreToThisLot, reason.getValue(), newReferenceType, newReferenceId,
                        userId, null, TimeUtil.nowUTC());
                inventoryRepository.insertInventoryAdjustment(restoreAdj);

                remainingToRestore -= restoreToThisLot;
            }

            if (remainingToRestore > 0) {
                InventoryAdjustment headlessAdj = new InventoryAdjustment(null, variantId, null,
                        remainingToRestore, reason.getValue(), newReferenceType, newReferenceId,
                        userId, null, TimeUtil.nowUTC());
                inventoryRepository.insertInventoryAdjustment(headlessAdj);
            }

            FlowEventType eventType = reason == InventoryReason.RETURN ? FlowEventType.RETURN : FlowEventType.ADJUSTMENT;
            productFlowService.logProductFlow(variantId, eventType, quantity,
                    newReferenceType != null ? newReferenceType : "adjustment", newReferenceId);

            return new RestoreStockResult(true, quantity);
        });
    }

    public AdjustInventoryResult adjustInventory(long variantId, Long lotId, int quantityChange,
                                                 InventoryReason reason, String referenceType,
                                                 Long referenceId, long userId) {
        if (quantityChange < 0 && isInventoryRestrictionsEnabled()) {
            int currentStock = inventoryRepository.getStockByVariantId(variantId);
            if (currentStock + quantityChange < 0) {
                throw new InsufficientStockException(currentStock, Math.abs(quantityChange));
            }
        }

        return transactionManager.runInTransaction(() -> {
            if (quantityChange < 0 && lotId == null) {
                deductStockInternal(variantId, Math.abs(quantityChange), userId, reason, referenceType, referenceId);
                int newStock = inventoryRepository.getStockByVariantId(variantId);
                return new AdjustInventoryResult(0, variantId, quantityChange, reason, newStock);
            }

            InventoryAdjustment adjustment = new InventoryAdjustment(null, variantId, lotId, quantityChange,
                    reason.getValue(), referenceType, referenceId, userId, null, TimeUtil.nowUTC());
            long adjustmentId = inventoryRepository.insertInventoryAdjustment(adjustment);

            int newStock = inventoryRepository.getStockByVariantId(variantId);

            FlowEventType eventType = switch (reason) {
                case SALE -> FlowEventType.SALE;
                case RETURN -> FlowEventType.RETURN;
                default -> FlowEventType.ADJUSTMENT;
            };

            productFlowService.logProductFlow(variantId, eventType, quantityChange,
                    referenceType != null ? referenceType : "adjustment", referenceId != null ? referenceId : adjustmentId);

            Map<String, Object> auditData = Map.of(
                    "variant_id", variantId,
                    "quantity_change", quantityChange,
                    "reason", reason.getValue(),
                    "new_stock", newStock
            );
            AuditLog auditLog = new AuditLog(null, userId, "CREATE", "inventory_adjustments", adjustmentId,
                    null, jsonService.toJson(auditData), null, null, TimeUtil.nowUTC());
            auditRepository.insertAuditLog(auditLog);

            return new AdjustInventoryResult(adjustmentId, variantId, quantityChange, reason, newStock);
        });
    }

    private void deductStockInternal(long variantId, int quantity, long userId, InventoryReason reason,
                                     String referenceType, Long referenceId) {
        int remainingToDeduct = quantity;
        List<AvailableLot> availableLots = inventoryRepository.findAvailableLots(variantId);

        for (AvailableLot lot : availableLots) {
            if (remainingToDeduct <= 0) break;

            int deductionFromThisLot = Math.min(remainingToDeduct, lot.remainingQuantity());

            InventoryAdjustment adjustment = new InventoryAdjustment(null, variantId, lot.id(),
                    -deductionFromThisLot, reason.getValue(), referenceType, referenceId,
                    userId, null, TimeUtil.nowUTC());
            inventoryRepository.insertInventoryAdjustment(adjustment);

            remainingToDeduct -= deductionFromThisLot;
        }

        if (remainingToDeduct > 0) {
            InventoryAdjustment headlessAdj = new InventoryAdjustment(null, variantId, null,
                    -remainingToDeduct, reason.getValue(), referenceType, referenceId,
                    userId, null, TimeUtil.nowUTC());
            inventoryRepository.insertInventoryAdjustment(headlessAdj);
        }

        FlowEventType eventType = reason == InventoryReason.SALE ? FlowEventType.SALE : FlowEventType.ADJUSTMENT;
        productFlowService.logProductFlow(variantId, eventType, -quantity,
                referenceType != null ? referenceType : "adjustment", referenceId);
    }

    public record ReceiveInventoryResult(long lotId, long variantId, int quantity, int newStock) {}
    public record DeductStockResult(boolean success, int deducted) {}
    public record RestoreStockResult(boolean success, int restored) {}
    public record AdjustInventoryResult(long id, long variantId, int quantityChange, InventoryReason reason, int newStock) {}

    private boolean isInventoryRestrictionsEnabled() {
        try {
            return settingsStore.loadGeneralSettings().isInventoryAlertsAndRestrictionsEnabled();
        } catch (Exception ex) {
            return true;
        }
    }
}
