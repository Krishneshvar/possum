package com.possum.application.sales;

import com.possum.application.sales.dto.TaxCalculationResult;
import com.possum.application.sales.dto.TaxableInvoice;
import com.possum.application.sales.dto.TaxableItem;
import com.possum.domain.model.Customer;
import com.possum.domain.model.TaxProfile;
import com.possum.domain.model.TaxRule;
import com.possum.infrastructure.serialization.JsonService;
import com.possum.persistence.repositories.interfaces.TaxRepository;
import com.possum.testutil.Fixtures;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@org.mockito.junit.jupiter.MockitoSettings(strictness = org.mockito.quality.Strictness.LENIENT)
class TaxEngineTest {

    @Mock TaxRepository taxRepository;
    @Mock JsonService jsonService;

    TaxEngine engine;

    @BeforeEach
    void setUp() {
        engine = new TaxEngine(taxRepository, jsonService);
        when(jsonService.toJson(org.mockito.ArgumentMatchers.any())).thenReturn("[]");
    }

    private void initWithProfile(TaxProfile profile, List<TaxRule> rules) {
        when(taxRepository.getActiveTaxProfile()).thenReturn(Optional.of(profile));
        when(taxRepository.getTaxRulesByProfileId(anyLong())).thenReturn(rules);
        engine.init();
    }

    private void initWithNoProfile() {
        when(taxRepository.getActiveTaxProfile()).thenReturn(Optional.empty());
        engine.init();
    }

    // --- No profile ---

    @Test
    void calculate_noProfile_returnsZeroTax() {
        initWithNoProfile();
        TaxableInvoice invoice = new TaxableInvoice(List.of(Fixtures.item("100", 1)));
        TaxCalculationResult result = engine.calculate(invoice, null);
        assertEquals(BigDecimal.ZERO, result.totalTax());
        assertEquals(new BigDecimal("100"), result.grandTotal());
    }

    // --- Tax exempt ---

    @Test
    void calculate_taxExemptCustomer_returnsZeroTax() {
        initWithProfile(Fixtures.exclusiveProfile(), List.of(Fixtures.rule().rate("10").build()));
        TaxableInvoice invoice = new TaxableInvoice(List.of(Fixtures.item("100", 1)));
        TaxCalculationResult result = engine.calculate(invoice, Fixtures.taxExemptCustomer());
        assertEquals(BigDecimal.ZERO, result.totalTax());
    }

    @Test
    void calculate_nullCustomer_taxApplied() {
        initWithProfile(Fixtures.exclusiveProfile(), List.of(Fixtures.rule().rate("10").build()));
        TaxableInvoice invoice = new TaxableInvoice(List.of(Fixtures.item("100", 1)));
        TaxCalculationResult result = engine.calculate(invoice, null);
        assertEquals(new BigDecimal("10.00"), result.totalTax());
    }

    // --- Input validation ---

    @Test
    void calculate_negativePrice_throwsIllegalArgument() {
        initWithProfile(Fixtures.exclusiveProfile(), List.of(Fixtures.rule().build()));
        TaxableInvoice invoice = new TaxableInvoice(List.of(Fixtures.item("-1", 1)));
        assertThrows(IllegalArgumentException.class, () -> engine.calculate(invoice, null));
    }

    // --- Exclusive pricing ---

    @Test
    void calculate_exclusive_singleRule_correctTaxAndGrandTotal() {
        initWithProfile(Fixtures.exclusiveProfile(), List.of(Fixtures.rule().rate("10").build()));
        TaxableInvoice invoice = new TaxableInvoice(List.of(Fixtures.item("200", 2)));
        TaxCalculationResult result = engine.calculate(invoice, null);
        // 200 * 2 = 400, 10% = 40
        assertEquals(new BigDecimal("40.00"), result.totalTax());
        assertEquals(new BigDecimal("440.00"), result.grandTotal());
    }

    @Test
    void calculate_exclusive_multipleItems_taxSummedThenRounded() {
        initWithProfile(Fixtures.exclusiveProfile(), List.of(Fixtures.rule().rate("10").build()));
        TaxableInvoice invoice = new TaxableInvoice(List.of(
                Fixtures.item("33.33", 1),
                Fixtures.item("33.33", 1)
        ));
        TaxCalculationResult result = engine.calculate(invoice, null);
        // raw: 3.333 + 3.333 = 6.666 → rounded once = 6.67
        assertEquals(new BigDecimal("6.67"), result.totalTax());
    }

    @Test
    void calculate_exclusive_compoundRule_appliedOnTopOfSimple() {
        TaxRule simple = Fixtures.rule().id(1).rate("10").compound(false).priority(0).build();
        TaxRule compound = Fixtures.rule().id(2).rate("5").compound(true).priority(1).build();
        initWithProfile(Fixtures.exclusiveProfile(), List.of(simple, compound));

        TaxableInvoice invoice = new TaxableInvoice(List.of(Fixtures.item("100", 1)));
        TaxCalculationResult result = engine.calculate(invoice, null);
        // simple: 10, compound: (100+10)*5% = 5.5 → total = 15.5
        assertEquals(new BigDecimal("15.50"), result.totalTax());
        assertEquals(new BigDecimal("115.50"), result.grandTotal());
    }

    // --- Inclusive pricing ---

    @Test
    void calculate_inclusive_taxExtractedFromPrice() {
        initWithProfile(Fixtures.inclusiveProfile(), List.of(Fixtures.rule().rate("10").build()));
        TaxableInvoice invoice = new TaxableInvoice(List.of(Fixtures.item("110", 1)));
        TaxCalculationResult result = engine.calculate(invoice, null);
        // base = 110/1.1 = 100, tax = 10
        assertEquals(new BigDecimal("10.00"), result.totalTax());
        // grand total = subtotal (price already includes tax)
        assertEquals(0, result.grandTotal().compareTo(new BigDecimal("110")));
    }

