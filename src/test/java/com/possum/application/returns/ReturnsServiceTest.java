package com.possum.application.returns;

import com.possum.application.auth.AuthContext;
import com.possum.application.auth.Permissions;
import com.possum.application.inventory.InventoryService;
import com.possum.application.returns.dto.*;
import com.possum.domain.exceptions.NotFoundException;
import com.possum.domain.exceptions.ValidationException;
import com.possum.domain.model.*;
import com.possum.infrastructure.serialization.JsonService;
import com.possum.persistence.db.TransactionManager;
import com.possum.persistence.repositories.interfaces.AuditRepository;
import com.possum.persistence.repositories.interfaces.ReturnsRepository;
import com.possum.persistence.repositories.interfaces.SalesRepository;
import com.possum.testutil.Fixtures;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@org.mockito.junit.jupiter.MockitoSettings(strictness = org.mockito.quality.Strictness.LENIENT)
class ReturnsServiceTest {

    @Mock ReturnsRepository returnsRepository;
    @Mock SalesRepository salesRepository;
    @Mock InventoryService inventoryService;
    @Mock AuditRepository auditRepository;
    @Mock TransactionManager transactionManager;
    @Mock JsonService jsonService;

    ReturnsService service;

    @BeforeEach
    void setUp() {
        service = new ReturnsService(returnsRepository, salesRepository, inventoryService,
                auditRepository, transactionManager, jsonService);
        AuthContext.setCurrentUser(Fixtures.authUser(1L, "admin"));
        // Make transactionManager.runInTransaction execute the supplier directly
        when(transactionManager.runInTransaction(any())).thenAnswer(inv ->
                inv.getArgument(0, java.util.function.Supplier.class).get());
        when(jsonService.toJson(any())).thenReturn("{}");
    }

    @AfterEach
    void tearDown() {
        AuthContext.clear();
    }

    // --- Input validation ---

    @Test
    void createReturn_nullSaleId_throwsValidationException() {
        CreateReturnRequest req = new CreateReturnRequest(null, List.of(new CreateReturnItemRequest(1L, 1)), "damaged", 1L);
        assertThrows(ValidationException.class, () -> service.createReturn(req));
    }

    @Test
    void createReturn_nullUserId_throwsValidationException() {
        CreateReturnRequest req = new CreateReturnRequest(1L, List.of(new CreateReturnItemRequest(1L, 1)), "damaged", null);
        assertThrows(ValidationException.class, () -> service.createReturn(req));
    }

    @Test
    void createReturn_emptyReason_throwsValidationException() {
        CreateReturnRequest req = new CreateReturnRequest(1L, List.of(new CreateReturnItemRequest(1L, 1)), "  ", 1L);
        assertThrows(ValidationException.class, () -> service.createReturn(req));
    }

    @Test
    void createReturn_emptyItems_throwsValidationException() {
        CreateReturnRequest req = new CreateReturnRequest(1L, List.of(), "damaged", 1L);
        assertThrows(ValidationException.class, () -> service.createReturn(req));
    }

    @Test
    void createReturn_zeroItemQuantity_throwsValidationException() {
        CreateReturnRequest req = new CreateReturnRequest(1L, List.of(new CreateReturnItemRequest(1L, 0)), "damaged", 1L);
        assertThrows(ValidationException.class, () -> service.createReturn(req));
    }

    // --- Sale not found ---

    @Test
    void createReturn_saleNotFound_throwsNotFoundException() {
        when(salesRepository.findSaleById(1L)).thenReturn(Optional.empty());
        CreateReturnRequest req = new CreateReturnRequest(1L, List.of(new CreateReturnItemRequest(1L, 1)), "damaged", 1L);
        assertThrows(NotFoundException.class, () -> service.createReturn(req));
    }

    // --- Quantity validation ---

    @Test
    void createReturn_exceedsAvailableQuantity_throwsValidationException() {
        Sale sale = Fixtures.paidSale(1L, new BigDecimal("100.00"), new BigDecimal("100.00"));
        SaleItem item = Fixtures.saleItem(1L, 1L, 1L, 2, "50.00");
        when(salesRepository.findSaleById(1L)).thenReturn(Optional.of(sale));
        when(salesRepository.findSaleItems(1L)).thenReturn(List.of(item));
        when(returnsRepository.getTotalReturnedQuantity(1L)).thenReturn(2); // all already returned

        CreateReturnRequest req = new CreateReturnRequest(1L, List.of(new CreateReturnItemRequest(1L, 1)), "damaged", 1L);
        assertThrows(ValidationException.class, () -> service.createReturn(req));
    }

