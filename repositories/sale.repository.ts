import { getDB } from '../electron/backend/shared/db/index.js';
import { Sale, SaleItem, Transaction } from '../models/index.js';
import type { ISaleRepository, SaleFilter, PaginatedSales } from '../core/index.js';

export class SaleRepository implements ISaleRepository {

    insertSale(saleData: Partial<Sale>): { lastInsertRowid: number | bigint } {
        const {
            invoice_number,
            total_amount,
            paid_amount,
            discount,
            total_tax,
            status,
            fulfillment_status,
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
            fulfillment_status || 'pending',
            customer_id || null,
            user_id
        );
    }

    insertSaleItem(itemData: Partial<SaleItem>): { lastInsertRowid: number | bigint } {
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

    findSaleById(id: number): Sale | null {
        const db = getDB();

        const sale = db.prepare(`
        SELECT 
            s.*,
            c.name as customer_name,
            c.phone as customer_phone,
            c.email as customer_email,
            u.name as biller_name
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

    findSales({
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

        if (fulfillmentStatus && fulfillmentStatus.length > 0) {
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
        // customer_name is a joined field (c.name), handled separately
        const allowedSortFields: Record<string, string> = {
            'sale_date': 's.sale_date',
            'total_amount': 's.total_amount',
            'invoice_number': 's.invoice_number',
            'paid_amount': 's.paid_amount',
            'status': 's.status',
            'fulfillment_status': 's.fulfillment_status',
            'customer_name': 'c.name',
        };
        const finalSortExpr = allowedSortFields[sortBy] ?? 's.sale_date';
        const finalSortOrder = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

        const offset = (currentPage - 1) * itemsPerPage;
        const query = `
        SELECT 
            s.*,
            c.name as customer_name,
            c.phone as customer_phone,
            u.name as biller_name
        FROM sales s
        LEFT JOIN customers c ON s.customer_id = c.id
        LEFT JOIN users u ON s.user_id = u.id
        ${whereClause}
        ORDER BY ${finalSortExpr} ${finalSortOrder}
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

    updateSaleStatus(id: number, status: string): { changes: number } {
        const db = getDB();
        return db.prepare('UPDATE sales SET status = ? WHERE id = ?').run(status, id);
    }

    updateFulfillmentStatus(id: number, status: string): { changes: number } {
        const db = getDB();
        return db.prepare('UPDATE sales SET fulfillment_status = ? WHERE id = ?').run(status, id);
    }

    updateSalePaidAmount(id: number, paidAmount: number): { changes: number } {
        const db = getDB();
        return db.prepare('UPDATE sales SET paid_amount = ? WHERE id = ?').run(paidAmount, id);
    }

    insertTransaction(transactionData: Partial<Transaction>): { lastInsertRowid: number | bigint } {
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

    getLastSale(): { invoice_number: string } | undefined {
        const db = getDB();
        return db.prepare(`
        SELECT invoice_number 
        FROM sales 
        ORDER BY id DESC 
        LIMIT 1
        `).get() as { invoice_number: string } | undefined;
    }

    findPaymentMethods(): Array<{ id: number; name: string; is_active: number }> {
        const db = getDB();
        return db.prepare('SELECT * FROM payment_methods WHERE is_active = 1').all() as Array<{ id: number; name: string; is_active: number }>;
    }

    paymentMethodExists(id: number): boolean {
        const db = getDB();
        const result = db.prepare('SELECT id FROM payment_methods WHERE id = ? AND is_active = 1').get(id);
        return !!result;
    }

    findSaleItems(saleId: number): SaleItem[] {
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

    saleExists(id: number): boolean {
        const db = getDB();
        const result = db.prepare('SELECT id FROM sales WHERE id = ?').get(id);
        return !!result;
    }
}
