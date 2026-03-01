import { getDB } from '../electron/backend/shared/db/index.js';
import { PurchaseOrder, PurchaseOrderItem } from '../models/index.js';
import type { IPurchaseRepository, PurchaseOrderQueryOptions, CreatePOItem, CreatePOData, UpdatePOData } from '../core/index.js';

interface CountRow {
    count: number;
}

function dbError(message: string, statusCode: number): Error & { statusCode: number } {
    const error = new Error(message) as Error & { statusCode: number };
    error.statusCode = statusCode;
    return error;
}

export class PurchaseRepository implements IPurchaseRepository {

    getAllPurchaseOrders({ page = 1, limit = 10, searchTerm = '', status = '', fromDate = '', toDate = '', sortBy = 'order_date', sortOrder = 'DESC' }: PurchaseOrderQueryOptions = {}) {
        const db = getDB();
        const offset = (page - 1) * limit;

        let whereClause = 'WHERE 1=1';
        const params: Array<string | number> = [];

        if (searchTerm) {
            whereClause += ` AND (s.name LIKE ? OR po.id LIKE ?)`;
            params.push(`%${searchTerm}%`, `%${searchTerm}%`);
        }

        if (status && status !== 'all') {
            whereClause += ` AND po.status = ?`;
            params.push(status);
        }

        if (fromDate) {
            whereClause += ` AND po.order_date >= ?`;
            params.push(fromDate);
        }

        if (toDate) {
            whereClause += ` AND po.order_date <= ?`;
            params.push(`${toDate} 23:59:59`);
        }

        // Map sort fields to actual columns
        const sortFieldMap: Record<string, string> = {
            'id': 'po.id',
            'supplier_name': 'supplier_name',
            'order_date': 'po.order_date',
            'status': 'po.status',
            'item_count': 'item_count',
            'total_cost': 'total_cost'
        };
        const sortColumn = sortFieldMap[sortBy!] || 'po.order_date';
        const direction = (sortOrder || 'DESC').toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

        const countQuery = `
        SELECT COUNT(*) as count 
        FROM purchase_orders po
        LEFT JOIN suppliers s ON po.supplier_id = s.id
        ${whereClause}
    `;
        const totalCount = (db.prepare(countQuery).get(...params) as CountRow).count;

        const dataQuery = `
        SELECT 
            po.*,
            s.name as supplier_name,
            u.name as created_by_name,
            (SELECT COUNT(*) FROM purchase_order_items WHERE purchase_order_id = po.id) as item_count,
            (SELECT SUM(quantity * unit_cost) FROM purchase_order_items WHERE purchase_order_id = po.id) as total_cost
        FROM purchase_orders po
        LEFT JOIN suppliers s ON po.supplier_id = s.id
        LEFT JOIN users u ON po.created_by = u.id
        ${whereClause}
        ORDER BY ${sortColumn} ${direction}
        LIMIT ? OFFSET ?
    `;
        const purchaseOrders = db.prepare(dataQuery).all(...params, limit, offset) as PurchaseOrder[];

        return {
            purchaseOrders,
            totalCount,
            totalPages: Math.ceil(totalCount / limit),
            page,
            limit
        };
    }

    getPurchaseOrderById(id: number) {
        const db = getDB();
        const po = db.prepare(`
        SELECT 
            po.*,
            s.name as supplier_name,
            u.name as created_by_name
        FROM purchase_orders po
        LEFT JOIN suppliers s ON po.supplier_id = s.id
        LEFT JOIN users u ON po.created_by = u.id
        WHERE po.id = ?
    `).get(id) as PurchaseOrder | undefined;

        if (!po) return null;

        const items = db.prepare(`
        SELECT 
            poi.*,
            v.name as variant_name,
            v.sku,
            p.name as product_name
        FROM purchase_order_items poi
        JOIN variants v ON poi.variant_id = v.id
        JOIN products p ON v.product_id = p.id
        WHERE poi.purchase_order_id = ?
    `).all(id) as PurchaseOrderItem[];

        return { ...po, items };
    }

    createPurchaseOrder({ supplier_id, created_by, items }: CreatePOData) {
        const db = getDB();

        const insertPo = db.prepare(`
        INSERT INTO purchase_orders (supplier_id, status, created_by)
        VALUES (?, 'pending', ?)
    `);

        const insertItem = db.prepare(`
        INSERT INTO purchase_order_items (purchase_order_id, variant_id, quantity, unit_cost)
        VALUES (?, ?, ?, ?)
    `);

        const supplierExistsStmt = db.prepare(`
        SELECT id FROM suppliers WHERE id = ? AND deleted_at IS NULL
    `);
        const variantExistsStmt = db.prepare(`
        SELECT id FROM variants WHERE id = ?
    `);

        const transaction = db.transaction((po: Omit<CreatePOData, 'items'>, itemList: CreatePOItem[]) => {
            const supplier = supplierExistsStmt.get(po.supplier_id) as { id: number } | undefined;
            if (!supplier) {
                throw dbError(`Supplier ${po.supplier_id} not found`, 400);
            }

            const result = insertPo.run(po.supplier_id, po.created_by);
            const poId = Number(result.lastInsertRowid);

            for (const item of itemList) {
                const variant = variantExistsStmt.get(item.variant_id) as { id: number } | undefined;
                if (!variant) {
                    throw dbError(`Variant ${item.variant_id} not found`, 400);
                }
                insertItem.run(poId, item.variant_id, item.quantity, item.unit_cost);
            }
            return poId;
        });

        return transaction({ supplier_id, created_by }, items);
    }

