import * as taxRepository from './tax.repository.js';
import { taxEngine } from './tax.engine.js';
import * as customerRepository from '../customers/customer.repository.js';

// --- Profiles ---

export async function getTaxProfiles(req, res) {
    try {
        const profiles = taxRepository.getAllTaxProfiles();
        res.json(profiles);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

export async function createTaxProfile(req, res) {
    try {
        const result = taxRepository.createTaxProfile(req.body);
        res.status(201).json({ id: result.lastInsertRowid, ...req.body });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

export async function updateTaxProfile(req, res) {
    try {
        const { id } = req.params;
        const result = taxRepository.updateTaxProfile(id, req.body);
        if (result.changes === 0) return res.status(404).json({ error: 'Profile not found' });
        res.json({ message: 'Profile updated' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

export async function deleteTaxProfile(req, res) {
    try {
        const { id } = req.params;
        taxRepository.deleteTaxProfile(id);
        res.json({ message: 'Profile deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

// --- Categories ---

export async function getTaxCategories(req, res) {
    try {
        const categories = taxRepository.getAllTaxCategories();
        res.json(categories);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

export async function createTaxCategory(req, res) {
    try {
        const result = taxRepository.createTaxCategory(req.body);
        res.status(201).json({ id: result.lastInsertRowid, ...req.body });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

export async function updateTaxCategory(req, res) {
    try {
        const { id } = req.params;
        taxRepository.updateTaxCategory(id, req.body);
        res.json({ message: 'Category updated' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

export async function deleteTaxCategory(req, res) {
    try {
        const { id } = req.params;
        taxRepository.deleteTaxCategory(id);
        res.json({ message: 'Category deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

// --- Rules ---

export async function getTaxRules(req, res) {
    try {
        const { profileId } = req.query;
        if (!profileId) return res.status(400).json({ error: 'profileId is required' });
        const rules = taxRepository.getTaxRulesByProfileId(profileId);
        res.json(rules);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

export async function createTaxRule(req, res) {
    try {
        const result = taxRepository.createTaxRule(req.body);
        res.status(201).json({ id: result.lastInsertRowid, ...req.body });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

export async function updateTaxRule(req, res) {
    try {
        const { id } = req.params;
        taxRepository.updateTaxRule(id, req.body);
        res.json({ message: 'Rule updated' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

export async function deleteTaxRule(req, res) {
    try {
        const { id } = req.params;
        taxRepository.deleteTaxRule(id);
        res.json({ message: 'Rule deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

// --- Calculation ---

export async function calculateTax(req, res) {
    try {
        let { invoice, customer, customerId } = req.body;

        if (customerId && !customer) {
            customer = customerRepository.findCustomerById(customerId);
        }

        // Re-init engine to ensure fresh rules
        taxEngine.init();
        const result = taxEngine.calculate(invoice, customer);
        res.json(result);
    } catch (err) {
        console.error("Tax calculation error:", err);
        res.status(500).json({ error: err.message });
    }
}
