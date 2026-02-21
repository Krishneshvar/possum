/**
 * RBAC Permissions Registry
 * Central source of truth for all permissions in the system
 */

export const PERMISSIONS = {
  // User Management
  USERS_VIEW: 'users.view',
  USERS_MANAGE: 'users.manage',

  // Product Management
  PRODUCTS_VIEW: 'products.view',
  PRODUCTS_MANAGE: 'products.manage',

  // Inventory Management
  INVENTORY_VIEW: 'inventory.view',
  INVENTORY_MANAGE: 'inventory.manage',

  // Sales Management
  SALES_VIEW: 'sales.view',
  SALES_CREATE: 'sales.create',
  SALES_MANAGE: 'sales.manage',
  SALES_REFUND: 'sales.refund',

  // Reports
  REPORTS_VIEW: 'reports.view',

  // Supplier Management
  SUPPLIERS_VIEW: 'suppliers.view',
  SUPPLIERS_MANAGE: 'suppliers.manage',

  // Purchase Management
  PURCHASE_VIEW: 'purchase.view',
  PURCHASE_MANAGE: 'purchase.manage',

  // Customer Management
  CUSTOMERS_VIEW: 'customers.view',
  CUSTOMERS_MANAGE: 'customers.manage',

  // Category Management
  CATEGORIES_VIEW: 'categories.view',
  CATEGORIES_MANAGE: 'categories.manage',

  // Settings
  SETTINGS_VIEW: 'settings.view',
  SETTINGS_MANAGE: 'settings.manage',

  // Audit Logs
  AUDIT_VIEW: 'audit.view',

  // Returns Management
  RETURNS_VIEW: 'returns.view',
  RETURNS_MANAGE: 'returns.manage',

  // Transactions
  TRANSACTIONS_VIEW: 'transactions.view',
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

export const ALL_PERMISSIONS = Object.values(PERMISSIONS);