    @Test
    void createReturn_saleItemNotInSale_throwsValidationException() {
        Sale sale = Fixtures.paidSale(1L, new BigDecimal("100.00"), new BigDecimal("100.00"));
        SaleItem item = Fixtures.saleItem(1L, 1L, 1L, 2, "50.00");
        when(salesRepository.findSaleById(1L)).thenReturn(Optional.of(sale));
        when(salesRepository.findSaleItems(1L)).thenReturn(List.of(item));

        CreateReturnRequest req = new CreateReturnRequest(1L, List.of(new CreateReturnItemRequest(99L, 1)), "damaged", 1L);
        assertThrows(ValidationException.class, () -> service.createReturn(req));
    }

    // --- Refund exceeds paid amount ---

    @Test
    void createReturn_refundExceedsPaidAmount_throwsValidationException() {
        Sale sale = Fixtures.paidSale(1L, new BigDecimal("100.00"), new BigDecimal("50.00")); // only 50 paid
        SaleItem item = Fixtures.saleItem(1L, 1L, 1L, 2, "50.00"); // total 100
        when(salesRepository.findSaleById(1L)).thenReturn(Optional.of(sale));
        when(salesRepository.findSaleItems(1L)).thenReturn(List.of(item));
        when(returnsRepository.getTotalReturnedQuantity(1L)).thenReturn(0);

        CreateReturnRequest req = new CreateReturnRequest(1L, List.of(new CreateReturnItemRequest(1L, 2)), "damaged", 1L);
        assertThrows(ValidationException.class, () -> service.createReturn(req));
    }

    // --- Successful return ---

    @Test
    void createReturn_validRequest_createsReturnAndRestoresInventory() {
        Sale sale = Fixtures.paidSale(1L, new BigDecimal("100.00"), new BigDecimal("100.00"));
        SaleItem item = Fixtures.saleItem(1L, 1L, 5L, 2, "50.00");
        when(salesRepository.findSaleById(1L)).thenReturn(Optional.of(sale));
        when(salesRepository.findSaleItems(1L)).thenReturn(List.of(item));
        when(returnsRepository.getTotalReturnedQuantity(1L)).thenReturn(0);
        when(returnsRepository.insertReturn(any())).thenReturn(10L);
        when(returnsRepository.insertReturnItem(any())).thenReturn(20L);
        when(salesRepository.findTransactionsBySaleId(1L)).thenReturn(List.of());
        when(salesRepository.findPaymentMethods()).thenReturn(List.of());

        CreateReturnRequest req = new CreateReturnRequest(1L, List.of(new CreateReturnItemRequest(1L, 1)), "damaged", 1L);
        ReturnResponse response = service.createReturn(req);

        assertEquals(10L, response.id());
        assertEquals(1L, response.saleId());
        assertEquals(new BigDecimal("50.00"), response.totalRefund());
        verify(inventoryService).restoreStock(eq(5L), eq("sale_item"), eq(1L), eq(1), eq(1L), any(), eq("return_item"), eq(20L));
        verify(auditRepository).insertAuditLog(any());
    }

    @Test
    void createReturn_duplicateItemsInRequest_aggregatesQuantities() {
        Sale sale = Fixtures.paidSale(1L, new BigDecimal("150.00"), new BigDecimal("150.00"));
        SaleItem item = Fixtures.saleItem(1L, 1L, 5L, 3, "50.00");
        when(salesRepository.findSaleById(1L)).thenReturn(Optional.of(sale));
        when(salesRepository.findSaleItems(1L)).thenReturn(List.of(item));
        when(returnsRepository.getTotalReturnedQuantity(1L)).thenReturn(0);
        when(returnsRepository.insertReturn(any())).thenReturn(10L);
        when(returnsRepository.insertReturnItem(any())).thenReturn(20L);
        when(salesRepository.findTransactionsBySaleId(1L)).thenReturn(List.of());
        when(salesRepository.findPaymentMethods()).thenReturn(List.of());

        // Same item twice → aggregated to qty 2
        CreateReturnRequest req = new CreateReturnRequest(1L, List.of(
                new CreateReturnItemRequest(1L, 1),
                new CreateReturnItemRequest(1L, 1)
        ), "damaged", 1L);
        ReturnResponse response = service.createReturn(req);
        assertEquals(new BigDecimal("100.00"), response.totalRefund());
    }

    // --- getSaleReturns ---

    @Test
    void getSaleReturns_invalidId_throwsValidationException() {
        assertThrows(ValidationException.class, () -> service.getSaleReturns(0));
    }

    @Test
    void getReturn_notFound_throwsNotFoundException() {
        when(returnsRepository.findReturnById(99L)).thenReturn(Optional.empty());
        assertThrows(NotFoundException.class, () -> service.getReturn(99L));
    }
}
