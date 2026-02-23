export interface TaxProfile {
    id?: number;
    name: string;
    country_code: string;
    region_code: string;
    pricing_mode: 'INCLUSIVE' | 'EXCLUSIVE' | 'inclusive' | 'exclusive';
    is_active: boolean;
    created_at?: string;
    updated_at?: string;
}

export interface TaxCategory {
    id?: number;
    name: string;
    description: string;
    product_count?: number;
}

export interface TaxRule {
    id?: number;
    tax_profile_id: number;
    tax_category_id: number | null;
    rule_scope: 'GLOBAL' | 'CATEGORY' | 'PRODUCT';
    min_price: number | null;
    max_price: number | null;
    min_invoice_total: number | null;
    max_invoice_total: number | null;
    customer_type: string | null;
    rate_percent: number;
    is_compound: boolean;
    priority: number;
    valid_from: string | null;
    valid_to: string | null;
    category_name?: string;
}

export interface ITaxRepository {
    getActiveTaxProfile(): any;
    getAllTaxProfiles(): TaxProfile[];
    createTaxProfile(profile: TaxProfile): any;
    updateTaxProfile(id: number, profile: Partial<TaxProfile>): any;
    deleteTaxProfile(id: number): any;
    getAllTaxCategories(): TaxCategory[];
    createTaxCategory(category: { name: string; description: string }): any;
    updateTaxCategory(id: number, category: { name: string; description: string }): any;
    deleteTaxCategory(id: number): any;
    getTaxRulesByProfileId(profileId: number): TaxRule[];
    createTaxRule(rule: TaxRule): any;
    updateTaxRule(id: number, rule: Partial<TaxRule>): any;
    deleteTaxRule(id: number): any;
}
