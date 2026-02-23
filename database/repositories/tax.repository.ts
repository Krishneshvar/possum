import { getDB } from '../../electron/backend/shared/db/index.js';
import type { ITaxRepository, TaxProfile, TaxCategory, TaxRule } from '../../core/index.js';

export class TaxRepository implements ITaxRepository {

    getActiveTaxProfile() {
    const db = getDB();
        return db.prepare('SELECT * FROM tax_profiles WHERE is_active = 1').get() as TaxProfile | undefined;
    }

    getAllTaxProfiles() {
    const db = getDB();
        return db.prepare('SELECT * FROM tax_profiles ORDER BY created_at DESC').all() as TaxProfile[];
    }

    createTaxProfile(profile: TaxProfile) {
    const db = getDB();
    const { name, country_code, region_code, pricing_mode, is_active } = profile;
        return db.prepare(`
            INSERT INTO tax_profiles (name, country_code, region_code, pricing_mode, is_active)
            VALUES (?, ?, ?, ?, ?)
        `).run(name, country_code, region_code, pricing_mode, is_active ? 1 : 0);
    }

    updateTaxProfile(id: number, profile: Partial<TaxProfile>) {
    const db = getDB();
    const { name, country_code, region_code, pricing_mode, is_active } = profile;

    // Build query dynamically
    const updates: string[] = [];
    const params: any[] = [];

    if (name !== undefined) { updates.push('name = ?'); params.push(name); }
    if (country_code !== undefined) { updates.push('country_code = ?'); params.push(country_code); }
    if (region_code !== undefined) { updates.push('region_code = ?'); params.push(region_code); }
    if (pricing_mode !== undefined) { updates.push('pricing_mode = ?'); params.push(pricing_mode); }
    if (is_active !== undefined) { updates.push('is_active = ?'); params.push(is_active ? 1 : 0); }

    if (updates.length === 0) return { changes: 0 };

        params.push(id);
        return db.prepare(`UPDATE tax_profiles SET ${updates.join(', ')} WHERE id = ?`).run(...params);
    }

    deleteTaxProfile(id: number) {
    const db = getDB();
        return db.prepare('DELETE FROM tax_profiles WHERE id = ?').run(id);
    }

    getAllTaxCategories() {
    const db = getDB();
    // Count products using each category
        return db.prepare(`
            SELECT tc.*, COUNT(p.id) as product_count
            FROM tax_categories tc
            LEFT JOIN products p ON p.tax_category_id = tc.id
            GROUP BY tc.id
        `).all() as TaxCategory[];
    }

    createTaxCategory({ name, description }: { name: string; description: string }) {
    const db = getDB();
        return db.prepare('INSERT INTO tax_categories (name, description) VALUES (?, ?)').run(name, description);
    }

    updateTaxCategory(id: number, { name, description }: { name: string; description: string }) {
    const db = getDB();
        return db.prepare('UPDATE tax_categories SET name = ?, description = ? WHERE id = ?').run(name, description, id);
    }

    deleteTaxCategory(id: number) {
    const db = getDB();
    // Check if used
    const usage = db.prepare('SELECT COUNT(*) as count FROM products WHERE tax_category_id = ?').get(id) as { count: number };
    if (usage.count > 0) {
        throw new Error('Cannot delete category used by products');
    }
        return db.prepare('DELETE FROM tax_categories WHERE id = ?').run(id);
    }

    getTaxRulesByProfileId(profileId: number) {
    const db = getDB();
        return db.prepare(`
            SELECT tr.*, tc.name as category_name
            FROM tax_rules tr
            LEFT JOIN tax_categories tc ON tr.tax_category_id = tc.id
            WHERE tr.tax_profile_id = ?
            ORDER BY tr.priority ASC
        `).all(profileId) as TaxRule[];
    }

    createTaxRule(rule: TaxRule) {
    const db = getDB();
    const columns: (keyof TaxRule)[] = [
        'tax_profile_id', 'tax_category_id', 'rule_scope',
        'min_price', 'max_price', 'min_invoice_total', 'max_invoice_total',
        'customer_type', 'rate_percent', 'is_compound', 'priority',
        'valid_from', 'valid_to'
    ];
    const placeholders = columns.map(() => '?').join(', ');
    const values = columns.map(col => rule[col] === undefined ? null : rule[col]);

        return db.prepare(`INSERT INTO tax_rules (${columns.join(', ')}) VALUES (${placeholders})`).run(...values);
    }

    updateTaxRule(id: number, rule: Partial<TaxRule>) {
    const db = getDB();
    const columns: (keyof TaxRule)[] = [
        'tax_profile_id', 'tax_category_id', 'rule_scope',
        'min_price', 'max_price', 'min_invoice_total', 'max_invoice_total',
        'customer_type', 'rate_percent', 'is_compound', 'priority',
        'valid_from', 'valid_to'
    ];

    const updates: string[] = [];
    const values: any[] = [];

    columns.forEach(col => {
        if (rule[col] !== undefined) {
            updates.push(`${col} = ?`);
            values.push(rule[col]);
        }
    });

    if (updates.length === 0) return { changes: 0 };

        values.push(id);
        return db.prepare(`UPDATE tax_rules SET ${updates.join(', ')} WHERE id = ?`).run(...values);
    }

    deleteTaxRule(id: number) {
        const db = getDB();
        return db.prepare('DELETE FROM tax_rules WHERE id = ?').run(id);
    }
}
