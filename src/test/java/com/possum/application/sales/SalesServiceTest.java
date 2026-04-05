package com.possum.application.sales;

import com.possum.application.auth.AuthContext;
import com.possum.application.inventory.InventoryService;
import com.possum.application.sales.dto.*;
import com.possum.domain.enums.InventoryReason;
import com.possum.domain.exceptions.InsufficientStockException;
import com.possum.domain.exceptions.NotFoundException;
import com.possum.domain.exceptions.ValidationException;
import com.possum.domain.model.*;
import com.possum.infrastructure.filesystem.SettingsStore;
import com.possum.infrastructure.serialization.JsonService;
import com.possum.persistence.db.TransactionManager;
import com.possum.persistence.repositories.interfaces.*;
import com.possum.shared.dto.GeneralSettings;
import com.possum.testutil.Fixtures;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class SalesServiceTest {

    @Mock SalesRepository salesRepository;
    @Mock VariantRepository variantRepository;
    @Mock ProductRepository productRepository;
    @Mock CustomerRepository customerRepository;
    @Mock AuditRepository auditRepository;
    @Mock InventoryService inventoryService;
    @Mock TaxEngine taxEngine;
    @Mock PaymentService paymentService;
    @Mock TransactionManager transactionManager;
    @Mock JsonService jsonService;
    @Mock SettingsStore settingsStore;
    @Mock InvoiceNumberService invoiceNumberService;

    SalesService service;

    // Shared test data
    Variant variant = Fixtures.variant(1L, 10L, "100.00");
    Product product = Fixtures.product(10L, null);

    @BeforeEach
    void setUp() {
        service = new SalesService(salesRepository, variantRepository, productRepository,
                customerRepository, auditRepository, inventoryService, taxEngine,
                paymentService, transactionManager, jsonService, settingsStore, invoiceNumberService);

        AuthContext.setCurrentUser(Fixtures.authUser(1L, "admin"));

        when(transactionManager.runInTransaction(any())).thenAnswer(inv ->
                inv.getArgument(0, java.util.function.Supplier.class).get());
        when(jsonService.toJson(any())).thenReturn("{}");

        // Default: restrictions enabled
        GeneralSettings settings = new GeneralSettings();
        settings.setInventoryAlertsAndRestrictionsEnabled(true);
        when(settingsStore.loadGeneralSettings()).thenReturn(settings);

        // Default variant/product lookups
        when(variantRepository.findVariantByIdSync(1L)).thenReturn(Optional.of(variant));
        when(productRepository.findProductById(10L)).thenReturn(Optional.of(product));
        when(salesRepository.paymentMethodExists(1L)).thenReturn(true);
        when(invoiceNumberService.generate(anyLong())).thenReturn("S260101CH0001");
    }

    @AfterEach
    void tearDown() {
        AuthContext.clear();
    }

    // --- createSale: request validation ---

    @Test
    void createSale_emptyItems_throwsIllegalArgument() {
        CreateSaleRequest req = new CreateSaleRequest(List.of(), null, null, null);
        assertThrows(IllegalArgumentException.class, () -> service.createSale(req, 1L));
    }

    @Test
    void createSale_negativeDiscount_throwsIllegalArgument() {
        CreateSaleRequest req = new CreateSaleRequest(
                List.of(new CreateSaleItemRequest(1L, 1, null, null)),
                null, new BigDecimal("-10"), null);
        assertThrows(IllegalArgumentException.class, () -> service.createSale(req, 1L));
    }

    @Test
    void createSale_invalidPaymentMethod_throwsNotFoundException() {
        when(salesRepository.paymentMethodExists(99L)).thenReturn(false);
        doThrow(new NotFoundException("Payment method not found: 99"))
                .when(paymentService).validatePaymentMethod(99L);

        CreateSaleRequest req = new CreateSaleRequest(
                List.of(new CreateSaleItemRequest(1L, 1, null, null)),
                null, null,
                List.of(new PaymentRequest(new BigDecimal("100"), 99L)));
        assertThrows(NotFoundException.class, () -> service.createSale(req, 1L));
    }

    @Test
    void createSale_variantNotFound_throwsNotFoundException() {
        when(variantRepository.findVariantByIdSync(99L)).thenReturn(Optional.empty());
        when(inventoryService.getVariantStock(99L)).thenReturn(10);

        CreateSaleRequest req = new CreateSaleRequest(
                List.of(new CreateSaleItemRequest(99L, 1, null, null)),
                null, null, null);
        assertThrows(NotFoundException.class, () -> service.createSale(req, 1L));
    }

    @Test
    void createSale_insufficientStock_throwsInsufficientStockException() {
        when(inventoryService.getVariantStock(1L)).thenReturn(2);

        CreateSaleRequest req = new CreateSaleRequest(
                List.of(new CreateSaleItemRequest(1L, 5, null, null)),
                null, null, null);
        assertThrows(InsufficientStockException.class, () -> service.createSale(req, 1L));
    }

    // --- createSale: happy path ---

    @Test
    void createSale_happyPath_insertsAndDeductsStock() {
        when(inventoryService.getVariantStock(1L)).thenReturn(10);
        stubTaxEngine(new BigDecimal("100.00"), new BigDecimal("10.00"), new BigDecimal("110.00"));

        long saleId = 42L;
        when(salesRepository.insertSale(any())).thenReturn(saleId);
        when(salesRepository.insertSaleItem(any())).thenReturn(1L);
        when(salesRepository.findSaleById(saleId)).thenReturn(Optional.of(
                Fixtures.paidSale(saleId, new BigDecimal("110.00"), new BigDecimal("110.00"))));

        CreateSaleRequest req = new CreateSaleRequest(
                List.of(new CreateSaleItemRequest(1L, 1, null, null)),
                null, null,
                List.of(new PaymentRequest(new BigDecimal("110.00"), 1L)));

        SaleResponse response = service.createSale(req, 1L);

        assertNotNull(response);
        assertEquals(saleId, response.sale().id());
        verify(inventoryService).deductStock(eq(1L), eq(1), eq(1L), eq(InventoryReason.SALE), eq("sale_item"), anyLong());
        verify(auditRepository).insertAuditLog(any());
    }

    @Test
    void createSale_noPayments_saleStatusIsDraft() {
        when(inventoryService.getVariantStock(1L)).thenReturn(10);
        stubTaxEngine(new BigDecimal("100.00"), BigDecimal.ZERO, new BigDecimal("100.00"));

        long saleId = 5L;
        when(salesRepository.insertSale(any())).thenReturn(saleId);
        when(salesRepository.insertSaleItem(any())).thenReturn(1L);
        Sale draftSale = Fixtures.paidSale(saleId, new BigDecimal("100.00"), BigDecimal.ZERO);
        when(salesRepository.findSaleById(saleId)).thenReturn(Optional.of(draftSale));

        CreateSaleRequest req = new CreateSaleRequest(
                List.of(new CreateSaleItemRequest(1L, 1, null, null)),
                null, null, null);

        service.createSale(req, 1L);

        // Verify sale inserted with paidAmount = 0 (draft)
        verify(salesRepository).insertSale(argThat(s -> s.paidAmount().compareTo(BigDecimal.ZERO) == 0));
    }

    @Test
    void createSale_withGlobalDiscount_distributesAcrossItems() {
        when(inventoryService.getVariantStock(1L)).thenReturn(10);
        // After 20 discount on 100 item → taxable = 80
        stubTaxEngine(new BigDecimal("80.00"), BigDecimal.ZERO, new BigDecimal("80.00"));

        long saleId = 7L;
        when(salesRepository.insertSale(any())).thenReturn(saleId);
        when(salesRepository.insertSaleItem(any())).thenReturn(1L);
        when(salesRepository.findSaleById(saleId)).thenReturn(Optional.of(
                Fixtures.paidSaleWithDiscount(saleId, new BigDecimal("80.00"), new BigDecimal("80.00"), new BigDecimal("20.00"))));

        CreateSaleRequest req = new CreateSaleRequest(
                List.of(new CreateSaleItemRequest(1L, 1, null, null)),
                null, new BigDecimal("20.00"),
                List.of(new PaymentRequest(new BigDecimal("80.00"), 1L)));

        SaleResponse response = service.createSale(req, 1L);
        assertEquals(new BigDecimal("20.00"), response.sale().discount());
    }

    // --- cancelSale ---

    @Test
    void cancelSale_alreadyCancelled_throwsValidationException() {
        when(salesRepository.findSaleById(1L)).thenReturn(Optional.of(Fixtures.cancelledSale(1L)));
        assertThrows(ValidationException.class, () -> service.cancelSale(1L, 1L));
    }

    @Test
    void cancelSale_refundedSale_throwsValidationException() {
        when(salesRepository.findSaleById(1L)).thenReturn(Optional.of(Fixtures.refundedSale(1L)));
        assertThrows(ValidationException.class, () -> service.cancelSale(1L, 1L));
    }

    @Test
    void cancelSale_validSale_restoresStockAndUpdatesStatus() {
        Sale sale = Fixtures.paidSale(1L, new BigDecimal("100.00"), new BigDecimal("100.00"));
        SaleItem item = Fixtures.saleItem(1L, 1L, 5L, 2, "50.00");
        when(salesRepository.findSaleById(1L)).thenReturn(Optional.of(sale));
        when(salesRepository.findSaleItems(1L)).thenReturn(List.of(item));

        service.cancelSale(1L, 1L);

        verify(inventoryService).restoreStock(eq(5L), eq("sale_item"), eq(1L), eq(2), eq(1L),
                eq(InventoryReason.CORRECTION), eq("sale_cancellation"), eq(1L));
        verify(salesRepository).updateSaleStatus(1L, "cancelled");
        verify(salesRepository).updateFulfillmentStatus(1L, "cancelled");
    }

    @Test
    void cancelSale_saleNotFound_throwsNotFoundException() {
        when(salesRepository.findSaleById(99L)).thenReturn(Optional.empty());
        assertThrows(NotFoundException.class, () -> service.cancelSale(99L, 1L));
    }

    // --- updateSaleItems ---

    @Test
    void updateSaleItems_cancelledSale_throwsValidationException() {
        when(salesRepository.findSaleById(1L)).thenReturn(Optional.of(Fixtures.cancelledSale(1L)));
        assertThrows(ValidationException.class,
                () -> service.updateSaleItems(1L, List.of(), 1L));
    }

    @Test
    void updateSaleItems_validSale_restoresOldAndDeductsNew() {
        Sale sale = Fixtures.paidSale(1L, new BigDecimal("100.00"), new BigDecimal("100.00"));
        SaleItem oldItem = Fixtures.saleItem(1L, 1L, 5L, 2, "50.00");
        when(salesRepository.findSaleById(1L)).thenReturn(Optional.of(sale));
        when(salesRepository.findSaleItems(1L)).thenReturn(List.of(oldItem));
        when(inventoryService.getVariantStock(1L)).thenReturn(10);
        stubTaxEngine(new BigDecimal("100.00"), BigDecimal.ZERO, new BigDecimal("100.00"));
        when(salesRepository.insertSaleItem(any())).thenReturn(2L);

        var newItemReq = new com.possum.application.sales.dto.UpdateSaleItemRequest(
                1L, 1, new BigDecimal("100.00"), BigDecimal.ZERO);
        service.updateSaleItems(1L, List.of(newItemReq), 1L);

        verify(inventoryService).restoreStock(eq(5L), eq("sale_item"), eq(1L), eq(2), eq(1L),
                eq(InventoryReason.CORRECTION), eq("bill_edit_restoration"), eq(1L));
        verify(inventoryService).deductStock(eq(1L), eq(1), eq(1L), eq(InventoryReason.SALE), eq("sale_item"), eq(2L));
        verify(salesRepository).updateSaleTotals(eq(1L), any(), any(), any());
    }

    // --- changeSalePaymentMethod ---

    @Test
    void changeSalePaymentMethod_cancelledSale_throwsValidationException() {
        when(salesRepository.findSaleById(1L)).thenReturn(Optional.of(Fixtures.cancelledSale(1L)));
        assertThrows(ValidationException.class,
                () -> service.changeSalePaymentMethod(1L, 2L, 1L));
    }

    @Test
    void changeSalePaymentMethod_paymentMethodNotFound_throwsNotFoundException() {
        Sale sale = Fixtures.paidSale(1L, new BigDecimal("100.00"), new BigDecimal("100.00"));
        when(salesRepository.findSaleById(1L)).thenReturn(Optional.of(sale));
        when(salesRepository.paymentMethodExists(99L)).thenReturn(false);
        assertThrows(NotFoundException.class,
                () -> service.changeSalePaymentMethod(1L, 99L, 1L));
    }

    // --- getSaleDetails ---

    @Test
    void getSaleDetails_notFound_throwsNotFoundException() {
        when(salesRepository.findSaleById(99L)).thenReturn(Optional.empty());
        assertThrows(NotFoundException.class, () -> service.getSaleDetails(99L));
    }

    @Test
    void getSaleDetails_found_returnsSaleWithItemsAndTransactions() {
        Sale sale = Fixtures.paidSale(1L, new BigDecimal("100.00"), new BigDecimal("100.00"));
        SaleItem item = Fixtures.saleItem(1L, 1L, 1L, 1, "100.00");
        when(salesRepository.findSaleById(1L)).thenReturn(Optional.of(sale));
        when(salesRepository.findSaleItems(1L)).thenReturn(List.of(item));
        when(salesRepository.findTransactionsBySaleId(1L)).thenReturn(List.of());

        SaleResponse response = service.getSaleDetails(1L);
        assertEquals(1L, response.sale().id());
        assertEquals(1, response.items().size());
    }

    // --- helpers ---

    private void stubTaxEngine(BigDecimal subtotal, BigDecimal tax, BigDecimal grandTotal) {
        doAnswer(inv -> {
            TaxableInvoice invoice = inv.getArgument(0);
            for (TaxableItem item : invoice.items()) {
                item.setTaxAmount(tax.divide(BigDecimal.valueOf(invoice.items().size()), 10, java.math.RoundingMode.HALF_UP));
                item.setTaxRate(BigDecimal.ZERO);
                item.setTaxRuleSnapshot("[]");
            }
            return new TaxCalculationResult(invoice.items(), tax, grandTotal);
        }).when(taxEngine).calculate(any(), any());
    }
}
