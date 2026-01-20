/**
 * Purchase Controller
 * HTTP handlers for POs
 */
import * as purchaseService from './purchase.service.js';

export function getPurchaseOrders(req, res) {
    try {
        const pos = purchaseService.getAllPurchaseOrders();
        res.json(pos);
    } catch (error) {
        console.error('Error fetching POs:', error);
        res.status(500).json({ error: 'Failed to fetch purchase orders' });
    }
}

export function getPurchaseOrderById(req, res) {
    try {
        const po = purchaseService.getPurchaseOrderById(req.params.id);
        res.json(po);
    } catch (error) {
        console.error('Error fetching PO:', error);
        if (error.message === 'Purchase Order not found') {
            return res.status(404).json({ error: error.message });
        }
        res.status(500).json({ error: 'Failed to fetch purchase order' });
    }
}

export function createPurchaseOrder(req, res) {
    try {
        // req.body should include supplier_id, items, created_by (if user auth is strict, getting from token is better)
        // For now taking from body or defaulting
        const poData = {
            ...req.body,
            created_by: req.body.created_by || 1 // Default to admin if not sent (TODO: Fix with Auth)
        };
        const newPo = purchaseService.createPurchaseOrder(poData);
        res.status(201).json(newPo);
    } catch (error) {
        console.error('Error creating PO:', error);
        res.status(500).json({ error: error.message || 'Failed to create purchase order' });
    }
}

export function receivePurchaseOrder(req, res) {
    try {
        const userId = req.body.userId || 1;
        const updatedPo = purchaseService.receivePurchaseOrder(req.params.id, userId);
        res.json(updatedPo);
    } catch (error) {
        console.error('Error receiving PO:', error);
        res.status(400).json({ error: error.message });
    }
}

export function cancelPurchaseOrder(req, res) {
    try {
        const updatedPo = purchaseService.cancelPurchaseOrder(req.params.id);
        res.json(updatedPo);
    } catch (error) {
        console.error('Error cancelling PO:', error);
        res.status(400).json({ error: error.message });
    }
}
