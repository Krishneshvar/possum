/**
 * Purchase Order Repository
 * Database operations for purchase orders
 */
import { getDB } from '../../shared/db/index.js';

/**
 * Get all purchase orders
 * @returns {Array} List of POs with supplier details
 */
export function getAllPurchaseOrders() {
    const db = getDB();
    return db.prepare(`
        SELECT 
            po.*,
            s.name as supplier_name,
            u.name as created_by_name,
            (SELECT COUNT(*) FROM purchase_order_items WHERE purchase_order_id = po.id) as item_count,
            (SELECT SUM(quantity * unit_cost) FROM purchase_order_items WHERE purchase_order_id = po.id) as total_cost
        FROM purchase_orders po
        LEFT JOIN suppliers s ON po.supplier_id = s.id
        LEFT JOIN users u ON po.created_by = u.id
        ORDER BY po.order_date DESC
    `).all();
}

/**
 * Get PO by ID with items
 * @param {number} id 
 * @returns {Object|null} PO object with items array
 */
export function getPurchaseOrderById(id) {
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
    `).get(id);

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
    `).all(id);

    return { ...po, items };
}

/**
 * Create a new Purchase Order
 * @param {Object} poData - { supplier_id, created_by, items: [{ variant_id, quantity, unit_cost }] }
 */
export function createPurchaseOrder({ supplier_id, created_by, items }) {
    const db = getDB();

    const insertPo = db.prepare(`
        INSERT INTO purchase_orders (supplier_id, status, created_by)
        VALUES (?, 'pending', ?)
    `);

    const insertItem = db.prepare(`
        INSERT INTO purchase_order_items (purchase_order_id, variant_id, quantity, unit_cost)
        VALUES (?, ?, ?, ?)
    `);

    const transaction = db.transaction((po, itemList) => {
        const result = insertPo.run(po.supplier_id, po.created_by);
        const poId = result.lastInsertRowid;

        for (const item of itemList) {
            insertItem.run(poId, item.variant_id, item.quantity, item.unit_cost);
        }
        return poId;
    });

    return transaction({ supplier_id, created_by }, items);
}

/**
 * Receive a Purchase Order
 * Updates status and creates inventory lots, adjustments, and flow logs
 * @param {number} poId 
 * @param {number} userId - User receiving the order
 */
export function receivePurchaseOrder(poId, userId = 1) {
    const db = getDB();
    const numericPoId = Number(poId);
    const numericUserId = Number(userId);

    // 1. Get PO Items
    const items = db.prepare('SELECT * FROM purchase_order_items WHERE purchase_order_id = ?').all(numericPoId);

    if (items.length === 0) {
        throw new Error(`Purchase Order ${numericPoId} has no items`);
    }

    const updatePoParams = db.prepare(`
        UPDATE purchase_orders 
        SET status = 'received', received_date = CURRENT_TIMESTAMP 
        WHERE id = ? AND status = 'pending'
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
        const result = updatePoParams.run(numericPoId);
        if (result.changes === 0) {
            throw new Error(`Purchase Order ${numericPoId} not found or already received`);
        }

        for (const item of items) {
            // Create inventory lot
            const lotResult = insertLot.run(
                item.variant_id,
                item.quantity,
                item.unit_cost,
                item.id
            );
            const lotId = lotResult.lastInsertRowid;

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
        return true;
    });

    return transaction();
}

/**
 * Cancel a Purchase Order
 * @param {number} id
 */
export function cancelPurchaseOrder(id) {
    const db = getDB();
    return db.prepare("UPDATE purchase_orders SET status = 'cancelled' WHERE id = ? AND status = 'pending'").run(id);
}
