import { getDB } from '../electron/backend/shared/db/index.js';
import type { IReturnRepository, ReturnFilters } from '../core/index.js';

export interface ReturnListItem {
    id: number;
    sale_id: number;
    user_id: number;
    reason: string | null;
    created_at: string;
    invoice_number: string;
    processed_by_name: string;
    total_refund: number;
    items: ReturnItemDetails[];
}

export interface ReturnItemDetails {
    id: number;
    return_id: number;
    sale_item_id: number;
    quantity: number;
    refund_amount: number;
    variant_id: number;
    price_per_unit: number;
    tax_rate: number | null;
    variant_name: string;
    sku: string | null;
    product_name: string;
}

export interface ReturnDetails extends Omit<ReturnListItem, 'items'> {
    items: ReturnItemDetails[];
}

interface PaginatedReturns {
    returns: ReturnListItem[];
    totalCount: number;
    totalPages: number;
    currentPage: number;
}

export class ReturnRepository implements IReturnRepository {

    insertReturn({ sale_id, user_id, reason }: { sale_id: number; user_id: number; reason?: string }) {
        const db = getDB();
        const stmt = db.prepare(`
        INSERT INTO returns (sale_id, user_id, reason)
        VALUES (?, ?, ?)
    `);
        return stmt.run(sale_id, user_id, reason || null);
    }

    insertReturnItem({ return_id, sale_item_id, quantity, refund_amount }: { return_id: number; sale_item_id: number; quantity: number; refund_amount: number }) {
        const db = getDB();
        const stmt = db.prepare(`
        INSERT INTO return_items (return_id, sale_item_id, quantity, refund_amount)
        VALUES (?, ?, ?, ?)
    `);
        return stmt.run(return_id, sale_item_id, quantity, refund_amount);
    }

    findReturnById(id: number): ReturnDetails | null {
        const db = getDB();

        const returnRecord = db.prepare(`
        SELECT 
            r.*,
            s.invoice_number,
            u.name as processed_by_name,
            COALESCE((SELECT SUM(refund_amount) FROM return_items WHERE return_id = r.id), 0) as total_refund
        FROM returns r
        JOIN sales s ON r.sale_id = s.id
        JOIN users u ON r.user_id = u.id
        WHERE r.id = ?
    `).get(id) as Omit<ReturnDetails, 'items'> | undefined;

        if (!returnRecord) return null;

        const items = db.prepare(`
        SELECT 
            ri.*,
            si.variant_id,
            si.price_per_unit,
            si.tax_rate,
            v.name as variant_name,
            v.sku,
            p.name as product_name
        FROM return_items ri
        JOIN sale_items si ON ri.sale_item_id = si.id
        JOIN variants v ON si.variant_id = v.id
        JOIN products p ON v.product_id = p.id
        WHERE ri.return_id = ?
    `).all(id) as ReturnItemDetails[];

        return {
            ...returnRecord,
            items
        };
    }

    findReturnsBySaleId(saleId: number): ReturnListItem[] {
        const db = getDB();
        const returns = db.prepare(`
        SELECT 
            r.*,
            u.name as processed_by_name,
            s.invoice_number,
            COALESCE((SELECT SUM(refund_amount) FROM return_items WHERE return_id = r.id), 0) as total_refund
        FROM returns r
        JOIN sales s ON r.sale_id = s.id
        JOIN users u ON r.user_id = u.id
        WHERE r.sale_id = ?
        ORDER BY r.created_at DESC
    `).all(saleId) as Array<Omit<ReturnListItem, 'items'>>;

        return hydrateReturnItems(db, returns);
    }

