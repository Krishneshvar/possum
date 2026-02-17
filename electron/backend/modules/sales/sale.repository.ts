/**
 * Sale Repository
 * Handles all database operations for sales
 */
import { getDB } from '../../shared/db/index.js';
import { Sale, SaleItem, Transaction } from '../../../../types/index.js';

/**
 * Insert a new sale
 */
export function insertSale(saleData: Partial<Sale>): { lastInsertRowid: number | bigint } {
    const {
        invoice_number,
        total_amount,
        paid_amount,
        discount,
        total_tax,
        status,
        customer_id,
        user_id
    } = saleData;

    const db = getDB();
    const stmt = db.prepare(`
        INSERT INTO sales (
            invoice_number, total_amount, paid_amount, discount, total_tax,
            status, fulfillment_status, customer_id, user_id
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    return stmt.run(
        invoice_number,
        total_amount,
        paid_amount,
        discount,
        total_tax,
        status,
        'pending', // fulfillment_status default
        customer_id || null,
        user_id
    );
}

/**
 * Insert a sale item with frozen pricing
 */
export function insertSaleItem(itemData: Partial<SaleItem>): { lastInsertRowid: number | bigint } {
    const {
        sale_id,
        variant_id,
        quantity,
        price_per_unit,
        cost_per_unit,
        tax_rate,
        tax_amount,
        discount_amount,
        applied_tax_rate,
        applied_tax_amount,
        tax_rule_snapshot
    } = itemData;

    const db = getDB();
    const stmt = db.prepare(`
        INSERT INTO sale_items (
            sale_id, variant_id, quantity, price_per_unit, cost_per_unit,
            tax_rate, tax_amount, discount_amount,
            applied_tax_rate, applied_tax_amount, tax_rule_snapshot
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    return stmt.run(
        sale_id,
        variant_id,
        quantity,
        price_per_unit,
        cost_per_unit,
        tax_rate,
        tax_amount,
        discount_amount,
        applied_tax_rate,
        applied_tax_amount,
        tax_rule_snapshot
    );
}

/**
 * Find a sale by ID with items
 */
export function findSaleById(id: number): Sale | null {
    const db = getDB();

    const sale = db.prepare(`
        SELECT 
            s.*,
            c.name as customer_name,
            c.phone as customer_phone,
            u.name as cashier_name
        FROM sales s
        LEFT JOIN customers c ON s.customer_id = c.id
        LEFT JOIN users u ON s.user_id = u.id
        WHERE s.id = ?
    `).get(id) as Sale | undefined;

    if (!sale) return null;

    const items = db.prepare(`
        SELECT 
            si.*,
            v.name as variant_name,
            v.sku,
            p.name as product_name,
            p.image_path,
            (SELECT COALESCE(SUM(ri.quantity), 0) FROM return_items ri WHERE ri.sale_item_id = si.id) as returned_quantity
        FROM sale_items si
        JOIN variants v ON si.variant_id = v.id
        JOIN products p ON v.product_id = p.id
        WHERE si.sale_id = ?
    `).all(id) as SaleItem[];

    const transactions = db.prepare(`
        SELECT 
            t.*,
            pm.name as payment_method_name
        FROM transactions t
        JOIN payment_methods pm ON t.payment_method_id = pm.id
        WHERE t.sale_id = ?
        ORDER BY t.transaction_date ASC
    `).all(id) as Transaction[];

    return {
        ...sale,
        items,
        transactions
    };
}

export interface SaleFilter {
    status?: string[];
    customerId?: number;
    userId?: number;
    startDate?: string;
    endDate?: string;
    searchTerm?: string;
    currentPage?: number;
    itemsPerPage?: number;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
    fulfillmentStatus?: string | string[];
}

export interface PaginatedSales {
    sales: Sale[];
    totalCount: number;
    totalPages: number;
    currentPage: number;
}

/**
 * Find sales with filtering and pagination
 */
export function findSales({
    status,
    customerId,
    userId,
    startDate,
    endDate,
    searchTerm,
    currentPage = 1,
    itemsPerPage = 20,
    sortBy = 'sale_date',
    sortOrder = 'DESC',
    fulfillmentStatus
}: SaleFilter): PaginatedSales {
    const db = getDB();
    const filterClauses: string[] = [];
    const filterParams: any[] = [];

    if (status && status.length > 0) {
        const placeholders = status.map(() => '?').join(',');
        filterClauses.push(`s.status IN (${placeholders})`);
        filterParams.push(...status);
    }

    if (fulfillmentStatus) {
        const statuses = Array.isArray(fulfillmentStatus) ? fulfillmentStatus : [fulfillmentStatus];
        const placeholders = statuses.map(() => '?').join(',');
        filterClauses.push(`s.fulfillment_status IN (${placeholders})`);
        filterParams.push(...statuses);
    }

    if (customerId) {
        filterClauses.push('s.customer_id = ?');
        filterParams.push(customerId);
    }

    if (userId) {
        filterClauses.push('s.user_id = ?');
        filterParams.push(userId);
    }

    if (startDate) {
        // Optimize: Use direct string comparison to utilize index
        const dateOnly = startDate.substring(0, 10);
        filterClauses.push('s.sale_date >= ?');
        filterParams.push(`${dateOnly} 00:00:00`);
    }

    if (endDate) {
        // Optimize: Use direct string comparison to utilize index
        const dateOnly = endDate.substring(0, 10);
        filterClauses.push('s.sale_date <= ?');
        filterParams.push(`${dateOnly} 23:59:59`);
    }

    if (searchTerm) {
        filterClauses.push('(s.invoice_number LIKE ? OR c.name LIKE ?)');
        filterParams.push(`%${searchTerm}%`, `%${searchTerm}%`);
    }

    const whereClause = filterClauses.length > 0
        ? `WHERE ${filterClauses.join(' AND ')}`
        : '';

    const countResult = db.prepare(`
        SELECT COUNT(*) as total_count
        FROM sales s
        LEFT JOIN customers c ON s.customer_id = c.id
        ${whereClause}
    `).get(...filterParams) as { total_count: number } | undefined;

    const totalCount = countResult?.total_count ?? 0;

    // Validate sortBy to prevent SQL injection
    const allowedSortFields = ['sale_date', 'total_amount', 'invoice_number', 'paid_amount', 'status', 'fulfillment_status'];
    const finalSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'sale_date';
    const finalSortOrder = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const offset = (currentPage - 1) * itemsPerPage;
    const query = `
        SELECT 
            s.*,
            c.name as customer_name,
            u.name as cashier_name
        FROM sales s
        LEFT JOIN customers c ON s.customer_id = c.id
        LEFT JOIN users u ON s.user_id = u.id
        ${whereClause}
        ORDER BY s.${finalSortBy} ${finalSortOrder}
        LIMIT ? OFFSET ?
    `;

    // Need to spread filterParams then add itemsPerPage and offset
    const sales = db.prepare(query).all(...filterParams, itemsPerPage, offset) as Sale[];

    return {
        sales,
        totalCount,
        totalPages: Math.ceil(totalCount / itemsPerPage),
        currentPage
    };
}

/**
 * Update sale status
 */
export function updateSaleStatus(id: number, status: string): { changes: number } {
    const db = getDB();
    return db.prepare('UPDATE sales SET status = ? WHERE id = ?').run(status, id);
}

/**
 * Update sale fulfillment status
 */
export function updateFulfillmentStatus(id: number, status: string): { changes: number } {
    const db = getDB();
    return db.prepare('UPDATE sales SET fulfillment_status = ? WHERE id = ?').run(status, id);
}

/**
 * Update sale paid amount
 */
export function updateSalePaidAmount(id: number, paidAmount: number): { changes: number } {
    const db = getDB();
    return db.prepare('UPDATE sales SET paid_amount = ? WHERE id = ?').run(paidAmount, id);
}

/**
 * Insert a transaction
 */
export function insertTransaction(transactionData: Partial<Transaction>): { lastInsertRowid: number | bigint } {
    const {
        sale_id,
        amount,
        type,
        payment_method_id,
        status
    } = transactionData;

    const db = getDB();
    const stmt = db.prepare(`
        INSERT INTO transactions (
            sale_id, amount, type, payment_method_id, status
        )
        VALUES (?, ?, ?, ?, ?)
    `);
    return stmt.run(sale_id, amount, type, payment_method_id, status || 'completed');
}

/**
 * Generate next invoice number
 */
export function generateInvoiceNumber(): string {
    const db = getDB();
    const result = db.prepare(`
        SELECT invoice_number 
        FROM sales 
        ORDER BY id DESC 
        LIMIT 1
    `).get() as { invoice_number: string } | undefined;

    if (!result) {
        return 'INV-001';
    }

    const lastNum = parseInt(result.invoice_number.replace('INV-', ''), 10);
    const nextNum = lastNum + 1;
    return `INV-${String(nextNum).padStart(3, '0')}`;
}

/**
 * Get all payment methods
 */
export function findPaymentMethods(): any[] {
    const db = getDB();
    return db.prepare('SELECT * FROM payment_methods WHERE is_active = 1').all();
}

/**
 * Get sale items for a sale
 */
export function findSaleItems(saleId: number): SaleItem[] {
    const db = getDB();
    return db.prepare(`
        SELECT 
            si.*,
            v.name as variant_name,
            v.sku,
            p.name as product_name
        FROM sale_items si
        JOIN variants v ON si.variant_id = v.id
        JOIN products p ON v.product_id = p.id
        WHERE si.sale_id = ?
    `).all(saleId) as SaleItem[];
}
