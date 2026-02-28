import { IPurchaseRepository, CreatePOData, UpdatePOData, PurchaseOrderQueryOptions } from './purchase.repository.interface.js';

let purchaseRepo: IPurchaseRepository;
let auditService: any;

export function initPurchaseService(repo: IPurchaseRepository, audit: any) {
    purchaseRepo = repo;
    auditService = audit;
}

const VALID_STATUSES = new Set(['pending', 'received', 'cancelled']);
const VALID_SORT_FIELDS = new Set(['id', 'supplier_name', 'order_date', 'status', 'item_count', 'total_cost']);

function httpError(message: string, statusCode: number): Error & { statusCode: number } {
    const error = new Error(message) as Error & { statusCode: number };
    error.statusCode = statusCode;
    return error;
}

function assertPositiveInteger(value: number, fieldName: string) {
    if (!Number.isInteger(value) || value <= 0) {
        throw httpError(`${fieldName} must be a positive integer`, 400);
    }
}

export function getAllPurchaseOrders(options: PurchaseOrderQueryOptions = {}) {
    const page = options.page ?? 1;
    const limit = options.limit ?? 10;
    const searchTerm = options.searchTerm ?? '';
    const status = options.status ?? '';
    const fromDate = options.fromDate ?? '';
    const toDate = options.toDate ?? '';
    const sortBy = options.sortBy ?? 'order_date';
    const sortOrder = (options.sortOrder ?? 'DESC').toUpperCase();

    assertPositiveInteger(page, 'page');
    if (!Number.isInteger(limit) || limit <= 0 || limit > 100) {
        throw httpError('limit must be an integer between 1 and 100', 400);
    }
    if (status && status !== 'all' && !VALID_STATUSES.has(status)) {
        throw httpError('Invalid purchase order status filter', 400);
    }
    if (!VALID_SORT_FIELDS.has(sortBy)) {
        throw httpError('Invalid sort field for purchase orders', 400);
    }
    if (sortOrder !== 'ASC' && sortOrder !== 'DESC') {
        throw httpError('sortOrder must be ASC or DESC', 400);
    }

    return purchaseRepo.getAllPurchaseOrders({
        page,
        limit,
        searchTerm: searchTerm.trim(),
        status,
        fromDate,
        toDate,
        sortBy,
        sortOrder,
    });
}

export function getPurchaseOrderById(id: number) {
    assertPositiveInteger(id, 'id');
    const po = purchaseRepo.getPurchaseOrderById(id);
    if (!po) throw httpError('Purchase Order not found', 404);
    return po;
}

export function createPurchaseOrder(data: CreatePOData) {
    assertPositiveInteger(data.supplier_id, 'supplier_id');
    assertPositiveInteger(data.created_by, 'created_by');

    if (!Array.isArray(data.items) || data.items.length === 0) {
        throw httpError('Purchase Order must have at least one item', 400);
    }

    const duplicateCheck = new Set<number>();
    data.items.forEach((item, index) => {
        assertPositiveInteger(item.variant_id, `items[${index}].variant_id`);
        assertPositiveInteger(item.quantity, `items[${index}].quantity`);
        if (!Number.isFinite(item.unit_cost) || item.unit_cost < 0) {
            throw httpError(`items[${index}].unit_cost must be a non-negative number`, 400);
        }
        if (duplicateCheck.has(item.variant_id)) {
            throw httpError(`Duplicate variant_id ${item.variant_id} is not allowed in a purchase order`, 400);
        }
        duplicateCheck.add(item.variant_id);
    });

    const poId = purchaseRepo.createPurchaseOrder(data);
    auditService.logCreate(data.created_by, 'purchase_orders', poId, {
        supplier_id: data.supplier_id,
        item_count: data.items.length,
        total_cost: data.items.reduce((sum, item) => sum + (item.quantity * item.unit_cost), 0),
    });
    return getPurchaseOrderById(poId);
}

export function updatePurchaseOrder(id: number, data: UpdatePOData) {
    assertPositiveInteger(id, 'id');
    assertPositiveInteger(data.supplier_id, 'supplier_id');
    assertPositiveInteger(data.updated_by, 'updated_by');

    const existingPo = getPurchaseOrderById(id);
    if (existingPo.status !== 'pending') {
        throw httpError('Only pending Purchase Orders can be updated', 409);
    }

    if (!Array.isArray(data.items) || data.items.length === 0) {
        throw httpError('Purchase Order must have at least one item', 400);
    }

    const duplicateCheck = new Set<number>();
    data.items.forEach((item, index) => {
        assertPositiveInteger(item.variant_id, `items[${index}].variant_id`);
        assertPositiveInteger(item.quantity, `items[${index}].quantity`);
        if (!Number.isFinite(item.unit_cost) || item.unit_cost < 0) {
            throw httpError(`items[${index}].unit_cost must be a non-negative number`, 400);
        }
        if (duplicateCheck.has(item.variant_id)) {
            throw httpError(`Duplicate variant_id ${item.variant_id} is not allowed in a purchase order`, 400);
        }
        duplicateCheck.add(item.variant_id);
    });

    purchaseRepo.updatePurchaseOrder(id, data);

    auditService.logUpdate(data.updated_by, 'purchase_orders', id,
        { supplier_id: existingPo.supplier_id, item_count: existingPo.items.length },
        { supplier_id: data.supplier_id, item_count: data.items.length }
    );

    return getPurchaseOrderById(id);
}

export function receivePurchaseOrder(id: number, userId: number) {
    assertPositiveInteger(id, 'id');
    assertPositiveInteger(userId, 'userId');

    const existingPo = getPurchaseOrderById(id);
    if (existingPo.status !== 'pending') {
        throw httpError('Only pending Purchase Orders can be received', 409);
    }

    purchaseRepo.receivePurchaseOrder(id, userId);
    const updatedPo = getPurchaseOrderById(id);

    auditService.logUpdate(
        userId,
        'purchase_orders',
        id,
        { status: existingPo.status, received_date: existingPo.received_date ?? null },
        { status: updatedPo.status, received_date: updatedPo.received_date ?? null },
    );

    return updatedPo;
}

export function cancelPurchaseOrder(id: number, userId: number) {
    assertPositiveInteger(id, 'id');
    assertPositiveInteger(userId, 'userId');

    const existingPo = getPurchaseOrderById(id);
    if (existingPo.status !== 'pending') {
        throw httpError('Only pending Purchase Orders can be cancelled', 409);
    }

    const result = purchaseRepo.cancelPurchaseOrder(id);
    if (result.changes === 0) {
        throw httpError('Cannot cancel Purchase Order. It may already be updated by another request.', 409);
    }

    const updatedPo = getPurchaseOrderById(id);
    auditService.logUpdate(
        userId,
        'purchase_orders',
        id,
        { status: existingPo.status },
        { status: updatedPo.status },
    );

    return updatedPo;
}
