/**
 * Product Flow Controller
 * Handles HTTP requests for product flow analysis
 */
import * as productFlowService from './productFlow.service.js';

/**
 * GET /api/product-flow/variants/:id
 * Get flow timeline for a variant
 */
export async function getVariantFlowController(req, res) {
    try {
        const variantId = parseInt(req.params.id, 10);
        if (isNaN(variantId)) {
            return res.status(400).json({ error: 'Invalid variant ID.' });
        }

        const { limit = 100, offset = 0, startDate, endDate, paymentMethods } = req.query;

        let parsedPaymentMethods = [];
        if (paymentMethods) {
            // Handle both array (multiple params) and string (single param or CSV)
            if (Array.isArray(paymentMethods)) {
                parsedPaymentMethods = paymentMethods;
            } else {
                parsedPaymentMethods = paymentMethods.split(',').map(s => s.trim());
            }
        }

        const timeline = productFlowService.getVariantTimeline(variantId, {
            limit: parseInt(limit, 10),
            offset: parseInt(offset, 10),
            startDate: startDate || null,
            endDate: endDate || null,
            paymentMethods: parsedPaymentMethods
        });

        res.json(timeline);
    } catch (err) {
        console.error('Error fetching product flow:', err);
        res.status(500).json({ error: 'Failed to retrieve product flow.' });
    }
}

/**
 * GET /api/product-flow/variants/:id/summary
 * Get flow summary for a variant
 */
export async function getVariantFlowSummaryController(req, res) {
    try {
        const variantId = parseInt(req.params.id, 10);
        if (isNaN(variantId)) {
            return res.status(400).json({ error: 'Invalid variant ID.' });
        }

        const summary = productFlowService.getVariantFlowSummary(variantId);
        res.json(summary);
    } catch (err) {
        console.error('Error fetching flow summary:', err);
        res.status(500).json({ error: 'Failed to retrieve flow summary.' });
    }
}
