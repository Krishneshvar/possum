package com.possum.application.taxes;

import com.possum.domain.model.TaxCategory;
import com.possum.domain.model.TaxProfile;
import com.possum.domain.model.TaxRule;
import com.possum.persistence.repositories.interfaces.TaxRepository;

import java.util.List;
import java.util.Optional;

public class TaxManagementService {
    private final TaxRepository taxRepository;

    public TaxManagementService(TaxRepository taxRepository) {
        this.taxRepository = taxRepository;
    }

    public Optional<TaxProfile> getActiveTaxProfile() {
        return taxRepository.getActiveTaxProfile();
    }

    public List<TaxProfile> getAllTaxProfiles() {
        return taxRepository.getAllTaxProfiles();
    }

    public long createTaxProfile(TaxProfile profile) {
        return taxRepository.createTaxProfile(profile);
    }

    public int updateTaxProfile(long id, TaxProfile profile) {
        return taxRepository.updateTaxProfile(id, profile);
    }

    public int deleteTaxProfile(long id) {
        return taxRepository.deleteTaxProfile(id);
    }

    public List<TaxCategory> getAllTaxCategories() {
        return taxRepository.getAllTaxCategories();
    }

    public long createTaxCategory(String name, String description) {
        return taxRepository.createTaxCategory(name, description);
    }

    public int updateTaxCategory(long id, String name, String description) {
        return taxRepository.updateTaxCategory(id, name, description);
    }

    public int deleteTaxCategory(long id) {
        return taxRepository.deleteTaxCategory(id);
    }

    public List<TaxRule> getTaxRulesByProfileId(long profileId) {
        return taxRepository.getTaxRulesByProfileId(profileId);
    }

    public long createTaxRule(TaxRule rule) {
        return taxRepository.createTaxRule(rule);
    }

    public int updateTaxRule(long id, TaxRule rule) {
        return taxRepository.updateTaxRule(id, rule);
    }

    public int deleteTaxRule(long id) {
        return taxRepository.deleteTaxRule(id);
    }
}
