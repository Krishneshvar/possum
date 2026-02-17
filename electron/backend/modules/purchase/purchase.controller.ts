import * as purchaseService from './purchase.service.js';
import { Request, Response, NextFunction } from 'express';
import { getQueryNumber, getQueryString } from '../../shared/utils/index.js';
import { logger } from '../../shared/utils/logger.js';

export function getPurchaseOrders(req: Request, res: Response, next: NextFunction) {
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
        next(error);
    }
}

export function getPurchaseOrderById(req: Request, res: Response, next: NextFunction) {
    try {
        const po = purchaseService.getPurchaseOrderById(parseInt(req.params.id as string, 10));
        res.json(po);
    } catch (error: any) {
        if (error.message === 'Purchase Order not found') {
            return res.status(404).json({ error: error.message });
        }
        next(error);
    }
}

export function createPurchaseOrder(req: Request, res: Response, next: NextFunction) {
    try {
        if (!req.user?.id) return res.status(401).json({ error: 'Unauthorized: No user session' });
        const poData = {
            ...(req.body || {}),
            created_by: req.user.id
        };
        const newPo = purchaseService.createPurchaseOrder(poData);
        res.status(201).json(newPo);
    } catch (error: any) {
        next(error);
    }
}

export function receivePurchaseOrder(req: Request, res: Response, next: NextFunction) {
    try {
        if (!req.user?.id) return res.status(401).json({ error: 'Unauthorized: No user session' });
        const userId = req.user.id;
        const updatedPo = purchaseService.receivePurchaseOrder(parseInt(req.params.id as string, 10), userId);
        res.json(updatedPo);
    } catch (error: any) {
        next(error);
    }
}

export function cancelPurchaseOrder(req: Request, res: Response, next: NextFunction) {
    try {
        const updatedPo = purchaseService.cancelPurchaseOrder(parseInt(req.params.id as string, 10));
        res.json(updatedPo);
    } catch (error: any) {
        next(error);
    }
}
