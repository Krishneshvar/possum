/**
 * Product Flow Controller
 * Handles HTTP requests for product flow analysis
 */
import * as productFlowService from '../../../../core/index.js';
import { Request, Response } from 'express';
import { getQueryNumber, getQueryString, getQueryArray } from '../../shared/utils/index.js';

/**
 * GET /api/product-flow/variants/:id
 * Get flow timeline for a variant
 */
export async function getVariantFlowController(req: Request, res: Response) {
    try {
        const variantId = parseInt(req.params.id as string, 10);
        if (isNaN(variantId)) {
            return res.status(400).json({ error: 'Invalid variant ID.' });
        }

        const { limit, offset, startDate, endDate, paymentMethods } = req.query;

        let parsedPaymentMethods: string[] = [];
        if (paymentMethods) {
            // Handle both array (multiple params) and string (single param or CSV)
            if (Array.isArray(paymentMethods)) {
                parsedPaymentMethods = getQueryArray(paymentMethods);
            } else {
                parsedPaymentMethods = (paymentMethods as string).split(',').map(s => s.trim());
            }
        }

        const timeline = productFlowService.getVariantTimeline(variantId, {
            limit: getQueryNumber(limit, 100) || 100,
            offset: getQueryNumber(offset, 0) || 0,
            startDate: getQueryString(startDate) || null,
            endDate: getQueryString(endDate) || null,
            paymentMethods: parsedPaymentMethods
        });

        res.json(timeline);
    } catch (err: any) {
        console.error('Error fetching product flow:', err);
        res.status(500).json({ error: 'Failed to retrieve product flow.' });
    }
}

/**
 * GET /api/product-flow/variants/:id/summary
 * Get flow summary for a variant
 */
export async function getVariantFlowSummaryController(req: Request, res: Response) {
    try {
        const variantId = parseInt(req.params.id as string, 10);
        if (isNaN(variantId)) {
            return res.status(400).json({ error: 'Invalid variant ID.' });
        }

        const summary = productFlowService.getVariantFlowSummary(variantId);
        res.json(summary);
    } catch (err: any) {
        console.error('Error fetching flow summary:', err);
        res.status(500).json({ error: 'Failed to retrieve flow summary.' });
    }
}
