package com.possum.application.inventory;

import com.possum.domain.enums.InventoryReason;
import com.possum.domain.exceptions.InsufficientStockException;
import com.possum.domain.model.InventoryAdjustment;
import com.possum.infrastructure.filesystem.SettingsStore;
import com.possum.infrastructure.serialization.JsonService;
import com.possum.persistence.db.TransactionManager;
import com.possum.persistence.repositories.interfaces.AuditRepository;
import com.possum.persistence.repositories.interfaces.InventoryRepository;
import com.possum.shared.dto.AvailableLot;
import com.possum.shared.dto.GeneralSettings;
import com.possum.testutil.Fixtures;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@org.mockito.junit.jupiter.MockitoSettings(strictness = org.mockito.quality.Strictness.LENIENT)
class InventoryServiceTest {

    @Mock InventoryRepository inventoryRepository;
    @Mock ProductFlowService productFlowService;
    @Mock AuditRepository auditRepository;
    @Mock TransactionManager transactionManager;
    @Mock JsonService jsonService;
    @Mock SettingsStore settingsStore;

    InventoryService service;

    @BeforeEach
    void setUp() {
        service = new InventoryService(inventoryRepository, productFlowService, auditRepository,
                transactionManager, jsonService, settingsStore);
        when(transactionManager.runInTransaction(any())).thenAnswer(inv ->
                inv.getArgument(0, java.util.function.Supplier.class).get());
        when(jsonService.toJson(any())).thenReturn("{}");
    }

    private void enableRestrictions(boolean enabled) {
        GeneralSettings settings = new GeneralSettings();
        settings.setInventoryAlertsAndRestrictionsEnabled(enabled);
        when(settingsStore.loadGeneralSettings()).thenReturn(settings);
    }

    // --- deductStock ---

    @Test
    void deductStock_zeroQuantity_returnsEarlyWithoutDbCall() {
        InventoryService.DeductStockResult result = service.deductStock(1L, 0, 1L, InventoryReason.SALE, "sale", 1L);
        assertTrue(result.success());
        assertEquals(0, result.deducted());
        verifyNoInteractions(inventoryRepository);
    }

    @Test
    void deductStock_insufficientStock_restrictionsEnabled_throwsException() {
        enableRestrictions(true);
        when(inventoryRepository.getStockByVariantId(1L)).thenReturn(3);
        assertThrows(InsufficientStockException.class,
                () -> service.deductStock(1L, 5, 1L, InventoryReason.SALE, "sale", 1L));
    }

    @Test
    void deductStock_insufficientStock_restrictionsDisabled_proceeds() {
        enableRestrictions(false);
        when(inventoryRepository.findAvailableLots(1L)).thenReturn(List.of());
        when(inventoryRepository.insertInventoryAdjustment(any())).thenReturn(1L);
        // Should not throw
        assertDoesNotThrow(() -> service.deductStock(1L, 5, 1L, InventoryReason.SALE, "sale", 1L));
    }

    @Test
    void deductStock_fifo_deductsFromOldestLotFirst() {
        enableRestrictions(true);
        when(inventoryRepository.getStockByVariantId(1L)).thenReturn(10);
        AvailableLot lot1 = Fixtures.lot(1L, 1L, 3);
        AvailableLot lot2 = Fixtures.lot(2L, 1L, 7);
        when(inventoryRepository.findAvailableLots(1L)).thenReturn(List.of(lot1, lot2));
        when(inventoryRepository.insertInventoryAdjustment(any())).thenReturn(1L);

        service.deductStock(1L, 5, 1L, InventoryReason.SALE, "sale", 1L);

        ArgumentCaptor<InventoryAdjustment> captor = ArgumentCaptor.forClass(InventoryAdjustment.class);
        verify(inventoryRepository, times(2)).insertInventoryAdjustment(captor.capture());
        List<InventoryAdjustment> adjustments = captor.getAllValues();
        assertEquals(-3, adjustments.get(0).quantityChange()); // all of lot1
        assertEquals(-2, adjustments.get(1).quantityChange()); // remainder from lot2
    }

