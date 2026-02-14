import { getActiveTaxProfile, getTaxRulesByProfileId } from './tax.repository.js';

/**
 * Tax Calculation Engine
 * Responsible for calculating taxes based on configurable rules.
 */
class TaxEngine {
    constructor(profile = null, rules = null) {
        this.profile = profile;
        this.rules = rules;
    }

    /**
     * Initialize the engine by fetching the active profile and rules
     */
    init() {
        this.profile = getActiveTaxProfile();
        if (this.profile) {
            this.rules = getTaxRulesByProfileId(this.profile.id);
        } else {
            this.rules = [];
        }
    }

    /**
     * Calculate tax for an invoice
     * @param {Object} invoice - Invoice object with items. Items must have net price (after discount) if discount applies.
     * @param {Object} customer - Customer object (optional)
     * @returns {Object} Calculated tax details
     */
    calculate(invoice, customer = null) {
        if (!this.profile) {
            return {
                items: invoice.items.map(item => ({
                    ...item,
                    tax_amount: 0,
                    applied_tax_rate: 0,
                    applied_tax_amount: 0,
                    tax_rule_snapshot: JSON.stringify([])
                })),
                total_tax: 0,
                grand_total: invoice.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
            };
        }

        // 1. Exemption Logic
        // If customer has is_tax_exempt flag, skip tax calculation
        if (customer && customer.is_tax_exempt) {
             return {
                items: invoice.items.map(item => ({
                    ...item,
                    tax_amount: 0,
                    applied_tax_rate: 0,
                    applied_tax_amount: 0,
                    tax_rule_snapshot: JSON.stringify([])
                })),
                total_tax: 0,
                grand_total: invoice.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
            };
        }

        const invoiceTotal = invoice.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        let totalTax = 0;
        const updatedItems = [];

        for (const item of invoice.items) {
            const applicableRules = this.getApplicableRules(item, invoiceTotal, customer);

            // Calculate tax for this item
            const { taxAmount, taxRate, snapshot } = this.calculateItemTax(item, applicableRules);

            // If inclusive, the tax is already inside the price.
            // If exclusive, the tax is added on top.
            // The `price` in item is the NET unit price (after discounts) passed from service.

            let finalTaxAmount = taxAmount;

            // Per requirement: "Round tax per line (not globally)"
            finalTaxAmount = parseFloat(finalTaxAmount.toFixed(2));

            updatedItems.push({
                ...item,
                tax_amount: finalTaxAmount,
                applied_tax_rate: taxRate, // This might be a blended rate if multiple rules apply
                applied_tax_amount: finalTaxAmount,
                tax_rule_snapshot: JSON.stringify(snapshot)
            });

            totalTax += finalTaxAmount;
        }

        // Grand total calculation depends on pricing mode
        let grandTotal = 0;
        if (this.profile.pricing_mode === 'INCLUSIVE') {
            // For inclusive, the invoice total (sum of item prices) is the grand total.
            // Tax is just a component of it.
            grandTotal = invoiceTotal;
        } else {
            // For exclusive, tax is added on top
            grandTotal = invoiceTotal + totalTax;
        }

        return {
            items: updatedItems,
            total_tax: parseFloat(totalTax.toFixed(2)),
            grand_total: parseFloat(grandTotal.toFixed(2))
        };
    }

    getApplicableRules(item, invoiceTotal, customer) {
        if (!this.rules) return [];

        const now = new Date();
        const itemPrice = item.price; // Unit price

        return this.rules.filter(rule => {
            // 1. Category match
            if (rule.tax_category_id && rule.tax_category_id !== item.tax_category_id) {
                return false;
            }

            // 2. Rule Scope
            // If scope is INVOICE, it applies to all items (unless specific category set?)
            // Requirement says: "Filter by: category match OR null category"
            // So if rule has no category, it applies to all.

            // 3. Price Thresholds
            if (rule.min_price !== null && itemPrice < rule.min_price) return false;
            if (rule.max_price !== null && itemPrice > rule.max_price) return false;

            // 4. Invoice Total Thresholds
            if (rule.min_invoice_total !== null && invoiceTotal < rule.min_invoice_total) return false;
            if (rule.max_invoice_total !== null && invoiceTotal > rule.max_invoice_total) return false;

            // 5. Customer Type
            if (rule.customer_type && customer?.type !== rule.customer_type) return false;

            // 6. Date Validity
            if (rule.valid_from && new Date(rule.valid_from) > now) return false;
            if (rule.valid_to && new Date(rule.valid_to) < now) return false;

            return true;
        }).sort((a, b) => a.priority - b.priority);
    }

