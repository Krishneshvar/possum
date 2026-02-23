import { Decimal } from 'decimal.js';
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
            const invoiceGrandTotal = invoice.items.reduce((sum, item) => {
                const itemTotal = new Decimal(item.price).mul(item.quantity);
                return sum.add(itemTotal);
            }, new Decimal(0));

            return {
                items: invoice.items.map(item => ({
                    ...item,
                    tax_amount: 0,
                    applied_tax_rate: 0,
                    applied_tax_amount: 0,
                    tax_rule_snapshot: JSON.stringify([])
                })),
                total_tax: 0,
                grand_total: invoiceGrandTotal.toNumber()
            };
        }

        // 1. Exemption Logic
        if (customer && customer.is_tax_exempt) {
            const invoiceGrandTotal = invoice.items.reduce((sum, item) => {
                const itemTotal = new Decimal(item.price).mul(item.quantity);
                return sum.add(itemTotal);
            }, new Decimal(0));

            return {
                items: invoice.items.map(item => ({
                    ...item,
                    tax_amount: 0,
                    applied_tax_rate: 0,
                    applied_tax_amount: 0,
                    tax_rule_snapshot: JSON.stringify([])
                })),
                total_tax: 0,
                grand_total: invoiceGrandTotal.toNumber()
            };
        }

        const invoiceTotal = invoice.items.reduce((sum, item) => {
            const itemTotal = new Decimal(item.price).mul(item.quantity);
            return sum.add(itemTotal);
        }, new Decimal(0));

        let totalTax = new Decimal(0);
        const updatedItems: InvoiceItem[] = [];

        for (const item of invoice.items) {
            const applicableRules = this.getApplicableRules(item, invoiceTotal.toNumber(), customer);

            // Calculate tax for this item
            const { taxAmount, taxRate, snapshot } = this.calculateItemTax(item, applicableRules);

            // Round tax per line (not globally) to 2 decimal places
            const finalTaxAmount = taxAmount.toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

            updatedItems.push({
                ...item,
                tax_amount: finalTaxAmount.toNumber(),
                tax_rate: taxRate.toNumber(),
                tax_rule_snapshot: JSON.stringify(snapshot)
            } as InvoiceItem);

            totalTax = totalTax.add(finalTaxAmount);
        }

        // Grand total calculation depends on pricing mode
        let grandTotal = new Decimal(0);
        if (this.profile.pricing_mode === 'INCLUSIVE') {
            grandTotal = invoiceTotal;
        } else {
            grandTotal = invoiceTotal.add(totalTax);
        }

        return {
            items: updatedItems,
            total_tax: totalTax.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber(),
            grand_total: grandTotal.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber()
        };
    }

    getApplicableRules(item: InvoiceItem, invoiceTotal: number, customer: Customer | null): TaxRule[] {
        if (!this.rules) return [];

        const now = new Date();
        const itemPrice = item.price; // Unit price

        return this.rules.filter(rule => {
            // 1. Category match
            if (rule.tax_category_id && rule.tax_category_id !== item.tax_category_id) {
                return false;
            }

            // 2. Price Thresholds
            if (rule.min_price !== null && rule.min_price !== undefined && itemPrice < rule.min_price) return false;
            if (rule.max_price !== null && rule.max_price !== undefined && itemPrice > rule.max_price) return false;

            // 3. Invoice Total Thresholds
            if (rule.min_invoice_total !== null && rule.min_invoice_total !== undefined && invoiceTotal < rule.min_invoice_total) return false;
            if (rule.max_invoice_total !== null && rule.max_invoice_total !== undefined && invoiceTotal > rule.max_invoice_total) return false;

            // 4. Customer Type
            if (rule.customer_type && customer?.type !== rule.customer_type) return false;

            // 5. Date Validity
            if (rule.valid_from && new Date(rule.valid_from) > now) return false;
            if (rule.valid_to && new Date(rule.valid_to) < now) return false;

            return true;
        }).sort((a, b) => a.priority - b.priority);
    }

    calculateItemTax(item: InvoiceItem, rules: TaxRule[]): { taxAmount: Decimal; taxRate: Decimal; snapshot: any[] } {
        let taxAmount = new Decimal(0);
        const snapshot: any[] = [];

        const simpleRules = rules.filter(r => !r.is_compound);
        const compoundRules = rules.filter(r => r.is_compound);
        const allRules = [...simpleRules.sort((a, b) => a.priority - b.priority), ...compoundRules.sort((a, b) => a.priority - b.priority)];

        const itemTotalAmount = new Decimal(item.price).mul(item.quantity);

        if (this.profile!.pricing_mode === 'INCLUSIVE') {
            // Factor calculation: simBase is 1.0
            let currentSimTax = new Decimal(0);
            for (const rule of allRules) {
                let ruleFactor = new Decimal(rule.rate_percent).div(100);
                let ruleTax;
                if (!rule.is_compound) {
                    ruleTax = new Decimal(1).mul(ruleFactor);
                } else {
                    ruleTax = new Decimal(1).add(currentSimTax).mul(ruleFactor);
                }
                currentSimTax = currentSimTax.add(ruleTax);
            }

            const totalFactor = new Decimal(1).add(currentSimTax);
            const baseAmount = itemTotalAmount.div(totalFactor);

            let currentTotalTax = new Decimal(0);
            for (const rule of allRules) {
                let ruleFactor = new Decimal(rule.rate_percent).div(100);
                let ruleTaxAmount;
                if (!rule.is_compound) {
                    ruleTaxAmount = baseAmount.mul(ruleFactor);
                } else {
                    ruleTaxAmount = baseAmount.add(currentTotalTax).mul(ruleFactor);
                }

                snapshot.push({
                    rule_name: this.getRuleName(rule),
                    rate: rule.rate_percent,
                    amount: ruleTaxAmount.toDecimalPlaces(4).toNumber(), // Keep precision in snapshot
                    is_compound: rule.is_compound
                });

                currentTotalTax = currentTotalTax.add(ruleTaxAmount);
            }

            taxAmount = currentTotalTax;

        } else {
            // EXCLUSIVE
            const baseAmount = itemTotalAmount;
            let currentTotalTax = new Decimal(0);

            for (const rule of allRules) {
                let ruleFactor = new Decimal(rule.rate_percent).div(100);
                let ruleTaxAmount;
                if (!rule.is_compound) {
                    ruleTaxAmount = baseAmount.mul(ruleFactor);
                } else {
                    ruleTaxAmount = baseAmount.add(currentTotalTax).mul(ruleFactor);
                }

                snapshot.push({
                    rule_name: this.getRuleName(rule),
                    rate: rule.rate_percent,
                    amount: ruleTaxAmount.toDecimalPlaces(4).toNumber(),
                    is_compound: rule.is_compound
                });

                currentTotalTax = currentTotalTax.add(ruleTaxAmount);
            }

            taxAmount = currentTotalTax;
        }

        const effectiveRate = itemTotalAmount.gt(0) ? taxAmount.div(itemTotalAmount).mul(100) : new Decimal(0);

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
