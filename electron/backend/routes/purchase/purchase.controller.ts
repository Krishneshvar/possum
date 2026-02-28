import * as purchaseService from '../../../../core/index.js';
import { Request, Response, NextFunction } from 'express';

export function getPurchaseOrders(req: Request, res: Response, next: NextFunction) {
    try {
        const { page, limit, searchTerm, status, fromDate, toDate, sortBy, sortOrder } = req.query as {
            page?: number;
            limit?: number;
            searchTerm?: string;
            status?: string;
            fromDate?: string;
            toDate?: string;
            sortBy?: string;
            sortOrder?: 'ASC' | 'DESC';
        };
        const pos = purchaseService.getAllPurchaseOrders({
            page: page ? Number(page) : undefined,
            limit: limit ? Number(limit) : undefined,
            searchTerm,
            status,
            fromDate,
            toDate,
            sortBy,
            sortOrder
        });
        res.json(pos);
    } catch (error: any) {
        next(error);
    }
}

export function getPurchaseOrderById(req: Request, res: Response, next: NextFunction) {
    try {
        const po = purchaseService.getPurchaseOrderById(Number(req.params.id));
        res.json(po);
    } catch (error: any) {
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

export function updatePurchaseOrder(req: Request, res: Response, next: NextFunction) {
    try {
        if (!req.user?.id) return res.status(401).json({ error: 'Unauthorized: No user session' });
        const poData = {
            ...(req.body || {}),
            updated_by: req.user.id
        };
        const updatedPo = purchaseService.updatePurchaseOrder(Number(req.params.id), poData);
        res.json(updatedPo);
    } catch (error: any) {
        next(error);
    }
}

export function receivePurchaseOrder(req: Request, res: Response, next: NextFunction) {
    try {
        if (!req.user?.id) return res.status(401).json({ error: 'Unauthorized: No user session' });
        const userId = req.user.id;
        const updatedPo = purchaseService.receivePurchaseOrder(Number(req.params.id), userId);
        res.json(updatedPo);
    } catch (error: any) {
        next(error);
    }
}

export function cancelPurchaseOrder(req: Request, res: Response, next: NextFunction) {
    try {
        if (!req.user?.id) return res.status(401).json({ error: 'Unauthorized: No user session' });
        const updatedPo = purchaseService.cancelPurchaseOrder(Number(req.params.id), req.user.id);
        res.json(updatedPo);
    } catch (error: any) {
        next(error);
    }
}
