/**
 * Sale Controller
 * Handles HTTP requests for sales operations
 */
import * as SaleService from './sale.service.js';

/**
 * POST /api/sales
 * Create a new sale
 */
export async function createSale(req, res) {
    try {
        const { items, customerId, discount, payments, taxMode, billTaxIds, fulfillment_status } = req.body;

        // Use userId from middleware if available
        const userId = req.user?.id || 1;
        const token = req.token; // From middleware

        const result = await SaleService.createSale({
            items,
            customerId,
            userId,
            discount,
            payments,
            taxMode,
            billTaxIds,
            fulfillment_status,
            token
        });

        res.status(201).json(result);
    } catch (error) {
        // Check for specific errors
        if (error.message.includes('Insufficient stock')) {
             return res.status(400).json({ error: error.message, code: 'INSUFFICIENT_STOCK' });
        }
        res.status(400).json({ error: error.message });
    }
}

/**
 * GET /api/sales
 */
export async function getSales(req, res) {
    try {
        const result = await SaleService.getSales(req.query);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

/**
 * GET /api/sales/:id
 */
export async function getSale(req, res) {
    try {
        const result = await SaleService.getSale(req.params.id);
        if (!result) return res.status(404).json({ error: 'Sale not found' });
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

/**
 * PUT /api/sales/:id
 */
export async function updateSale(req, res) {
    try {
        const { status } = req.body;
        const userId = req.user?.id;
        const token = req.token;
        const saleId = req.params.id;

        if (status === 'cancelled') {
            const result = await SaleService.cancelSale(saleId, userId, token);
            return res.json(result);
        }

        res.status(400).json({ error: 'Update not supported except cancellation' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}

export async function deleteSale(req, res) {
    try {
        const userId = req.user?.id;
        const token = req.token;
        const saleId = req.params.id;

        const result = await SaleService.cancelSale(saleId, userId, token);
        res.json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}

export async function getPaymentMethods(req, res) {
    try {
        const methods = await SaleService.getPaymentMethods();
        res.json(methods);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

export async function fulfillSale(req, res) {
    try {
        const userId = req.user?.id || 1;
        const saleId = req.params.id;
        const token = req.token;
        const result = await SaleService.fulfillSale(saleId, userId, token);
        res.json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}

export async function addPayment(req, res) {
    try {
        const saleId = req.params.id;
        const { amount, paymentMethodId } = req.body;
        const userId = req.user?.id || 1;
        const token = req.token;

        const result = await SaleService.addPayment({
            saleId,
            amount,
            paymentMethodId,
            userId,
            token
        });
        res.json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}
