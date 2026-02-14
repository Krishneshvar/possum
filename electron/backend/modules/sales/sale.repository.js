/**
 * Sale Repository
 * Handles all database operations for sales
 */
import { getDB } from '../../shared/db/index.js';

/**
 * Insert a new sale
 * @param {Object} saleData - Sale data
 * @returns {Object} Insert result
 */
export function insertSale({
    invoice_number,
    total_amount,
    paid_amount,
    discount,
    total_tax,
    status,
    customer_id,
    user_id
}) {
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
        fulfillment_status || 'pending',
        customer_id || null,
        user_id
    );
}

/**
 * Insert a sale item with frozen pricing
 * @param {Object} itemData - Sale item data
 * @returns {Object} Insert result
 */
export function insertSaleItem({
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
}) {
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
 * @param {number} id - Sale ID
 * @returns {Object|null} Sale with items or null
 */
export function findSaleById(id) {
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
    `).get(id);

    if (!sale) return null;

    const items = db.prepare(`
        SELECT 
            si.*,
            v.name as variant_name,
            v.sku,
            p.name as product_name,
            p.image_path
        FROM sale_items si
        JOIN variants v ON si.variant_id = v.id
        JOIN products p ON v.product_id = p.id
        WHERE si.sale_id = ?
    `).all(id);

    const transactions = db.prepare(`
        SELECT 
            t.*,
            pm.name as payment_method_name
        FROM transactions t
        JOIN payment_methods pm ON t.payment_method_id = pm.id
        WHERE t.sale_id = ?
        ORDER BY t.transaction_date ASC
    `).all(id);

    return {
        ...sale,
        items,
        transactions
    };
}

/**
 * Find sales with filtering and pagination
 * @param {Object} params - Filter params
 * @returns {Object} Sales list with pagination
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
}) {
    const db = getDB();
    const filterClauses = [];
    const filterParams = [];

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
        filterClauses.push('date(s.sale_date) >= date(?)');
        filterParams.push(startDate);
    }

    if (endDate) {
        filterClauses.push('date(s.sale_date) <= date(?)');
        filterParams.push(endDate);
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
    `).get(...filterParams);

    const totalCount = countResult?.total_count ?? 0;

    // Validate sortBy to prevent SQL injection
    const allowedSortFields = ['sale_date', 'total_amount', 'invoice_number', 'paid_amount', 'status', 'fulfillment_status'];
    const finalSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'sale_date';
    const finalSortOrder = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const offset = (currentPage - 1) * itemsPerPage;
    const sales = db.prepare(`
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
    `).all(...filterParams, itemsPerPage, offset);

    return {
        sales,
        totalCount,
        totalPages: Math.ceil(totalCount / itemsPerPage),
        currentPage
    };
}

/**
 * Update sale status
 * @param {number} id - Sale ID
 * @param {string} status - New status
 * @returns {Object} Update result
 */
export function updateSaleStatus(id, status) {
    const db = getDB();
    return db.prepare('UPDATE sales SET status = ? WHERE id = ?').run(status, id);
}

/**
 * Update sale fulfillment status
 * @param {number} id - Sale ID
 * @param {string} status - New fulfillment status
 * @returns {Object} Update result
 */
export function updateFulfillmentStatus(id, status) {
    const db = getDB();
    return db.prepare('UPDATE sales SET fulfillment_status = ? WHERE id = ?').run(status, id);
}

/**
 * Update sale paid amount
 * @param {number} id - Sale ID
 * @param {number} paidAmount - New paid amount
 * @returns {Object} Update result
 */
export function updateSalePaidAmount(id, paidAmount) {
    const db = getDB();
    return db.prepare('UPDATE sales SET paid_amount = ? WHERE id = ?').run(paidAmount, id);
}

/**
 * Insert a transaction
 * @param {Object} transactionData - Transaction data
 * @returns {Object} Insert result
 */
export function insertTransaction({
    sale_id,
    amount,
    type,
    payment_method_id,
    status
}) {
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
 * @returns {string} Next invoice number
 */
export function generateInvoiceNumber() {
    const db = getDB();
    const result = db.prepare(`
        SELECT invoice_number 
        FROM sales 
        ORDER BY id DESC 
        LIMIT 1
    `).get();

    if (!result) {
        return 'INV-001';
    }

    const lastNum = parseInt(result.invoice_number.replace('INV-', ''), 10);
    const nextNum = lastNum + 1;
    return `INV-${String(nextNum).padStart(3, '0')}`;
}

/**
 * Get all payment methods
 * @returns {Array} Payment methods
 */
export function findPaymentMethods() {
    const db = getDB();
    return db.prepare('SELECT * FROM payment_methods WHERE is_active = 1').all();
}

/**
 * Get sale items for a sale
 * @param {number} saleId - Sale ID
 * @returns {Array} Sale items
 */
export function findSaleItems(saleId) {
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
    `).all(saleId);
}
