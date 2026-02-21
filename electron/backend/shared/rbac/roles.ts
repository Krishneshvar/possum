/**
 * RBAC Roles Configuration
 * Defines default roles and their permission mappings
 */

import { PERMISSIONS } from './permissions.js';

export const ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  CASHIER: 'cashier',
} as const;

export type RoleName = typeof ROLES[keyof typeof ROLES];

export interface RoleDefinition {
  name: RoleName;
  description: string;
  permissions: string[];
}

export const ROLE_DEFINITIONS: Record<RoleName, RoleDefinition> = {
  [ROLES.ADMIN]: {
    name: ROLES.ADMIN,
    description: 'Full system access with all permissions',
    permissions: [], // Admin bypasses permission checks
  },
  [ROLES.MANAGER]: {
    name: ROLES.MANAGER,
    description: 'Manages operations, inventory, and reports',
    permissions: [
      PERMISSIONS.PRODUCTS_VIEW,
      PERMISSIONS.PRODUCTS_MANAGE,
      PERMISSIONS.INVENTORY_VIEW,
      PERMISSIONS.INVENTORY_MANAGE,
      PERMISSIONS.SALES_VIEW,
      PERMISSIONS.SALES_CREATE,
      PERMISSIONS.SALES_MANAGE,
      PERMISSIONS.SALES_REFUND,
      PERMISSIONS.REPORTS_VIEW,
      PERMISSIONS.SUPPLIERS_VIEW,
      PERMISSIONS.SUPPLIERS_MANAGE,
      PERMISSIONS.PURCHASE_VIEW,
      PERMISSIONS.PURCHASE_MANAGE,
      PERMISSIONS.CUSTOMERS_VIEW,
      PERMISSIONS.CUSTOMERS_MANAGE,
      PERMISSIONS.CATEGORIES_VIEW,
      PERMISSIONS.CATEGORIES_MANAGE,
      PERMISSIONS.SETTINGS_VIEW,
      PERMISSIONS.SETTINGS_MANAGE,
      PERMISSIONS.RETURNS_VIEW,
      PERMISSIONS.RETURNS_MANAGE,
      PERMISSIONS.TRANSACTIONS_VIEW,
    ],
  },
  [ROLES.CASHIER]: {
    name: ROLES.CASHIER,
    description: 'Basic sales and customer operations',
    permissions: [
      PERMISSIONS.PRODUCTS_VIEW,
      PERMISSIONS.INVENTORY_VIEW,
      PERMISSIONS.SALES_VIEW,
      PERMISSIONS.SALES_CREATE,
      PERMISSIONS.CUSTOMERS_VIEW,
      PERMISSIONS.CATEGORIES_VIEW,
      PERMISSIONS.TRANSACTIONS_VIEW,
    ],
  },
};