    updatePurchaseOrder(id: number, { supplier_id, updated_by, items }: UpdatePOData) {
        const db = getDB();

        const updatePo = db.prepare(`
            UPDATE purchase_orders 
            SET supplier_id = ?
            WHERE id = ? AND status = 'pending'
        `);

        const deleteItems = db.prepare(`
            DELETE FROM purchase_order_items
            WHERE purchase_order_id = ?
        `);

        const insertItem = db.prepare(`
            INSERT INTO purchase_order_items (purchase_order_id, variant_id, quantity, unit_cost)
            VALUES (?, ?, ?, ?)
        `);

        const supplierExistsStmt = db.prepare(`
            SELECT id FROM suppliers WHERE id = ? AND deleted_at IS NULL
        `);
        const variantExistsStmt = db.prepare(`
            SELECT id FROM variants WHERE id = ?
        `);
        const pendingPurchaseOrderStmt = db.prepare(`
            SELECT id FROM purchase_orders WHERE id = ? AND status = 'pending'
        `);

        const transaction = db.transaction((poId: number, reqSupplierId: number, itemList: CreatePOItem[]) => {
            const pendingPo = pendingPurchaseOrderStmt.get(poId) as { id: number } | undefined;
            if (!pendingPo) {
                throw dbError(`Purchase Order ${poId} not found or not pending`, 404);
            }

            const supplier = supplierExistsStmt.get(reqSupplierId) as { id: number } | undefined;
            if (!supplier) {
                throw dbError(`Supplier ${reqSupplierId} not found`, 400);
            }

            updatePo.run(reqSupplierId, poId);
            deleteItems.run(poId);

            for (const item of itemList) {
                const variant = variantExistsStmt.get(item.variant_id) as { id: number } | undefined;
                if (!variant) {
                    throw dbError(`Variant ${item.variant_id} not found`, 400);
                }
                insertItem.run(poId, item.variant_id, item.quantity, item.unit_cost);
            }
            return true;
        });

        return transaction(id, supplier_id, items);
    }

    receivePurchaseOrder(poId: number, userId: number = 1) {
        const db = getDB();
        const numericPoId = Number(poId);
        const numericUserId = Number(userId);

        const pendingPurchaseOrderStmt = db.prepare(`
        SELECT id FROM purchase_orders WHERE id = ? AND status = 'pending'
    `);
        const purchaseOrderItemsStmt = db.prepare(`
        SELECT * FROM purchase_order_items WHERE purchase_order_id = ?
    `);

        const updatePoParams = db.prepare(`
        UPDATE purchase_orders 
        SET status = 'received', received_date = CURRENT_TIMESTAMP 
        WHERE id = ? AND status = 'pending'
    `);

        const insertTransaction = db.prepare(`
        INSERT INTO transactions (purchase_order_id, amount, type, payment_method_id, status)
        VALUES (?, ?, 'purchase', 1, 'completed')
    `);

        const insertLot = db.prepare(`
        INSERT INTO inventory_lots (
            variant_id, quantity, unit_cost, purchase_order_item_id, created_at
        ) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);

        const insertAdjustment = db.prepare(`
        INSERT INTO inventory_adjustments (
            variant_id, lot_id, quantity_change, reason,
            reference_type, reference_id, adjusted_by
        )
        VALUES (?, ?, ?, 'confirm_receive', 'purchase_order_item', ?, ?)
    `);

        const insertFlow = db.prepare(`
        INSERT INTO product_flow (
            variant_id, event_type, quantity,
            reference_type, reference_id
        )
        VALUES (?, 'purchase', ?, 'purchase_order_item', ?)
    `);

        const transaction = db.transaction(() => {
            const pendingPo = pendingPurchaseOrderStmt.get(numericPoId) as { id: number } | undefined;
            if (!pendingPo) {
                throw dbError(`Purchase Order ${numericPoId} not found or already processed`, 404);
            }

            const items = purchaseOrderItemsStmt.all(numericPoId) as PurchaseOrderItem[];
            if (items.length === 0) {
                throw dbError(`Purchase Order ${numericPoId} has no items`, 400);
            }

            const result = updatePoParams.run(numericPoId);
            if (result.changes === 0) {
                throw dbError(`Purchase Order ${numericPoId} not found or already processed`, 409);
            }

            for (const item of items) {
                if (item.quantity <= 0 || item.unit_cost < 0) {
                    throw dbError(`Purchase Order ${numericPoId} has invalid item data`, 500);
                }

                // Create inventory lot
                const lotResult = insertLot.run(
                    item.variant_id,
                    item.quantity,
                    item.unit_cost,
                    item.id
                );
                const lotId = Number(lotResult.lastInsertRowid);

                // Create adjustment (reason: confirm_receive)
                insertAdjustment.run(
                    item.variant_id,
                    lotId,
                    item.quantity,
                    item.id,
                    numericUserId
                );

                // Log to product flow
                insertFlow.run(
                    item.variant_id,
                    item.quantity,
                    item.id
                );
            }

            const totalCost = items.reduce((sum, item) => sum + (item.quantity * item.unit_cost), 0);
            if (totalCost > 0) {
                insertTransaction.run(numericPoId, -totalCost);
            }

            return true;
        });

        return transaction();
    }

    cancelPurchaseOrder(id: number) {
        const db = getDB();
        return db.prepare("UPDATE purchase_orders SET status = 'cancelled' WHERE id = ? AND status = 'pending'").run(id);
    }
}
