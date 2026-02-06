/**
 * Sale Controller
 * Handles HTTP requests for sales operations
 */
import * as saleService from './sale.service.js';

/**
 * POST /api/sales
 * Create a new sale
 */
export async function createSaleController(req, res) {
    try {
        const { items, customerId, discount, payments, taxMode, billTaxIds } = req.body;

        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ error: 'At least one item is required.' });
        }

        // Validate items
        for (const item of items) {
            if (!item.variantId || !item.quantity || item.quantity <= 0) {
                return res.status(400).json({ error: 'Each item must have variantId and positive quantity.' });
            }
        }

        // Get userId from auth context
        const userId = req.userId || 1;

        const sale = saleService.createSale({
            items,
            customerId: customerId ? parseInt(customerId, 10) : null,
            userId,
            discount: parseFloat(discount) || 0,
            taxMode,
            billTaxIds: Array.isArray(billTaxIds) ? billTaxIds.map(id => parseInt(id, 10)) : [],
            payments: (payments || []).map(p => ({
                ...p,
                paymentMethodId: parseInt(p.paymentMethodId, 10)
            }))
        });

        res.status(201).json(sale);
    } catch (err) {
        console.error('Error creating sale:', err);
        if (err.message.includes('Insufficient stock')) {
            return res.status(400).json({ error: err.message, code: 'INSUFFICIENT_STOCK' });
        }
        res.status(500).json({ error: 'Failed to create sale.' });
    }
}

/**
 * GET /api/sales
 * Get sales list with pagination
 */
export async function getSalesController(req, res) {
    try {
        const {
            page = 1,
            limit = 20,
            status,
            customerId,
            userId,
            startDate,
            endDate,
            searchTerm,
            fulfillmentStatus,
            sortBy = 'sale_date',
            sortOrder = 'DESC'
        } = req.query;

        const statusArray = status
            ? (Array.isArray(status) ? status : [status])
            : [];

        const sales = saleService.getSales({
            status: statusArray,
            customerId: customerId ? parseInt(customerId, 10) : null,
            userId: userId ? parseInt(userId, 10) : null,
            startDate: startDate || null,
            endDate: endDate || null,
            searchTerm: searchTerm || null,
            currentPage: parseInt(page, 10),
            itemsPerPage: parseInt(limit, 10),
            sortBy,
            sortOrder,
            fulfillmentStatus
        });

        res.json(sales);
    } catch (err) {
        console.error('Error fetching sales:', err);
        res.status(500).json({ error: 'Failed to retrieve sales.' });
    }
}

/**
 * GET /api/sales/:id
 * Get sale details
 */
export async function getSaleController(req, res) {
    try {
        const saleId = parseInt(req.params.id, 10);
        if (isNaN(saleId)) {
            return res.status(400).json({ error: 'Invalid sale ID.' });
        }

        const sale = saleService.getSale(saleId);
        if (!sale) {
            return res.status(404).json({ error: 'Sale not found.' });
        }

        res.json(sale);
    } catch (err) {
        console.error('Error fetching sale:', err);
        res.status(500).json({ error: 'Failed to retrieve sale.' });
    }
}

/**
 * POST /api/sales/:id/payments
 * Add payment to a sale
 */
export async function addPaymentController(req, res) {
    try {
        const saleId = parseInt(req.params.id, 10);
        if (isNaN(saleId)) {
            return res.status(400).json({ error: 'Invalid sale ID.' });
        }

        const { amount, paymentMethodId } = req.body;
        if (!amount || !paymentMethodId) {
            return res.status(400).json({ error: 'amount and paymentMethodId are required.' });
        }

        // Get userId from auth context
        const userId = req.userId || 1;

        const result = saleService.addPayment({
            saleId,
            amount: parseFloat(amount),
            paymentMethodId: parseInt(paymentMethodId, 10),
            userId
        });

        res.json(result);
    } catch (err) {
        console.error('Error adding payment:', err);
        res.status(400).json({ error: err.message });
    }
}

/**
 * PUT /api/sales/:id/cancel
 * Cancel a sale
 */
export async function cancelSaleController(req, res) {
    try {
        const saleId = parseInt(req.params.id, 10);
        if (isNaN(saleId)) {
            return res.status(400).json({ error: 'Invalid sale ID.' });
        }

        // Get userId from auth context
        const userId = req.userId || 1;

        const result = saleService.cancelSale(saleId, userId);
        res.json(result);
    } catch (err) {
        console.error('Error cancelling sale:', err);
        res.status(400).json({ error: err.message });
    }
}

/**
 * GET /api/sales/payment-methods
 * Get all active payment methods
 */
export async function getPaymentMethodsController(req, res) {
    try {
        const methods = saleService.getPaymentMethods();
        res.json(methods);
    } catch (err) {
        console.error('Error fetching payment methods:', err);
        res.status(500).json({ error: 'Failed to retrieve payment methods.' });
    }
}

/**
 * PUT /api/sales/:id/fulfill
 * Fulfill a sale/order
 */
export async function fulfillSaleController(req, res) {
    try {
        const saleId = parseInt(req.params.id, 10);
        if (isNaN(saleId)) {
            return res.status(400).json({ error: 'Invalid sale ID.' });
        }

        const userId = req.userId || 1;
        const result = saleService.fulfillSale(saleId, userId);
        res.json(result);
    } catch (err) {
        console.error('Error fulfilling sale:', err);
        res.status(400).json({ error: err.message });
    }
}
