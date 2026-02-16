/**
 * Purchase Service
 * Business logic for POs
 */
import * as purchaseRepo from './purchase.repository.js';
import { CreatePOData, PurchaseOrderQueryOptions } from './purchase.repository.js';

export function getAllPurchaseOrders(options: PurchaseOrderQueryOptions) {
    return purchaseRepo.getAllPurchaseOrders(options);
}

export function getPurchaseOrderById(id: number) {
    const po = purchaseRepo.getPurchaseOrderById(id);
    if (!po) throw new Error('Purchase Order not found');
    return po;
}

export function createPurchaseOrder(data: CreatePOData) {
    // Validate items
    if (!data.items || data.items.length === 0) {
        throw new Error('Purchase Order must have at least one item');
    }

    const poId = Number(purchaseRepo.createPurchaseOrder(data));
    return getPurchaseOrderById(poId);
}

export function receivePurchaseOrder(id: number, userId: number) {
    purchaseRepo.receivePurchaseOrder(id, userId);
    return getPurchaseOrderById(id);
}

export function cancelPurchaseOrder(id: number) {
    const result = purchaseRepo.cancelPurchaseOrder(id);
    if (result.changes === 0) {
        throw new Error('Cannot cancel PO. It may vary be received or not found.');
    }
    return getPurchaseOrderById(id);
}
