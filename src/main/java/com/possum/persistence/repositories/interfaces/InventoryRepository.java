package com.possum.persistence.repositories.interfaces;

import com.possum.domain.model.InventoryAdjustment;
import com.possum.domain.model.InventoryLot;
import com.possum.domain.model.Variant;
import com.possum.shared.dto.AvailableLot;

import java.util.List;
import java.util.Map;
import java.util.Optional;

public interface InventoryRepository {
    int getStockByVariantId(long variantId);

    List<InventoryLot> findLotsByVariantId(long variantId);

    List<AvailableLot> findAvailableLots(long variantId);

    List<InventoryAdjustment> findAdjustmentsByVariantId(long variantId, int limit, int offset);

    List<com.possum.shared.dto.StockHistoryDto> findStockHistory(String search, java.util.List<String> reasons, int limit, int offset);

    List<InventoryAdjustment> findAdjustmentsByReference(String referenceType, long referenceId);

    long insertInventoryLot(InventoryLot lot);

    long insertInventoryAdjustment(InventoryAdjustment adjustment);

    Optional<InventoryLot> findLotById(long id);

    List<Variant> findLowStockVariants();

    List<InventoryLot> findExpiringLots(int days);

    Map<String, Object> getInventoryStats();
}
