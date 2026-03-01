import { BaseEntity } from '../models/index.js';
import type { IInventoryRepository } from '../core/index.js';
/**
 * Inventory Repository
 * Handles all database operations for inventory management
 */
import { getDB } from '../electron/backend/shared/db/index.js';

export interface InventoryLot extends BaseEntity {
    variant_id: number;
    batch_number?: string | null;
    manufactured_date?: string | null;
    expiry_date?: string | null;
    quantity: number;
    unit_cost?: number;
    purchase_order_item_id?: number | null;
}

export interface InventoryAdjustment extends BaseEntity {
    variant_id: number;
    lot_id?: number | null;
    quantity_change: number;
    reason: string;
    reference_type?: string | null;
    reference_id?: number | null;
    adjusted_by: number;
    adjusted_at: string;
}

/**
 * Reusable stock calculation SQL fragment
 * Stock = SUM(inventory_lots.quantity) + SUM(inventory_adjustments.quantity_change)
 * Excludes 'confirm_receive' adjustments that are already counted in lots
 */
const STOCK_CALCULATION_SQL = `
    COALESCE((SELECT SUM(quantity) FROM inventory_lots WHERE variant_id = v.id), 0)
    + COALESCE((SELECT SUM(quantity_change) FROM inventory_adjustments WHERE variant_id = v.id AND (reason != 'confirm_receive' OR lot_id IS NULL)), 0)
`;

export class InventoryRepository implements IInventoryRepository {
    /**
     * Get computed stock for a variant
     * Stock = SUM(inventory_lots.quantity) + SUM(inventory_adjustments.quantity_change)
     * @param {number} variantId - Variant ID
     * @returns {number} Computed stock
     */
    getStockByVariantId(variantId: number): number {
        const db = getDB();
        const result = db.prepare(`
        SELECT 
            COALESCE(
                (SELECT SUM(quantity) FROM inventory_lots WHERE variant_id = ?),
                0
            ) + COALESCE(
                (SELECT SUM(quantity_change) FROM inventory_adjustments WHERE variant_id = ? AND (reason != 'confirm_receive' OR lot_id IS NULL)),
                0
            ) AS stock
    `).get(variantId, variantId) as { stock: number } | undefined;

        return result?.stock ?? 0;
    }

    /**
     * Get all inventory lots for a variant
     * @param {number} variantId - Variant ID
     * @returns {Array} Inventory lots with details
     */
    findLotsByVariantId(variantId: number): any[] {
        const db = getDB();
        return db.prepare(`
        SELECT 
            il.*,
            poi.purchase_order_id,
            po.order_date
        FROM inventory_lots il
        LEFT JOIN purchase_order_items poi ON il.purchase_order_item_id = poi.id
        LEFT JOIN purchase_orders po ON poi.purchase_order_id = po.id
        WHERE il.variant_id = ?
        ORDER BY il.created_at DESC
    `).all(variantId);
    }

    /**
     * Find available lots for a variant with remaining stock, ordered by FIFO
     * @param {number} variantId - Variant ID
     * @returns {Array} Available lots with remaining_quantity
     */
    findAvailableLots(variantId: number): any[] {
        const db = getDB();
        return db.prepare(`
        SELECT 
            il.*,
            (il.quantity + COALESCE((
                SELECT SUM(quantity_change) 
                FROM inventory_adjustments 
                WHERE lot_id = il.id
            ), 0)) as remaining_quantity
        FROM inventory_lots il
        WHERE il.variant_id = ?
        GROUP BY il.id
        HAVING remaining_quantity > 0
        ORDER BY il.created_at ASC
    `).all(variantId);
    }