    @Test
    void deductStock_exactStock_singleLot_singleAdjustment() {
        enableRestrictions(true);
        when(inventoryRepository.getStockByVariantId(1L)).thenReturn(5);
        when(inventoryRepository.findAvailableLots(1L)).thenReturn(List.of(Fixtures.lot(1L, 1L, 5)));
        when(inventoryRepository.insertInventoryAdjustment(any())).thenReturn(1L);

        service.deductStock(1L, 5, 1L, InventoryReason.SALE, "sale", 1L);

        ArgumentCaptor<InventoryAdjustment> captor = ArgumentCaptor.forClass(InventoryAdjustment.class);
        verify(inventoryRepository, times(1)).insertInventoryAdjustment(captor.capture());
        assertEquals(-5, captor.getValue().quantityChange());
    }

    // --- restoreStock ---

    @Test
    void restoreStock_zeroQuantity_returnsEarlyWithoutDbCall() {
        InventoryService.RestoreStockResult result = service.restoreStock(1L, "sale_item", 1L, 0, 1L, InventoryReason.RETURN, "return_item", 1L);
        assertTrue(result.success());
        assertEquals(0, result.restored());
        verifyNoInteractions(inventoryRepository);
    }

    @Test
    void restoreStock_withOriginalAdjustments_restoresToSameLots() {
        InventoryAdjustment original = new InventoryAdjustment(1L, 1L, 10L, -3,
                InventoryReason.SALE.getValue(), "sale_item", 1L, 1L, null, java.time.LocalDateTime.now());
        when(inventoryRepository.findAdjustmentsByReference("sale_item", 1L))
                .thenReturn(new java.util.ArrayList<>(List.of(original)));
        when(inventoryRepository.insertInventoryAdjustment(any())).thenReturn(1L);

        service.restoreStock(1L, "sale_item", 1L, 2, 1L, InventoryReason.RETURN, "return_item", 1L);

        ArgumentCaptor<InventoryAdjustment> captor = ArgumentCaptor.forClass(InventoryAdjustment.class);
        verify(inventoryRepository).insertInventoryAdjustment(captor.capture());
        assertEquals(10L, captor.getValue().lotId()); // same lot as original
        assertEquals(2, captor.getValue().quantityChange()); // positive restore
    }

    @Test
    void restoreStock_noOriginalAdjustments_createsHeadlessAdjustment() {
        when(inventoryRepository.findAdjustmentsByReference("sale_item", 1L))
                .thenReturn(new java.util.ArrayList<>());
        when(inventoryRepository.insertInventoryAdjustment(any())).thenReturn(1L);

        service.restoreStock(1L, "sale_item", 1L, 3, 1L, InventoryReason.RETURN, "return_item", 1L);

        ArgumentCaptor<InventoryAdjustment> captor = ArgumentCaptor.forClass(InventoryAdjustment.class);
        verify(inventoryRepository).insertInventoryAdjustment(captor.capture());
        assertNull(captor.getValue().lotId()); // headless
        assertEquals(3, captor.getValue().quantityChange());
    }

    // --- adjustInventory ---

    @Test
    void adjustInventory_negativeChange_restrictionsEnabled_insufficientStock_throws() {
        enableRestrictions(true);
        when(inventoryRepository.getStockByVariantId(1L)).thenReturn(2);
        assertThrows(InsufficientStockException.class,
                () -> service.adjustInventory(1L, null, -5, InventoryReason.CORRECTION, null, null, 1L));
    }

    @Test
    void adjustInventory_positiveChange_insertsAdjustmentAndLogsFlow() {
        when(inventoryRepository.insertInventoryAdjustment(any())).thenReturn(5L);
        when(inventoryRepository.getStockByVariantId(1L)).thenReturn(15);

        InventoryService.AdjustInventoryResult result = service.adjustInventory(
                1L, 10L, 5, InventoryReason.CORRECTION, null, null, 1L);

        assertEquals(5L, result.id());
        assertEquals(15, result.newStock());
        verify(productFlowService).logProductFlow(eq(1L), any(), eq(5), any(), any());
        verify(auditRepository).insertAuditLog(any());
    }
}