    calculateItemTax(item, rules) {
        let taxAmount = 0;
        let taxableAmount = item.price * item.quantity;
        let accumulatedTax = 0;
        const snapshot = [];

        // Separate compound and non-compound rules
        const simpleRules = rules.filter(r => !r.is_compound);
        const compoundRules = rules.filter(r => r.is_compound);

        // If inclusive, we need to back-calculate the base price first.
        // Formula for Inclusive: Price = Base * (1 + sum(simple_rates)) * (1 + sum(compound_rates))...
        // This can get complicated with mixed simple and compound.

        // Assumption for Inclusive:
        // We calculate the tax portion from the total price.
        // Simple rules apply to the base.
        // Compound rules apply to (base + simple_taxes).

        // Let B be base amount.
        // T1 = B * r1
        // T2 = B * r2
        // Tc = (B + T1 + T2) * rc
        // Total = B + T1 + T2 + Tc
        // Total = B * (1 + r1 + r2) * (1 + rc)

        // So B = Total / ((1 + sum(simple_rates)) * (1 + sum(compound_rates)))
        // Wait, compound rules might be stacked on top of each other too?
        // Requirement: "Apply compound rules on (line_amount + previous_taxes)."
        // Sorted by priority.

        // If multiple compound rules exist, do they compound on each other?
        // Usually, compound tax is applied on subtotal + previous taxes.
        // If we have Simple R1, Compound R2, Compound R3.
        // Order matters.
        // If sorted by priority:
        // 1. R1 (Simple)
        // 2. R2 (Compound)
        // 3. R3 (Compound)

        // If Inclusive:
        // Total = Base + Tax
        // We need to find Base.
        // Let's iterate to build the factor.

        let rateFactor = 1.0;
        let currentLevelFactor = 0.0; // Sum of simple rates at current level

        // Correct approach for finding Base in Inclusive mode with mixed rules:
        // It's safer to treat it as:
        // We have a list of rules sorted by priority.
        // For Exclusive:
        // CurrentBase = Price * Qty
        // Tax = 0
        // For each rule:
        //   RuleTax = CurrentBase * Rate
        //   If Compound: CurrentBase += RuleTax (conceptually, for next rule base) ??
        //   Actually, "Apply compound rules on (line_amount + previous_taxes)"
        //   So Base for compound = OriginalAmount + AccumulatedTaxSoFar.

        // Let's standardize the logic for both Inclusive and Exclusive.

        if (this.profile.pricing_mode === 'INCLUSIVE') {
            // 1. Calculate effective tax rate to find Base.
            // We simulate the tax calculation on a base of 1.0 to find the multiplier.

            let simBase = 1.0;
            let simTax = 0;

            // We need to process rules in order.
            // Simple rules apply to the original base (1.0).
            // Compound rules apply to (original base + accumulated tax).

            // Wait, "Apply non-compound rules first." -> This creates a grouping.
            // But rules are also sorted by priority.
            // "Sort rules by priority ascending. Apply non-compound rules first."
            // This implies: First apply all simple rules (sorted by priority among themselves),
            // then apply compound rules (sorted by priority).

            // Let's re-sort or just process simple then compound.
            const sortedSimple = simpleRules.sort((a, b) => a.priority - b.priority);
            const sortedCompound = compoundRules.sort((a, b) => a.priority - b.priority);
            const allRules = [...sortedSimple, ...sortedCompound];

            // Calculate Factor
            let currentSimTax = 0;
            for (const rule of allRules) {
                let ruleTax = 0;
                if (!rule.is_compound) {
                    ruleTax = 1.0 * (rule.rate_percent / 100);
                } else {
                    ruleTax = (1.0 + currentSimTax) * (rule.rate_percent / 100);
                }
                currentSimTax += ruleTax;
            }

            const totalFactor = 1.0 + currentSimTax;
            const originalTotal = item.price * item.quantity;
            const baseAmount = originalTotal / totalFactor;

            // Now calculate actual tax amounts
            let currentTotalTax = 0;

            // We need to capture the exact amount for each rule
            for (const rule of allRules) {
                let ruleTaxAmount = 0;
                if (!rule.is_compound) {
                    ruleTaxAmount = baseAmount * (rule.rate_percent / 100);
                } else {
                    ruleTaxAmount = (baseAmount + currentTotalTax) * (rule.rate_percent / 100);
                }

                snapshot.push({
                    rule_name: this.getRuleName(rule),
                    rate: rule.rate_percent,
                    amount: ruleTaxAmount,
                    is_compound: rule.is_compound
                });

                currentTotalTax += ruleTaxAmount;
            }

            taxAmount = currentTotalTax;

        } else {
            // EXCLUSIVE
            // Price is Base.
            const baseAmount = item.price * item.quantity;
            let currentTotalTax = 0;

            const sortedSimple = simpleRules.sort((a, b) => a.priority - b.priority);
            const sortedCompound = compoundRules.sort((a, b) => a.priority - b.priority);
            const allRules = [...sortedSimple, ...sortedCompound];

            for (const rule of allRules) {
                let ruleTaxAmount = 0;
                if (!rule.is_compound) {
                    ruleTaxAmount = baseAmount * (rule.rate_percent / 100);
                } else {
                    ruleTaxAmount = (baseAmount + currentTotalTax) * (rule.rate_percent / 100);
                }

                snapshot.push({
                    rule_name: this.getRuleName(rule),
                    rate: rule.rate_percent,
                    amount: ruleTaxAmount,
                    is_compound: rule.is_compound
                });

                currentTotalTax += ruleTaxAmount;
            }

            taxAmount = currentTotalTax;
        }

        const effectiveRate = (taxAmount / (item.price * item.quantity)) * 100; // Approximate

        return {
            taxAmount,
            taxRate: effectiveRate,
            snapshot
        };
    }

    getRuleName(rule) {
        // Helper to generate a friendly name
        // Could be "VAT (10%)" or "Luxury Tax (5%)"
        // If category name is available, use it, else generic.
        // Using "Rule #ID" or Category Name
        return rule.category_name ? `${rule.category_name} (${rule.rate_percent}%)` : `Tax (${rule.rate_percent}%)`;
    }
}

export { TaxEngine };
// Export singleton for backward compatibility if needed, but prefer instantiating
export const taxEngine = new TaxEngine();
