/**
 * RBAC Service
 * Centralized permission checking and role management
 */

import { ROLES } from './roles.js';

export interface UserContext {
  id: number;
  roles: string[];
  permissions: string[];
}

/**
 * Check if user has admin role
 */
export function isAdmin(user: UserContext): boolean {
  return user.roles.includes(ROLES.ADMIN);
}

/**
 * Check if user has specific permission
 * Admin role bypasses all permission checks
 */
export function hasPermission(user: UserContext, permission: string): boolean {
  if (isAdmin(user)) {
    return true;
  }
  return user.permissions.includes(permission);
}

/**
 * Check if user has any of the specified permissions (OR logic)
 * Admin role bypasses all permission checks
 */
export function hasAnyPermission(user: UserContext, permissions: string[]): boolean {
  if (isAdmin(user)) {
    return true;
  }
  return permissions.some(p => user.permissions.includes(p));
}

/**
 * Check if user has all of the specified permissions (AND logic)
 * Admin role bypasses all permission checks
 */
export function hasAllPermissions(user: UserContext, permissions: string[]): boolean {
  if (isAdmin(user)) {
    return true;
  }
  return permissions.every(p => user.permissions.includes(p));
}

/**
 * Check if user has specific role
 */
export function hasRole(user: UserContext, role: string): boolean {
  return user.roles.includes(role);
}

/**
 * Check if user has any of the specified roles (OR logic)
 */
export function hasAnyRole(user: UserContext, roles: string[]): boolean {
  return roles.some(r => user.roles.includes(r));
}

/**
 * Check if user has all of the specified roles (AND logic)
 */
export function hasAllRoles(user: UserContext, roles: string[]): boolean {
  return roles.every(r => user.roles.includes(r));
}

/**
 * Validate permission string format (e.g., 'users.view')
 */
export function isValidPermission(permission: string): boolean {
  return /^[a-z_]+\.[a-z_]+$/.test(permission);
}

/**
 * Validate role name format
 */
export function isValidRoleName(role: string): boolean {
  return /^[a-z_]+$/.test(role);
}

/**
 * Get permission resource (e.g., 'users' from 'users.view')
 */
export function getPermissionResource(permission: string): string | null {
  const match = permission.match(/^([a-z_]+)\./);
  return match ? match[1] : null;
}

/**
 * Get permission action (e.g., 'view' from 'users.view')
 */
export function getPermissionAction(permission: string): string | null {
  const match = permission.match(/\.([a-z_]+)$/);
  return match ? match[1] : null;
}

/**
 * Check if user can perform action on resource
 */
export function canPerformAction(
  user: UserContext,
  resource: string,
  action: string
): boolean {
  const permission = `${resource}.${action}`;
  return hasPermission(user, permission);
}