    /**
     * Get inventory adjustments for a variant
     * @param {number} variantId - Variant ID
     * @param {Object} options - Query options
     * @returns {Array} Inventory adjustments
     */
    findAdjustmentsByVariantId(variantId: number, { limit = 50, offset = 0 } = {}): any[] {
        const db = getDB();
        return db.prepare(`
        SELECT 
            ia.*,
            u.name as adjusted_by_name,
            il.batch_number as lot_batch_number
        FROM inventory_adjustments ia
        LEFT JOIN users u ON ia.adjusted_by = u.id
        LEFT JOIN inventory_lots il ON ia.lot_id = il.id
        WHERE ia.variant_id = ?
        ORDER BY ia.adjusted_at DESC
        LIMIT ? OFFSET ?
    `).all(variantId, limit, offset);
    }

    /**
     * Get all inventory adjustments across all variants, paginated and filterable
     */
    findAllAdjustments({
        limit = 50,
        offset = 0,
        search = '',
        reason = '',
        variantId = null,
        sortBy = 'adjusted_at',
        sortOrder = 'DESC',
    }: {
        limit?: number;
        offset?: number;
        search?: string;
        reason?: string;
        variantId?: number | null;
        sortBy?: string;
        sortOrder?: string;
    } = {}): { adjustments: any[]; total: number } {
        const db = getDB();

        const conditions: string[] = [];
        const params: any[] = [];

        if (search) {
            conditions.push(`(p.name LIKE ? OR v.name LIKE ? OR v.sku LIKE ? OR u.name LIKE ?)`);
            const like = `%${search}%`;
            params.push(like, like, like, like);
        }
        if (reason) {
            conditions.push(`ia.reason = ?`);
            params.push(reason);
        }
        if (variantId) {
            conditions.push(`ia.variant_id = ?`);
            params.push(variantId);
        }

        const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

        const total = (db.prepare(`
        SELECT COUNT(*) as count
        FROM inventory_adjustments ia
        LEFT JOIN variants v ON ia.variant_id = v.id
        LEFT JOIN products p ON v.product_id = p.id
        LEFT JOIN users u ON ia.adjusted_by = u.id
        ${where}
    `).get(...params) as any)?.count ?? 0;

        const validSortFields: Record<string, string> = {
            'adjusted_at': 'ia.adjusted_at',
            'product_name': 'p.name',
            'variant_name': 'v.name',
            'quantity_change': 'ia.quantity_change',
            'adjusted_by_name': 'u.name'
        };
        const orderColumn = validSortFields[sortBy] || 'ia.adjusted_at';
        const orderDirection = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

        const adjustments = db.prepare(`
        SELECT
            ia.id,
            ia.variant_id,
            ia.quantity_change,
            ia.reason,
            ia.reference_type,
            ia.reference_id,
            ia.adjusted_at,
            ia.adjusted_by,
            u.name as adjusted_by_name,
            v.name as variant_name,
            v.sku,
            p.id as product_id,
            p.name as product_name
        FROM inventory_adjustments ia
        LEFT JOIN variants v ON ia.variant_id = v.id
        LEFT JOIN products p ON v.product_id = p.id
        LEFT JOIN users u ON ia.adjusted_by = u.id
        ${where}
        ORDER BY ${orderColumn} ${orderDirection}
        LIMIT ? OFFSET ?
    `).all(...params, limit, offset);

        return { adjustments, total };
    }


    /**
     * Find adjustments by reference type and ID
     * @param {string} type - Reference type
     * @param {number} id - Reference ID
     * @returns {Array} Adjustments
     */
    findAdjustmentsByReference(type: string, id: number): any[] {
        const db = getDB();
        return db.prepare('SELECT * FROM inventory_adjustments WHERE reference_type = ? AND reference_id = ?').all(type, id);
    }