    findReturns({
        saleId,
        userId,
        startDate,
        endDate,
        searchTerm,
        currentPage = 1,
        itemsPerPage = 20,
        sortBy = 'created_at',
        sortOrder = 'DESC'
    }: ReturnFilters): PaginatedReturns {
        const db = getDB();
        const filterClauses: string[] = [];
        const filterParams: Array<string | number> = [];

        if (typeof saleId === 'number') {
            filterClauses.push('r.sale_id = ?');
            filterParams.push(saleId);
        }

        if (typeof userId === 'number') {
            filterClauses.push('r.user_id = ?');
            filterParams.push(userId);
        }

        if (startDate) {
            const dateOnly = startDate.substring(0, 10);
            filterClauses.push('r.created_at >= ?');
            filterParams.push(`${dateOnly} 00:00:00`);
        }

        if (endDate) {
            const dateOnly = endDate.substring(0, 10);
            filterClauses.push('r.created_at <= ?');
            filterParams.push(`${dateOnly} 23:59:59`);
        }

        if (searchTerm) {
            filterClauses.push('(CAST(r.id AS TEXT) LIKE ? OR s.invoice_number LIKE ? OR COALESCE(r.reason, \'\') LIKE ?)');
            const wildcard = `%${searchTerm}%`;
            filterParams.push(wildcard, wildcard, wildcard);
        }

        const whereClause = filterClauses.length > 0
            ? `WHERE ${filterClauses.join(' AND ')}`
            : '';

        const countResult = db.prepare(`
        SELECT COUNT(*) as total_count
        FROM returns r
        JOIN sales s ON r.sale_id = s.id
        ${whereClause}
    `).get(...filterParams) as { total_count: number };

        const totalCount = countResult?.total_count ?? 0;

        const validSortOrder = sortOrder === 'ASC' ? 'ASC' : 'DESC';
        let orderByClause = `ORDER BY r.created_at ${validSortOrder}`;

        if (sortBy === 'total_refund') {
            orderByClause = `ORDER BY total_refund ${validSortOrder}`;
        }

        const offset = (currentPage - 1) * itemsPerPage;
        const returns = db.prepare(`
            SELECT
                r.*,
                s.invoice_number,
                u.name as processed_by_name,
                COALESCE((SELECT SUM(refund_amount) FROM return_items WHERE return_id = r.id), 0) as total_refund
            FROM returns r
            JOIN sales s ON r.sale_id = s.id
            JOIN users u ON r.user_id = u.id
            ${whereClause}
            ${orderByClause}
            LIMIT ? OFFSET ?
        `).all(...filterParams, itemsPerPage, offset) as Array<Omit<ReturnListItem, 'items'>>;

        const hydratedReturns = hydrateReturnItems(db, returns);

        return {
            returns: hydratedReturns,
            totalCount,
            totalPages: Math.ceil(totalCount / Math.max(itemsPerPage, 1)),
            currentPage
        };
    }

    getTotalReturnedQuantity(saleItemId: number) {
        const db = getDB();
        const result = db.prepare(`
            SELECT COALESCE(SUM(quantity), 0) as total_returned
            FROM return_items
            WHERE sale_item_id = ?
        `).get(saleItemId) as { total_returned: number };
        return result?.total_returned ?? 0;
    }
}

function hydrateReturnItems(db: ReturnType<typeof getDB>, returnRows: Array<Omit<ReturnListItem, 'items'>>): ReturnListItem[] {
    if (returnRows.length === 0) {
        return [];
    }

    const ids = returnRows.map((ret) => ret.id);
    const placeholders = ids.map(() => '?').join(', ');
    const allItems = db.prepare(`
        SELECT
        ri.*,
            si.variant_id,
            si.price_per_unit,
            si.tax_rate,
            v.name as variant_name,
            v.sku,
            p.name as product_name
        FROM return_items ri
        JOIN sale_items si ON ri.sale_item_id = si.id
        JOIN variants v ON si.variant_id = v.id
        JOIN products p ON v.product_id = p.id
        WHERE ri.return_id IN (${placeholders})
        ORDER BY ri.id ASC
    `).all(...ids) as ReturnItemDetails[];

    const itemsByReturnId = new Map<number, ReturnItemDetails[]>();
    for (const item of allItems) {
        const bucket = itemsByReturnId.get(item.return_id);
        if (bucket) {
            bucket.push(item);
        } else {
            itemsByReturnId.set(item.return_id, [item]);
        }
    }

    return returnRows.map((ret) => ({
        ...ret,
        items: itemsByReturnId.get(ret.id) ?? []
    }));
}
