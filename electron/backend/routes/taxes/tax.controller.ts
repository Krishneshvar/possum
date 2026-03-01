import { TaxRepository } from '../../../../repositories/index.js';
import { taxEngine } from '../../../../core/index.js';
import { CustomerRepository } from '../../../../repositories/index.js';
import { Request, Response } from 'express';
import { getQueryNumber } from '../../shared/utils/index.js';

const taxRepository = new TaxRepository();
const customerRepository = new CustomerRepository();

// --- Profiles ---

export async function getTaxProfiles(req: Request, res: Response) {
    try {
        const profiles = taxRepository.getAllTaxProfiles();
        res.json(profiles);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
}

export async function createTaxProfile(req: Request, res: Response) {
    try {
        const result = taxRepository.createTaxProfile(req.body);
        res.status(201).json({ id: result.lastInsertRowid, ...req.body });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
}

export async function updateTaxProfile(req: Request, res: Response) {
    try {
        const { id } = req.params;
        const result = taxRepository.updateTaxProfile(parseInt(id as string, 10), req.body);
        if (result.changes === 0) return res.status(404).json({ error: 'Profile not found' });
        res.json({ message: 'Profile updated' });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
}

export async function deleteTaxProfile(req: Request, res: Response) {
    try {
        const { id } = req.params;
        taxRepository.deleteTaxProfile(parseInt(id as string, 10));
        res.json({ message: 'Profile deleted' });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
}

// --- Categories ---

export async function getTaxCategories(req: Request, res: Response) {
    try {
        const categories = taxRepository.getAllTaxCategories();
        res.json(categories);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
}

export async function createTaxCategory(req: Request, res: Response) {
    try {
        const result = taxRepository.createTaxCategory(req.body);
        res.status(201).json({ id: result.lastInsertRowid, ...req.body });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
}

export async function updateTaxCategory(req: Request, res: Response) {
    try {
        const { id } = req.params;
        taxRepository.updateTaxCategory(parseInt(id as string, 10), req.body);
        res.json({ message: 'Category updated' });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
}

export async function deleteTaxCategory(req: Request, res: Response) {
    try {
        const { id } = req.params;
        taxRepository.deleteTaxCategory(parseInt(id as string, 10));
        res.json({ message: 'Category deleted' });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
}

// --- Rules ---

export async function getTaxRules(req: Request, res: Response) {
    try {
        const { profileId } = req.query;
        if (!profileId) return res.status(400).json({ error: 'profileId is required' });
        const profileIdNum = getQueryNumber(profileId);
        if (profileIdNum === undefined) {
            return res.status(400).json({ error: 'Invalid profileId' });
        }
        const rules = taxRepository.getTaxRulesByProfileId(profileIdNum);
        res.json(rules);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
}

export async function createTaxRule(req: Request, res: Response) {
    try {
        const result = taxRepository.createTaxRule(req.body);
        res.status(201).json({ id: result.lastInsertRowid, ...req.body });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
}

export async function updateTaxRule(req: Request, res: Response) {
    try {
        const { id } = req.params;
        taxRepository.updateTaxRule(parseInt(id as string, 10), req.body);
        res.json({ message: 'Rule updated' });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
}

export async function deleteTaxRule(req: Request, res: Response) {
    try {
        const { id } = req.params;
        taxRepository.deleteTaxRule(parseInt(id as string, 10));
        res.json({ message: 'Rule deleted' });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
}

// --- Calculation ---

export async function calculateTax(req: Request, res: Response) {
    try {
        let { invoice, customer, customerId } = req.body;

        if (customerId && !customer) {
            customer = customerRepository.findCustomerById(customerId);
        }

        // Re-init engine to ensure fresh rules
        taxEngine.init();
        const result = taxEngine.calculate(invoice, customer);
        res.json(result);
    } catch (err: any) {
        console.error("Tax calculation error:", err);
        res.status(500).json({ error: err.message });
    }
}
