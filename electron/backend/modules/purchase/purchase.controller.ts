/**
 * Purchase Controller
 * HTTP handlers for POs
 */
import * as purchaseService from './purchase.service.js';
import { Request, Response } from 'express';
import { getQueryNumber, getQueryString } from '../../shared/utils/index.js';

export function getPurchaseOrders(req: Request, res: Response) {
    try {
        const { page, limit, searchTerm, status, sortBy, sortOrder } = req.query;
        const pos = purchaseService.getAllPurchaseOrders({
            page: getQueryNumber(page, 1) || 1,
            limit: getQueryNumber(limit, 10) || 10,
            searchTerm: getQueryString(searchTerm),
            status: getQueryString(status),
            sortBy: getQueryString(sortBy),
            sortOrder: getQueryString(sortOrder) as 'ASC' | 'DESC' | undefined
        });
        res.json(pos);
    } catch (error) {
        console.error('Error fetching POs:', error);
        res.status(500).json({ error: 'Failed to fetch purchase orders' });
    }
}

export function getPurchaseOrderById(req: Request, res: Response) {
    try {
        const po = purchaseService.getPurchaseOrderById(parseInt(req.params.id as string, 10));
        res.json(po);
    } catch (error: any) {
        console.error('Error fetching PO:', error);
        if (error.message === 'Purchase Order not found') {
            return res.status(404).json({ error: error.message });
        }
        res.status(500).json({ error: 'Failed to fetch purchase order' });
    }
}

export function createPurchaseOrder(req: Request, res: Response) {
    try {
        if (!req.user?.id) return res.status(401).json({ error: 'Unauthorized: No user session' });
        const poData = {
            ...(req.body || {}),
            created_by: req.user.id
        };
        const newPo = purchaseService.createPurchaseOrder(poData);
        res.status(201).json(newPo);
    } catch (error: any) {
        console.error('Error creating PO:', error);
        res.status(500).json({ error: error.message || 'Failed to create purchase order' });
    }
}

export function receivePurchaseOrder(req: Request, res: Response) {
    try {
        if (!req.user?.id) return res.status(401).json({ error: 'Unauthorized: No user session' });
        const userId = req.user.id;
        const updatedPo = purchaseService.receivePurchaseOrder(parseInt(req.params.id as string, 10), userId);
        res.json(updatedPo);
    } catch (error: any) {
        console.error('Error receiving PO:', error);
        res.status(400).json({ error: error.message });
    }
}

export function cancelPurchaseOrder(req: Request, res: Response) {
    try {
        const updatedPo = purchaseService.cancelPurchaseOrder(parseInt(req.params.id as string, 10));
        res.json(updatedPo);
    } catch (error: any) {
        console.error('Error cancelling PO:', error);
        res.status(400).json({ error: error.message });
    }
}