    /**
     * Insert a new inventory lot
     * @param {Object} lotData - Lot data
     * @returns {Object} Insert result
     */
    insertInventoryLot({
        variant_id,
        batch_number,
        manufactured_date,
        expiry_date,
        quantity,
        unit_cost,
        purchase_order_item_id
    }: Partial<InventoryLot>): { lastInsertRowid: number | bigint } {
        const db = getDB();
        const stmt = db.prepare(`
        INSERT INTO inventory_lots (
            variant_id, batch_number, manufactured_date, expiry_date, 
            quantity, unit_cost, purchase_order_item_id
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
        return stmt.run(
            variant_id,
            batch_number || null,
            manufactured_date || null,
            expiry_date || null,
            quantity,
            unit_cost,
            purchase_order_item_id || null
        );
    }

    /**
     * Insert an inventory adjustment
     * @param {Object} adjustmentData - Adjustment data
     * @returns {Object} Insert result
     */
    insertInventoryAdjustment({
        variant_id,
        lot_id,
        quantity_change,
        reason,
        reference_type,
        reference_id,
        adjusted_by
    }: Partial<InventoryAdjustment>): { lastInsertRowid: number | bigint } {
        const db = getDB();
        const stmt = db.prepare(`
        INSERT INTO inventory_adjustments (
            variant_id, lot_id, quantity_change, reason,
            reference_type, reference_id, adjusted_by
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
        return stmt.run(
            variant_id,
            lot_id || null,
            quantity_change,
            reason,
            reference_type || null,
            reference_id || null,
            adjusted_by
        );
    }

    /**
     * Find a lot by ID
     * @param {number} id - Lot ID
     * @returns {Object|null} Lot or null
     */
    findLotById(id: number): InventoryLot | undefined {
        const db = getDB();
        return db.prepare('SELECT * FROM inventory_lots WHERE id = ?').get(id) as InventoryLot | undefined;
    }

    /**
     * Get all variants with low stock (stock <= stock_alert_cap)
     * @returns {Array} Variants with low stock
     */
    findLowStockVariants(): any[] {
        const db = getDB();
        return db.prepare(`
        WITH VariantStock AS (
            SELECT 
                v.id,
                v.name as variant_name,
                v.sku,
                v.stock_alert_cap,
                p.id as product_id,
                p.name as product_name,
                p.image_path,
                (${STOCK_CALCULATION_SQL}) AS current_stock
            FROM variants v
            JOIN products p ON v.product_id = p.id
            WHERE v.deleted_at IS NULL AND p.deleted_at IS NULL
        )
        SELECT * FROM VariantStock
        WHERE current_stock <= stock_alert_cap
        ORDER BY current_stock ASC
    `).all();
    }

    /**
     * Get expiring lots (within specified days)
     * @param {number} days - Number of days to look ahead
     * @returns {Array} Expiring lots
     */
    findExpiringLots(days: number = 30): any[] {
        const db = getDB();
        return db.prepare(`
        SELECT 
            il.*,
            v.name as variant_name,
            v.sku,
            p.name as product_name
        FROM inventory_lots il
        JOIN variants v ON il.variant_id = v.id
        JOIN products p ON v.product_id = p.id
        WHERE il.expiry_date IS NOT NULL 
          AND il.expiry_date <= date('now', '+' || ? || ' days')
          AND il.expiry_date >= date('now')
          AND v.deleted_at IS NULL
        ORDER BY il.expiry_date ASC
    `).all(days);
    }

    /**
     * Get aggregate inventory stats
     * @returns {Object} Inventory stats
     */
    getInventoryStats(): any {
        const db = getDB();
        return db.prepare(`
        WITH VariantStock AS (
            SELECT 
                v.id,
                v.stock_alert_cap,
                (${STOCK_CALCULATION_SQL}) AS current_stock
            FROM variants v
            JOIN products p ON v.product_id = p.id
            WHERE v.deleted_at IS NULL AND p.deleted_at IS NULL
        )
        SELECT
            COALESCE(SUM(current_stock), 0) as totalItemsInStock,
            COUNT(CASE WHEN current_stock = 0 THEN 1 END) as productsWithNoStock,
            COUNT(CASE WHEN current_stock <= stock_alert_cap THEN 1 END) as productsWithLowStock
        FROM VariantStock
    `).get();
    }
}