    @Test
    void calculate_inclusive_zeroTaxRule_noTaxExtracted() {
        initWithProfile(Fixtures.inclusiveProfile(), List.of(Fixtures.rule().rate("0").build()));
        TaxableInvoice invoice = new TaxableInvoice(List.of(Fixtures.item("100", 1)));
        TaxCalculationResult result = engine.calculate(invoice, null);
        assertEquals(new BigDecimal("0.00"), result.totalTax());
    }

    // --- Rule filtering ---

    @Test
    void getApplicableRules_customerTypeFilter_excludesNonMatchingCustomer() {
        TaxRule wholesalerRule = Fixtures.rule().customerType("Wholesaler").build();
        initWithProfile(Fixtures.exclusiveProfile(), List.of(wholesalerRule));

        Customer retailer = Fixtures.customerWithType("Retailer");
        TaxableItem item = Fixtures.item("100", 1);
        List<TaxRule> rules = engine.getApplicableRules(item, new BigDecimal("100"), retailer);
        assertTrue(rules.isEmpty());
    }

    @Test
    void getApplicableRules_customerTypeFilter_includesMatchingCustomer() {
        TaxRule wholesalerRule = Fixtures.rule().customerType("Wholesaler").build();
        initWithProfile(Fixtures.exclusiveProfile(), List.of(wholesalerRule));

        Customer wholesaler = Fixtures.customerWithType("Wholesaler");
        TaxableItem item = Fixtures.item("100", 1);
        List<TaxRule> rules = engine.getApplicableRules(item, new BigDecimal("100"), wholesaler);
        assertEquals(1, rules.size());
    }

    @Test
    void getApplicableRules_taxCategoryFilter_excludesNonMatchingCategory() {
        TaxRule categoryRule = Fixtures.rule().taxCategoryId(5L).build();
        initWithProfile(Fixtures.exclusiveProfile(), List.of(categoryRule));

        TaxableItem item = Fixtures.item("100", 1, 99L); // different category
        List<TaxRule> rules = engine.getApplicableRules(item, new BigDecimal("100"), null);
        assertTrue(rules.isEmpty());
    }

    @Test
    void getApplicableRules_priceRange_excludesItemBelowMin() {
        TaxRule rule = Fixtures.rule().minPrice("500").build();
        initWithProfile(Fixtures.exclusiveProfile(), List.of(rule));

        TaxableItem item = Fixtures.item("100", 1);
        List<TaxRule> rules = engine.getApplicableRules(item, new BigDecimal("100"), null);
        assertTrue(rules.isEmpty());
    }

    @Test
    void getApplicableRules_invoiceTotalRange_excludesBelowMin() {
        TaxRule rule = Fixtures.rule().minInvoiceTotal("1000").build();
        initWithProfile(Fixtures.exclusiveProfile(), List.of(rule));

        TaxableItem item = Fixtures.item("100", 1);
        List<TaxRule> rules = engine.getApplicableRules(item, new BigDecimal("100"), null);
        assertTrue(rules.isEmpty());
    }

    @Test
    void getApplicableRules_expiredRule_excluded() {
        TaxRule expired = Fixtures.rule().validTo(LocalDate.now().minusDays(1)).build();
        initWithProfile(Fixtures.exclusiveProfile(), List.of(expired));

        TaxableItem item = Fixtures.item("100", 1);
        List<TaxRule> rules = engine.getApplicableRules(item, new BigDecimal("100"), null);
        assertTrue(rules.isEmpty());
    }

    @Test
    void getApplicableRules_futureRule_excluded() {
        TaxRule future = Fixtures.rule().validFrom(LocalDate.now().plusDays(1)).build();
        initWithProfile(Fixtures.exclusiveProfile(), List.of(future));

        TaxableItem item = Fixtures.item("100", 1);
        List<TaxRule> rules = engine.getApplicableRules(item, new BigDecimal("100"), null);
        assertTrue(rules.isEmpty());
    }

    @Test
    void getApplicableRules_negativeRate_excluded() {
        TaxRule badRule = Fixtures.rule().rate("-5").build();
        initWithProfile(Fixtures.exclusiveProfile(), List.of(badRule));

        TaxableItem item = Fixtures.item("100", 1);
        List<TaxRule> rules = engine.getApplicableRules(item, new BigDecimal("100"), null);
        assertTrue(rules.isEmpty());
    }

    // --- Item tax rate set on result ---

    @Test
    void calculate_setsEffectiveTaxRateOnItem() {
        initWithProfile(Fixtures.exclusiveProfile(), List.of(Fixtures.rule().rate("10").build()));
        TaxableItem item = Fixtures.item("100", 1);
        TaxableInvoice invoice = new TaxableInvoice(List.of(item));
        TaxCalculationResult result = engine.calculate(invoice, null);
        assertNotNull(result.getItemByIndex(0).getTaxRate());
        assertTrue(result.getItemByIndex(0).getTaxRate().compareTo(BigDecimal.ZERO) > 0);
    }

    @Test
    void calculate_noRules_zeroTaxOnItems() {
        initWithProfile(Fixtures.exclusiveProfile(), List.of());
        TaxableItem item = Fixtures.item("100", 1);
        TaxableInvoice invoice = new TaxableInvoice(List.of(item));
        TaxCalculationResult result = engine.calculate(invoice, null);
        assertEquals(0, result.totalTax().compareTo(BigDecimal.ZERO));
        // With no rules, calculateItemTax returns zero taxAmount
        assertEquals(0, result.getItemByIndex(0).getTaxAmount().compareTo(BigDecimal.ZERO));
    }
}
