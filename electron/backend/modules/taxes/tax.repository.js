import { getDB } from '../../shared/db/index.js';

/**
 * Get the currently active tax profile
 * @returns {Object|null} Active tax profile or null
 */
export function getActiveTaxProfile() {
    const db = getDB();
    return db.prepare('SELECT * FROM tax_profiles WHERE is_active = 1').get();
}

/**
 * Get all tax profiles
 * @returns {Array} List of tax profiles
 */
export function getAllTaxProfiles() {
    const db = getDB();
    return db.prepare('SELECT * FROM tax_profiles ORDER BY created_at DESC').all();
}

/**
 * Create a new tax profile
 * @param {Object} profile
 * @returns {Object} Result
 */
export function createTaxProfile(profile) {
    const db = getDB();
    const { name, country_code, region_code, pricing_mode, is_active } = profile;
    return db.prepare(`
        INSERT INTO tax_profiles (name, country_code, region_code, pricing_mode, is_active)
        VALUES (?, ?, ?, ?, ?)
    `).run(name, country_code, region_code, pricing_mode, is_active ? 1 : 0);
}

/**
 * Update a tax profile
 * @param {number} id
 * @param {Object} profile
 * @returns {Object} Result
 */
export function updateTaxProfile(id, profile) {
    const db = getDB();
    const { name, country_code, region_code, pricing_mode, is_active } = profile;

    // Build query dynamically
    const updates = [];
    const params = [];

    if (name !== undefined) { updates.push('name = ?'); params.push(name); }
    if (country_code !== undefined) { updates.push('country_code = ?'); params.push(country_code); }
    if (region_code !== undefined) { updates.push('region_code = ?'); params.push(region_code); }
    if (pricing_mode !== undefined) { updates.push('pricing_mode = ?'); params.push(pricing_mode); }
    if (is_active !== undefined) { updates.push('is_active = ?'); params.push(is_active ? 1 : 0); }

    if (updates.length === 0) return { changes: 0 };

    params.push(id);
    return db.prepare(`UPDATE tax_profiles SET ${updates.join(', ')} WHERE id = ?`).run(...params);
}

/**
 * Delete a tax profile
 * @param {number} id
 * @returns {Object} Result
 */
export function deleteTaxProfile(id) {
    const db = getDB();
    return db.prepare('DELETE FROM tax_profiles WHERE id = ?').run(id);
}

/**
 * Get all tax categories
 * @returns {Array}
 */
export function getAllTaxCategories() {
    const db = getDB();
    // Count products using each category
    return db.prepare(`
        SELECT tc.*, COUNT(p.id) as product_count
        FROM tax_categories tc
        LEFT JOIN products p ON p.tax_category_id = tc.id
        GROUP BY tc.id
    `).all();
}

/**
 * Create tax category
 * @param {Object} category
 * @returns {Object}
 */
export function createTaxCategory({ name, description }) {
    const db = getDB();
    return db.prepare('INSERT INTO tax_categories (name, description) VALUES (?, ?)').run(name, description);
}

/**
 * Update tax category
 * @param {number} id
 * @param {Object} category
 * @returns {Object}
 */
export function updateTaxCategory(id, { name, description }) {
    const db = getDB();
    return db.prepare('UPDATE tax_categories SET name = ?, description = ? WHERE id = ?').run(name, description, id);
}

/**
 * Delete tax category
 * @param {number} id
 * @returns {Object}
 */
export function deleteTaxCategory(id) {
    const db = getDB();
    // Check if used
    const usage = db.prepare('SELECT COUNT(*) as count FROM products WHERE tax_category_id = ?').get(id);
    if (usage.count > 0) {
        throw new Error('Cannot delete category used by products');
    }
    return db.prepare('DELETE FROM tax_categories WHERE id = ?').run(id);
}

/**
 * Get rules for a profile
 * @param {number} profileId
 * @returns {Array}
 */
export function getTaxRulesByProfileId(profileId) {
    const db = getDB();
    return db.prepare(`
        SELECT tr.*, tc.name as category_name
        FROM tax_rules tr
        LEFT JOIN tax_categories tc ON tr.tax_category_id = tc.id
        WHERE tr.tax_profile_id = ?
        ORDER BY tr.priority ASC
    `).all(profileId);
}

/**
 * Create tax rule
 * @param {Object} rule
 * @returns {Object}
 */
export function createTaxRule(rule) {
    const db = getDB();
    const columns = [
        'tax_profile_id', 'tax_category_id', 'rule_scope',
        'min_price', 'max_price', 'min_invoice_total', 'max_invoice_total',
        'customer_type', 'rate_percent', 'is_compound', 'priority',
        'valid_from', 'valid_to'
    ];
    const placeholders = columns.map(() => '?').join(', ');
    const values = columns.map(col => rule[col] === undefined ? null : rule[col]);

    return db.prepare(`INSERT INTO tax_rules (${columns.join(', ')}) VALUES (${placeholders})`).run(...values);
}

/**
 * Update tax rule
 * @param {number} id
 * @param {Object} rule
 * @returns {Object}
 */
export function updateTaxRule(id, rule) {
    const db = getDB();
    const columns = [
        'tax_profile_id', 'tax_category_id', 'rule_scope',
        'min_price', 'max_price', 'min_invoice_total', 'max_invoice_total',
        'customer_type', 'rate_percent', 'is_compound', 'priority',
        'valid_from', 'valid_to'
    ];

    const updates = [];
    const values = [];

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

/**
 * Delete tax rule
 * @param {number} id
 * @returns {Object}
 */
export function deleteTaxRule(id) {
    const db = getDB();
    return db.prepare('DELETE FROM tax_rules WHERE id = ?').run(id);
}
