package com.possum.application.sales;

import com.possum.application.sales.config.TaxConfiguration;
import com.possum.application.sales.config.TaxRoundingStrategy;
import com.possum.application.sales.dto.TaxCalculationResult;
import com.possum.application.sales.dto.TaxableInvoice;
import com.possum.application.sales.dto.TaxableItem;
import com.possum.domain.model.Customer;
import com.possum.domain.model.TaxProfile;
import com.possum.domain.model.TaxRule;
import com.possum.infrastructure.serialization.JsonService;
import com.possum.persistence.repositories.interfaces.TaxRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class EnhancedTaxEngineTest {
    private TaxRepository taxRepository;
    private JsonService jsonService;
    private EnhancedTaxEngine engine;
    private TaxProfile profile;

    @BeforeEach
    void setUp() {
        taxRepository = mock(TaxRepository.class);
        jsonService = mock(JsonService.class);
        
        profile = new TaxProfile(1L, "Default", "US", "CA", "EXCLUSIVE", true, 
                LocalDateTime.now(), LocalDateTime.now());
        
        when(taxRepository.getActiveTaxProfile()).thenReturn(Optional.of(profile));
        when(jsonService.toJson(any())).thenReturn("[]");
    }

    @Test
    void testInvoiceLevelRounding() {
        TaxConfiguration config = new TaxConfiguration(
                TaxRoundingStrategy.INVOICE_LEVEL, RoundingMode.HALF_UP, true, true);
        engine = new EnhancedTaxEngine(taxRepository, jsonService, config);
        
        TaxRule rule = new TaxRule(1L, 1L, null, "ITEM", null, null, null, null, null,
                new BigDecimal("10.5"), false, 0, null, null, "VAT", LocalDateTime.now(), LocalDateTime.now());
        when(taxRepository.getTaxRulesByProfileId(1L)).thenReturn(List.of(rule));
        
        engine.init();
        
        TaxableItem item1 = new TaxableItem("Product1", "Variant1", new BigDecimal("10.00"), 1, null, 1L, 1L);
        TaxableItem item2 = new TaxableItem("Product2", "Variant2", new BigDecimal("10.00"), 1, null, 2L, 2L);
        TaxableInvoice invoice = new TaxableInvoice(List.of(item1, item2));
        
        TaxCalculationResult result = engine.calculate(invoice, null);
        
        assertEquals(new BigDecimal("2.10"), result.totalTax());
        assertEquals(new BigDecimal("22.10"), result.grandTotal());
    }

    @Test
    void testItemLevelRounding() {
        TaxConfiguration config = new TaxConfiguration(
                TaxRoundingStrategy.ITEM_LEVEL, RoundingMode.HALF_UP, true, true);
        engine = new EnhancedTaxEngine(taxRepository, jsonService, config);
        
        TaxRule rule = new TaxRule(1L, 1L, null, "ITEM", null, null, null, null, null,
                new BigDecimal("10.5"), false, 0, null, null, "VAT", LocalDateTime.now(), LocalDateTime.now());
        when(taxRepository.getTaxRulesByProfileId(1L)).thenReturn(List.of(rule));
        
        engine.init();
        
        TaxableItem item1 = new TaxableItem("Product1", "Variant1", new BigDecimal("10.00"), 1, null, 1L, 1L);
        TaxableItem item2 = new TaxableItem("Product2", "Variant2", new BigDecimal("10.00"), 1, null, 2L, 2L);
        TaxableInvoice invoice = new TaxableInvoice(List.of(item1, item2));
        
        TaxCalculationResult result = engine.calculate(invoice, null);
        
        assertEquals(new BigDecimal("2.10"), result.totalTax());
    }

    @Test
    void testTaxExemptCustomer() {
        engine = new EnhancedTaxEngine(taxRepository, jsonService);
        
        TaxRule rule = new TaxRule(1L, 1L, null, "ITEM", null, null, null, null, null,
                new BigDecimal("10"), false, 0, null, null, "VAT", LocalDateTime.now(), LocalDateTime.now());
        when(taxRepository.getTaxRulesByProfileId(1L)).thenReturn(List.of(rule));
        
        engine.init();
        
        Customer exemptCustomer = new Customer(1L, "NGO", null, null, null, "ngo", true,
                LocalDateTime.now(), LocalDateTime.now(), null);
        
        TaxableItem item = new TaxableItem("Product", "Variant", new BigDecimal("100.00"), 1, null, 1L, 1L);
        TaxableInvoice invoice = new TaxableInvoice(List.of(item));
        
        TaxCalculationResult result = engine.calculate(invoice, exemptCustomer);
        
        assertEquals(BigDecimal.ZERO, result.totalTax());
        assertEquals(new BigDecimal("100.00"), result.grandTotal());
    }

    @Test
    void testNegativePriceValidation() {
        engine = new EnhancedTaxEngine(taxRepository, jsonService);
        when(taxRepository.getTaxRulesByProfileId(1L)).thenReturn(List.of());
        engine.init();
        
        TaxableItem item = new TaxableItem("Product", "Variant", new BigDecimal("-10.00"), 1, null, 1L, 1L);
        TaxableInvoice invoice = new TaxableInvoice(List.of(item));
        
        assertThrows(IllegalArgumentException.class, () -> engine.calculate(invoice, null));
    }

    @Test
    void testZeroQuantityValidation() {
        engine = new EnhancedTaxEngine(taxRepository, jsonService);
        when(taxRepository.getTaxRulesByProfileId(1L)).thenReturn(List.of());
        engine.init();
        
        TaxableItem item = new TaxableItem("Product", "Variant", new BigDecimal("10.00"), 0, null, 1L, 1L);
        TaxableInvoice invoice = new TaxableInvoice(List.of(item));
        
        assertThrows(IllegalArgumentException.class, () -> engine.calculate(invoice, null));
    }

    @Test
    void testNegativeRateValidation() {
        engine = new EnhancedTaxEngine(taxRepository, jsonService);
        
        TaxRule rule = new TaxRule(1L, 1L, null, "ITEM", null, null, null, null, null,
                new BigDecimal("-5"), false, 0, null, null, "Invalid", LocalDateTime.now(), LocalDateTime.now());
        when(taxRepository.getTaxRulesByProfileId(1L)).thenReturn(List.of(rule));
        
        assertThrows(IllegalStateException.class, () -> engine.init());
    }

    @Test
    void testCustomerTypeFiltering() {
        engine = new EnhancedTaxEngine(taxRepository, jsonService);
        
        TaxRule wholesaleRule = new TaxRule(1L, 1L, null, "ITEM", null, null, null, null, "wholesale",
                new BigDecimal("5"), false, 0, null, null, "Wholesale Tax", LocalDateTime.now(), LocalDateTime.now());
        TaxRule retailRule = new TaxRule(2L, 1L, null, "ITEM", null, null, null, null, "retail",
                new BigDecimal("10"), false, 0, null, null, "Retail Tax", LocalDateTime.now(), LocalDateTime.now());
        
        when(taxRepository.getTaxRulesByProfileId(1L)).thenReturn(List.of(wholesaleRule, retailRule));
        engine.init();
        
        Customer wholesaleCustomer = new Customer(1L, "Wholesale Co", null, null, null, "wholesale", false,
                LocalDateTime.now(), LocalDateTime.now(), null);
        
        TaxableItem item = new TaxableItem("Product", "Variant", new BigDecimal("100.00"), 1, null, 1L, 1L);
        TaxableInvoice invoice = new TaxableInvoice(List.of(item));
        
        TaxCalculationResult result = engine.calculate(invoice, wholesaleCustomer);
        
        assertEquals(new BigDecimal("5.00"), result.totalTax());
    }

    @Test
    void testDateRangeFiltering() {
        engine = new EnhancedTaxEngine(taxRepository, jsonService);
        
        TaxRule futureRule = new TaxRule(1L, 1L, null, "ITEM", null, null, null, null, null,
                new BigDecimal("10"), false, 0, LocalDate.now().plusDays(1), null, "Future Tax", 
                LocalDateTime.now(), LocalDateTime.now());
        
        when(taxRepository.getTaxRulesByProfileId(1L)).thenReturn(List.of(futureRule));
        engine.init();
        
        TaxableItem item = new TaxableItem("Product", "Variant", new BigDecimal("100.00"), 1, null, 1L, 1L);
        TaxableInvoice invoice = new TaxableInvoice(List.of(item));
        
        TaxCalculationResult result = engine.calculate(invoice, null);
        
        assertEquals(new BigDecimal("0.00"), result.totalTax());
    }

    @Test
    void testCompoundTaxCalculation() {
        engine = new EnhancedTaxEngine(taxRepository, jsonService);
        
        TaxRule simpleRule = new TaxRule(1L, 1L, null, "ITEM", null, null, null, null, null,
                new BigDecimal("10"), false, 0, null, null, "Base Tax", LocalDateTime.now(), LocalDateTime.now());
        TaxRule compoundRule = new TaxRule(2L, 1L, null, "ITEM", null, null, null, null, null,
                new BigDecimal("5"), true, 1, null, null, "Compound Tax", LocalDateTime.now(), LocalDateTime.now());
        
        when(taxRepository.getTaxRulesByProfileId(1L)).thenReturn(List.of(simpleRule, compoundRule));
        engine.init();
        
        TaxableItem item = new TaxableItem("Product", "Variant", new BigDecimal("100.00"), 1, null, 1L, 1L);
        TaxableInvoice invoice = new TaxableInvoice(List.of(item));
        
        TaxCalculationResult result = engine.calculate(invoice, null);
        
        assertEquals(new BigDecimal("15.50"), result.totalTax());
    }

    @Test
    void testNoActiveProfile() {
        when(taxRepository.getActiveTaxProfile()).thenReturn(Optional.empty());
        engine = new EnhancedTaxEngine(taxRepository, jsonService);
        engine.init();
        
        TaxableItem item = new TaxableItem("Product", "Variant", new BigDecimal("100.00"), 1, null, 1L, 1L);
        TaxableInvoice invoice = new TaxableInvoice(List.of(item));
        
        TaxCalculationResult result = engine.calculate(invoice, null);
        
        assertEquals(BigDecimal.ZERO, result.totalTax());
    }
}
