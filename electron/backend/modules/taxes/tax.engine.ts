import { getActiveTaxProfile, getTaxRulesByProfileId } from './tax.repository.js';
import { Invoice, InvoiceItem, TaxProfile, TaxRule, Customer, TaxResult } from '../../../../types/index.js';

/**
 * Tax Calculation Engine
 * Responsible for calculating taxes based on configurable rules.
 */
export class TaxEngine {
    profile: TaxProfile | null;
    rules: TaxRule[] | null;

    constructor(profile: TaxProfile | null = null, rules: TaxRule[] | null = null) {
        this.profile = profile;
        this.rules = rules;
    }

    /**
     * Initialize the engine by fetching the active profile and rules
     */
    init(): void {
        const profile = getActiveTaxProfile();
        this.profile = profile ? (profile as unknown as TaxProfile) : null;

        if (this.profile) {
            this.rules = getTaxRulesByProfileId(this.profile.id) as unknown as TaxRule[];
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
    calculate(invoice: Invoice, customer: Customer | null = null): TaxResult {
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
        const updatedItems: InvoiceItem[] = [];

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
                tax_rate: taxRate, // This might be a blended rate if multiple rules apply
                // applied_tax_amount: finalTaxAmount, // Not in interface but in JS code? Added to interface?
                // Interface has tax_amount. JS had applied_tax_amount as dup?
                // I'll stick to interface. Interface has tax_amount.
                // JS had applied_tax_amount. I'll ignore it if not in interface or add to interface if critical.
                // JS: applied_tax_amount: finalTaxAmount
                // I'll add it to InvoiceItem interface or just ignore if unused.
                // Interface defined `tax_amount`.
                tax_rule_snapshot: JSON.stringify(snapshot)
            } as InvoiceItem);

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

    getApplicableRules(item: InvoiceItem, invoiceTotal: number, customer: Customer | null): TaxRule[] {
        if (!this.rules) return [];

        const now = new Date();
        const itemPrice = item.price; // Unit price

        return this.rules.filter(rule => {
            // 1. Category match
            if (rule.tax_category_id && rule.tax_category_id !== item.tax_category_id) { // item needs tax_category_id
                // InvoiceItem interface doesn't have tax_category_id?
                // Wait, InvoiceItem has product_id, maybe we need to fetch product?
                // Or item passed to calculate includes tax_category_id?
                // In JS code: item.tax_category_id.
                // So InvoiceItem should have it.
                // I need to update InvoiceItem interface.
                return false;
            }

            // 2. Rule Scope
            // If scope is INVOICE, it applies to all items (unless specific category set?)
            // Requirement says: "Filter by: category match OR null category"
            // So if rule has no category, it applies to all.

            // 3. Price Thresholds
            if (rule.min_price !== null && rule.min_price !== undefined && itemPrice < rule.min_price) return false;
            if (rule.max_price !== null && rule.max_price !== undefined && itemPrice > rule.max_price) return false;

            // 4. Invoice Total Thresholds
            if (rule.min_invoice_total !== null && rule.min_invoice_total !== undefined && invoiceTotal < rule.min_invoice_total) return false;
            if (rule.max_invoice_total !== null && rule.max_invoice_total !== undefined && invoiceTotal > rule.max_invoice_total) return false;

            // 5. Customer Type
            if (rule.customer_type && customer?.type !== rule.customer_type) return false;

            // 6. Date Validity
            if (rule.valid_from && new Date(rule.valid_from) > now) return false;
            if (rule.valid_to && new Date(rule.valid_to) < now) return false;

            return true;
        }).sort((a, b) => a.priority - b.priority);
    }

    calculateItemTax(item: InvoiceItem, rules: TaxRule[]): { taxAmount: number; taxRate: number; snapshot: any[] } {
        let taxAmount = 0;
        let taxableAmount = item.price * item.quantity;
        let accumulatedTax = 0;
        const snapshot: any[] = [];

        // Separate compound and non-compound rules
        const simpleRules = rules.filter(r => !r.is_compound);
        const compoundRules = rules.filter(r => r.is_compound);

        if (this.profile!.pricing_mode === 'INCLUSIVE') {
            // 1. Calculate effective tax rate to find Base.
            // We simulate the tax calculation on a base of 1.0 to find the multiplier.

            let simBase = 1.0;
            let simTax = 0;

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

        const effectiveRate = (item.price * item.quantity) > 0 ? (taxAmount / (item.price * item.quantity)) * 100 : 0;

        return {
            taxAmount,
            taxRate: effectiveRate,
            snapshot
        };
    }

    getRuleName(rule: TaxRule): string {
        return rule.category_name ? `${rule.category_name} (${rule.rate_percent}%)` : `Tax (${rule.rate_percent}%)`;
    }
}

export const taxEngine = new TaxEngine();
