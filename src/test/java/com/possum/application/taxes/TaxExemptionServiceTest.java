package com.possum.application.taxes;

import com.possum.domain.exceptions.NotFoundException;
import com.possum.domain.exceptions.ValidationException;
import com.possum.domain.model.Customer;
import com.possum.domain.model.TaxExemption;
import com.possum.infrastructure.logging.AuditLogger;
import com.possum.persistence.repositories.interfaces.CustomerRepository;
import com.possum.persistence.repositories.interfaces.TaxExemptionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class TaxExemptionServiceTest {
    private TaxExemptionRepository taxExemptionRepository;
    private CustomerRepository customerRepository;
    private AuditLogger auditLogger;
    private TaxExemptionService service;

    @BeforeEach
    void setUp() {
        taxExemptionRepository = mock(TaxExemptionRepository.class);
        customerRepository = mock(CustomerRepository.class);
        auditLogger = mock(AuditLogger.class);
        service = new TaxExemptionService(taxExemptionRepository, customerRepository, auditLogger);
    }

    @Test
    void testCreateExemption() {
        Long customerId = 1L;
        Customer customer = new Customer(customerId, "NGO Corp", null, null, null, "ngo", false,
                LocalDateTime.now(), LocalDateTime.now(), null);
        
        when(customerRepository.findCustomerById(customerId)).thenReturn(Optional.of(customer));
        
        TaxExemption created = new TaxExemption(1L, customerId, "ngo", "CERT-123", "Non-profit",
                LocalDateTime.now(), null, 1L, LocalDateTime.now(), LocalDateTime.now());
        when(taxExemptionRepository.save(any())).thenReturn(created);

        TaxExemption result = service.createExemption(
                customerId, "ngo", "CERT-123", "Non-profit", null, null, 1L);

        assertNotNull(result);
        assertEquals("ngo", result.exemptionType());
        verify(taxExemptionRepository).save(any());
        verify(auditLogger).logDataModification(eq(1L), eq("CREATE"), eq("tax_exemptions"), eq(1L), isNull(), anyString());
    }

    @Test
    void testCreateExemptionCustomerNotFound() {
        when(customerRepository.findCustomerById(1L)).thenReturn(Optional.empty());

        assertThrows(NotFoundException.class, () ->
                service.createExemption(1L, "ngo", "CERT-123", "Non-profit", null, null, 1L));
    }

    @Test
    void testCreateExemptionInvalidType() {
        Long customerId = 1L;
        Customer customer = new Customer(customerId, "Test", null, null, null, "retail", false,
                LocalDateTime.now(), LocalDateTime.now(), null);
        when(customerRepository.findCustomerById(customerId)).thenReturn(Optional.of(customer));

        assertThrows(ValidationException.class, () ->
                service.createExemption(customerId, "invalid_type", "CERT-123", "Test", null, null, 1L));
    }

    @Test
    void testCreateExemptionMissingReason() {
        Long customerId = 1L;
        Customer customer = new Customer(customerId, "Test", null, null, null, "retail", false,
                LocalDateTime.now(), LocalDateTime.now(), null);
        when(customerRepository.findCustomerById(customerId)).thenReturn(Optional.of(customer));

        assertThrows(ValidationException.class, () ->
                service.createExemption(customerId, "ngo", "CERT-123", "", null, null, 1L));
    }

    @Test
    void testCreateExemptionInvalidDateRange() {
        Long customerId = 1L;
        Customer customer = new Customer(customerId, "Test", null, null, null, "retail", false,
                LocalDateTime.now(), LocalDateTime.now(), null);
        when(customerRepository.findCustomerById(customerId)).thenReturn(Optional.of(customer));

        LocalDateTime validFrom = LocalDateTime.now().plusDays(10);
        LocalDateTime validTo = LocalDateTime.now();

        assertThrows(ValidationException.class, () ->
                service.createExemption(customerId, "ngo", "CERT-123", "Test", validFrom, validTo, 1L));
    }

    @Test
    void testUpdateExemption() {
        Long exemptionId = 1L;
        TaxExemption existing = new TaxExemption(exemptionId, 1L, "ngo", "CERT-123", "Old reason",
                LocalDateTime.now(), null, 1L, LocalDateTime.now(), LocalDateTime.now());
        
        when(taxExemptionRepository.findById(exemptionId)).thenReturn(Optional.of(existing));
        
        TaxExemption updated = new TaxExemption(exemptionId, 1L, "government", "CERT-456", "New reason",
                LocalDateTime.now(), null, 1L, LocalDateTime.now(), LocalDateTime.now());
        when(taxExemptionRepository.save(any())).thenReturn(updated);

        TaxExemption result = service.updateExemption(
                exemptionId, "government", "CERT-456", "New reason", LocalDateTime.now(), null, 1L);

        assertNotNull(result);
        assertEquals("government", result.exemptionType());
        verify(taxExemptionRepository).save(any());
        verify(auditLogger).logDataModification(eq(1L), eq("UPDATE"), eq("tax_exemptions"), eq(exemptionId), anyString(), anyString());
    }

    @Test
    void testDeleteExemption() {
        Long exemptionId = 1L;
        TaxExemption exemption = new TaxExemption(exemptionId, 1L, "ngo", "CERT-123", "Test",
                LocalDateTime.now(), null, 1L, LocalDateTime.now(), LocalDateTime.now());
        
        when(taxExemptionRepository.findById(exemptionId)).thenReturn(Optional.of(exemption));

        service.deleteExemption(exemptionId, 1L);

        verify(taxExemptionRepository).delete(exemptionId);
        verify(auditLogger).logDataModification(eq(1L), eq("DELETE"), eq("tax_exemptions"), eq(exemptionId), anyString(), isNull());
    }

    @Test
    void testGetCustomerExemptions() {
        Long customerId = 1L;
        List<TaxExemption> exemptions = List.of(
                new TaxExemption(1L, customerId, "ngo", "CERT-123", "Test",
                        LocalDateTime.now(), null, 1L, LocalDateTime.now(), LocalDateTime.now())
        );
        
        when(taxExemptionRepository.findByCustomerId(customerId)).thenReturn(exemptions);

        List<TaxExemption> result = service.getCustomerExemptions(customerId);

        assertEquals(1, result.size());
        verify(taxExemptionRepository).findByCustomerId(customerId);
    }

    @Test
    void testGetActiveExemption() {
        Long customerId = 1L;
        TaxExemption exemption = new TaxExemption(1L, customerId, "ngo", "CERT-123", "Test",
                LocalDateTime.now().minusDays(1), LocalDateTime.now().plusDays(1), 1L,
                LocalDateTime.now(), LocalDateTime.now());
        
        when(taxExemptionRepository.findActiveExemption(eq(customerId), any())).thenReturn(Optional.of(exemption));

        Optional<TaxExemption> result = service.getActiveExemption(customerId);

        assertTrue(result.isPresent());
        assertEquals("ngo", result.get().exemptionType());
    }
}
