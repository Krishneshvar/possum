package com.possum.application.returns;

import com.possum.application.inventory.InventoryService;
import com.possum.application.returns.dto.*;
import com.possum.domain.enums.InventoryReason;
import com.possum.domain.exceptions.NotFoundException;
import com.possum.domain.exceptions.ValidationException;
import com.possum.domain.model.*;
import com.possum.infrastructure.serialization.JsonService;
import com.possum.persistence.db.TransactionManager;
import com.possum.persistence.repositories.interfaces.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.function.Supplier;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ReturnsServiceTest {

    @Mock private ReturnsRepository returnsRepository;
    @Mock private SalesRepository salesRepository;
    @Mock private InventoryService inventoryService;
    @Mock private AuditRepository auditRepository;
    @Mock private TransactionManager transactionManager;
    @Mock private JsonService jsonService;

    private ReturnsService returnsService;

    @BeforeEach
    void setUp() {
        returnsService = new ReturnsService(returnsRepository, salesRepository, inventoryService, auditRepository, transactionManager, jsonService);
        
        lenient().when(transactionManager.runInTransaction(any())).thenAnswer(invocation -> {
            Supplier<?> supplier = invocation.getArgument(0);
            return supplier.get();
        });
        
        com.possum.application.auth.AuthContext.setCurrentUser(new com.possum.application.auth.AuthUser(1L, "Admin", "admin", List.of(), List.of("returns.manage")));
    }

    @Test
    @DisplayName("Should create return and update inventory/sale status")
    void createReturn_success() {
        CreateReturnRequest request = new CreateReturnRequest(1L, List.of(new CreateReturnItemRequest(100L, 1)), "Defective", 1L);
        
        Sale sale = new Sale(1L, "INV-1", LocalDateTime.now(), new BigDecimal("100.00"), new BigDecimal("100.00"), BigDecimal.ZERO, BigDecimal.ZERO, "paid", "fulfilled", null, 1L, null, null, null, null, null, null);
        SaleItem item = new SaleItem(100L, 1L, 10L, "Variant", "SKU1", "Product", 2, new BigDecimal("50.00"), new BigDecimal("40.00"), BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, null, BigDecimal.ZERO, null);
        
        when(salesRepository.findSaleById(1L)).thenReturn(Optional.of(sale));
        when(salesRepository.findSaleItems(1L)).thenReturn(List.of(item));
        when(returnsRepository.getTotalReturnedQuantity(100L)).thenReturn(0);
        when(returnsRepository.insertReturn(any())).thenReturn(500L);

        ReturnResponse response = returnsService.createReturn(request);

        assertNotNull(response);
        assertEquals(500L, response.id());
        verify(inventoryService).restoreStock(eq(10L), any(), eq(100L), eq(1), anyLong(), eq(InventoryReason.RETURN), any(), anyLong());
        verify(salesRepository).updateSaleStatus(eq(1L), eq("partially_refunded"));
    }

    @Test
    @DisplayName("Should block return if quantity exceeds original sale")
    void createReturn_quantityExceeded_fail() {
        CreateReturnRequest request = new CreateReturnRequest(1L, List.of(new CreateReturnItemRequest(100L, 5)), "Too many", 1L);
        
        Sale sale = new Sale(1L, "INV-1", LocalDateTime.now(), new BigDecimal("100.00"), new BigDecimal("100.00"), BigDecimal.ZERO, BigDecimal.ZERO, "paid", "fulfilled", null, 1L, null, null, null, null, null, null);
        SaleItem item = new SaleItem(100L, 1L, 10L, "V", "S", "P", 2, BigDecimal.TEN, BigDecimal.ONE, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, null, BigDecimal.ZERO, null);
        
        when(salesRepository.findSaleById(1L)).thenReturn(Optional.of(sale));
        when(salesRepository.findSaleItems(1L)).thenReturn(List.of(item));
        when(returnsRepository.getTotalReturnedQuantity(100L)).thenReturn(0);

        assertThrows(ValidationException.class, () -> returnsService.createReturn(request));
    }
}
