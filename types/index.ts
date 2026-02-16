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
  is_active: number; // 0 or 1
  roleId?: number; // helper
  roles?: Role[]; // populated
  permissions?: string[]; // populated
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

export interface Product extends BaseEntity {
  name: string;
  description?: string;
  category_id?: number | null;
  tax_category_id?: number | null;
  status: 'active' | 'archived' | 'draft' | string;
  image_path?: string | null;
  category_name?: string; // joined
  stock?: number; // derived
  variants?: Variant[];
}

export interface Variant extends BaseEntity {
  product_id: number;
  name: string;
  sku?: string;
  price: number;
  cost_price?: number;
  stock_alert_cap?: number;
  is_default: number; // 0 or 1
  barcode?: string;
  status?: string; // Added
  taxes?: string; // JSON string from DB or joined
  image_path?: string; // Joined from product?
  stock?: number; // Derived
}

export interface Category extends BaseEntity {
  name: string;
  description?: string;
  parent_id?: number | null;
}

export interface Customer extends BaseEntity {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  is_tax_exempt: number; // 0 or 1
  type?: string; // 'retail', 'wholesale', etc.
  loyalty_points?: number;
}

// Deprecated Invoice/InvoiceItem in favor of Sale/SaleItem to match DB
// But keeping for TaxEngine compatibility if needed, or updating TaxEngine.
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

// Used for Tax Calculation DTO
export interface InvoiceItem extends BaseEntity {
  invoice_id?: number; // Optional in calculation
  product_id: number;
  variant_id?: number;
  product_name: string;
  variant_name?: string;
  quantity: number;
  price: number; // Net unit price (taxable base)
  original_price?: number;
  tax_amount: number;
  tax_rate?: number; // Applied effective rate
  applied_tax_amount?: number;
  discount_amount?: number;
  total: number;
  tax_rule_snapshot?: string; // JSON
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
  // Joined fields
  customer_name?: string;
  customer_phone?: string;
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
  // Joined fields
  variant_name?: string;
  product_name?: string;
  sku?: string;
  image_path?: string;
}

export interface Transaction extends BaseEntity {
  sale_id: number;
  amount: number;
  type: string;
  payment_method_id: number;
  status: string;
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
  rule_scope?: 'ITEM' | 'INVOICE'; // Added
  // name: string; // Removed as it's not in DB
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
  category_name?: string; // joined
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
  address?: string; // IP or path
  width?: number; // mm
  is_default: number;
}

export interface AuditLog extends BaseEntity {
  user_id: number;
  action: string;
  entity_type: string;
  entity_id: number;
  details?: string; // JSON
  ip_address?: string;
}

export interface Session {
  id: string;
  user_id: number;
  token: string;
  expires_at: number;
  user?: User; // Nested user object
  // Flattened for easy access if needed (optional)
  username?: string;
  name?: string;
  roles?: string[];
  permissions?: string[];
}

// IPC Types
export interface IPCRequestMap {
  'user:login': { username: string; password: string };
  'invoice:create': Partial<Invoice>;
  'invoice:print': { invoiceId: number };
}

// Error
export class AppError extends Error {
  code: string;
  statusCode: number;

  constructor(message: string, code: string = 'INTERNAL_ERROR', statusCode: number = 500) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.name = 'AppError';
  }
}
