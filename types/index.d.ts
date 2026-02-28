export interface BaseEntity {
    id: number;
    created_at?: string;
    updated_at?: string;
    deleted_at?: string | null;
}
export interface User extends BaseEntity {
    name: string;
    username: string;
    password_hash?: string;
    is_active: number;
    roleId?: number;
    roles?: Role[];
    permissions?: string[];
}
export interface Role extends BaseEntity {
    name: string;
    description?: string;
}
export interface Permission {
    id: number;
    key: string;
    description?: string;
}
export interface UserPermissionOverride {
    user_id: number;
    permission_id: number;
    granted: number;
}
export interface Product extends BaseEntity {
    name: string;
    description?: string;
    category_id?: number | null;
    tax_category_id?: number | null;
    status: 'active' | 'inactive' | 'discontinued';
    image_path?: string | null;
    category_name?: string;
    stock?: number;
    variants?: Variant[];
}
export interface Variant extends BaseEntity {
    product_id: number;
    name: string;
    sku?: string | null;
    price: number;
    cost_price: number;
    stock_alert_cap: number;
    is_default: number;
    barcode?: string;
    status: 'active' | 'inactive' | 'discontinued';
    taxes?: string;
    image_path?: string;
    stock?: number;
}
export interface Category extends BaseEntity {
    name: string;
    description?: string;
    parent_id?: number | null;
    subcategories?: Category[];
}
export interface Customer extends BaseEntity {
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    loyalty_points?: number;
    is_tax_exempt?: boolean;
    type?: string;
}
export interface Invoice extends BaseEntity {
    customer_id?: number | null;
    user_id: number;
    invoice_number: string;
    subtotal: number;
    tax_total: number;
    discount_total: number;
    grand_total: number;
    status: 'paid' | 'pending' | 'void' | 'refunded';
    payment_method?: string;
    notes?: string;
    items: InvoiceItem[];
    customer?: Customer;
}
export interface InvoiceItem extends BaseEntity {
    invoice_id?: number;
    product_id: number;
    variant_id?: number;
    product_name: string;
    variant_name?: string;
    quantity: number;
    price: number;
    original_price?: number;
    tax_amount: number;
    tax_rate?: number;
    applied_tax_amount?: number;
    discount_amount?: number;
    total: number;
    tax_rule_snapshot?: string;
    tax_category_id?: number | null;
}
export interface Sale extends BaseEntity {
    invoice_number: string;
    sale_date: string;
    total_amount: number;
    paid_amount: number;
    discount: number;
    total_tax: number;
    status: 'draft' | 'paid' | 'partially_paid' | 'cancelled' | 'refunded';
    fulfillment_status: 'pending' | 'fulfilled' | 'cancelled';
    customer_id?: number | null;
    user_id: number;
    customer_name?: string;
    customer_phone?: string;
    customer_email?: string;
    biller_name?: string;
    cashier_name?: string;
    items: SaleItem[];
    transactions?: Transaction[];
}
export interface SaleItem extends BaseEntity {
    sale_id: number;
    variant_id: number;
    quantity: number;
    price_per_unit: number;
    cost_per_unit: number;
    tax_rate?: number;
    tax_amount: number;
    applied_tax_rate?: number;
    applied_tax_amount?: number;
    tax_rule_snapshot?: string;
    discount_amount: number;
    variant_name?: string;
    product_name?: string;
    returned_quantity?: number;
    sku?: string;
    image_path?: string;
}
export interface Transaction extends BaseEntity {
    sale_id: number;
    amount: number;
    type: 'payment' | 'refund';
    payment_method_id: number;
    status: 'completed' | 'pending' | 'cancelled';
    transaction_date: string;
    payment_method_name?: string;
}
export interface TaxProfile extends BaseEntity {
    name: string;
    pricing_mode: 'INCLUSIVE' | 'EXCLUSIVE';
    is_active: number;
    is_default: number;
}
export interface TaxRule extends BaseEntity {
    tax_profile_id: number;
    tax_category_id?: number | null;
    rule_scope?: 'ITEM' | 'INVOICE';
    rate_percent: number;
    is_compound: number;
    priority: number;
    min_price?: number | null;
    max_price?: number | null;
    min_invoice_total?: number | null;
    max_invoice_total?: number | null;
    customer_type?: string | null;
    valid_from?: string | null;
    valid_to?: string | null;
    category_name?: string;
}
export interface TaxCategory extends BaseEntity {
    name: string;
    description?: string;
}
export interface TaxResult {
    items: InvoiceItem[];
    total_tax: number;
    grand_total: number;
}
export interface PrinterConfig {
    id?: number;
    name: string;
    type: 'receipt' | 'kitchen' | 'label';
    interface_type: 'usb' | 'network' | 'bluetooth';
    address?: string;
    width?: number;
    is_default: number;
}
export interface AuditLog extends BaseEntity {
    user_id: number;
    action: string;
    table_name: string | null;
    row_id: number | null;
    old_data: string | null;
    new_data: string | null;
    event_details: string | null;
    user_name?: string;
}
export interface Session {
    id: string;
    user_id: number;
    token: string;
    expires_at: number;
    user?: User;
    username?: string;
    name?: string;
    roles?: string[];
    permissions?: string[];
}
export interface IPCRequestMap {
    'user:login': {
        username: string;
        password: string;
    };
    'invoice:create': Partial<Invoice>;
    'invoice:print': {
        invoiceId: number;
    };
}
export declare class AppError extends Error {
    code: string;
    statusCode: number;
    constructor(message: string, code?: string, statusCode?: number);
}
export declare const INVENTORY_REASONS: {
    readonly SALE: "sale";
    readonly RETURN: "return";
    readonly CONFIRM_RECEIVE: "confirm_receive";
    readonly SPOILAGE: "spoilage";
    readonly DAMAGE: "damage";
    readonly THEFT: "theft";
    readonly CORRECTION: "correction";
};
export type InventoryReason = typeof INVENTORY_REASONS[keyof typeof INVENTORY_REASONS];
export declare const VALID_INVENTORY_REASONS: readonly ["sale", "return", "confirm_receive", "spoilage", "damage", "theft", "correction"];
export declare const INVENTORY_REASON_LABELS: Record<InventoryReason, string>;
export declare const MANUAL_INVENTORY_REASONS: ("return" | "confirm_receive" | "spoilage" | "damage" | "theft" | "correction")[];
export interface PaymentPolicy {
    id: number;
    name: string;
    days_to_pay: number;
    description?: string | null;
    created_at?: string;
    updated_at?: string;
    deleted_at?: string | null;
}
export interface Supplier {
    id: number;
    name: string;
    contact_person?: string | null;
    phone?: string | null;
    email?: string | null;
    address?: string | null;
    gstin?: string | null;
    payment_policy_id?: number;
    created_at?: string;
    updated_at?: string;
    deleted_at?: string | null;
}
export interface PurchaseOrder {
    id: number;
    supplier_id: number;
    status: 'pending' | 'received' | 'cancelled';
    order_date: string;
    received_date?: string | null;
    created_by: number;
    supplier_name?: string;
    created_by_name?: string;
    item_count?: number;
    total_cost?: number;
    items?: PurchaseOrderItem[];
}
export interface PurchaseOrderItem {
    id: number;
    purchase_order_id: number;
    variant_id: number;
    quantity: number;
    unit_cost: number;
    variant_name?: string;
    sku?: string;
    product_name?: string;
}
export interface SalesReportSummary {
    total_transactions: number;
    total_sales: number;
    total_tax: number;
    total_discount: number;
    total_collected: number;
    net_sales?: number;
    average_sale?: number;
}
export interface DailyReport extends SalesReportSummary {
    date: string;
    reportType: 'daily';
}
export interface MonthlyReport {
    year: number;
    month: number;
    reportType: 'monthly';
    summary: SalesReportSummary;
    breakdown: Array<{
        date: string;
        name: string;
        sales: number;
        total_transactions: number;
        total_sales: number;
        total_tax: number;
        total_discount: number;
    }>;
}
export interface YearlyReport {
    year: number;
    reportType: 'yearly';
    summary: SalesReportSummary;
    breakdown: Array<{
        month: string;
        name: string;
        sales: number;
        total_transactions: number;
        total_sales: number;
        total_tax: number;
        total_discount: number;
    }>;
}
export interface TopProduct {
    product_id: number;
    product_name: string;
    variant_name: string;
    sku: string;
    total_quantity_sold: number;
    total_revenue: number;
}
export interface PaymentMethodStat {
    payment_method: string;
    total_transactions: number;
    total_amount: number;
}
//# sourceMappingURL=index.d.ts.map