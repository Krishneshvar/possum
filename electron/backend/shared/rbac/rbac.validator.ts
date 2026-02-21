/**
 * RBAC Validation Script
 * Validates that database permissions match the code registry
 */

import { getDB } from '../../shared/db/index.js';
import { ALL_PERMISSIONS, PERMISSIONS } from '../../shared/rbac/permissions.js';
import { ROLE_DEFINITIONS, ROLES } from '../../shared/rbac/roles.js';

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate permissions in database match code registry
 */
export function validatePermissions(): ValidationResult {
  const db = getDB();
  const result: ValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
  };

  // Get all permissions from database
  const dbPermissions = db.prepare('SELECT key FROM permissions').all() as { key: string }[];
  const dbPermissionKeys = dbPermissions.map(p => p.key);

  // Check for missing permissions in database
  const missingInDb = ALL_PERMISSIONS.filter((p: string) => !dbPermissionKeys.includes(p));
  if (missingInDb.length > 0) {
    result.valid = false;
    result.errors.push(`Missing permissions in database: ${missingInDb.join(', ')}`);
  }

  // Check for extra permissions in database (not in code)
  const extraInDb = dbPermissionKeys.filter(p => !ALL_PERMISSIONS.includes(p));
  if (extraInDb.length > 0) {
    result.warnings.push(`Extra permissions in database (not in code registry): ${extraInDb.join(', ')}`);
  }

  return result;
}

/**
 * Validate roles in database match code registry
 */
export function validateRoles(): ValidationResult {
  const db = getDB();
  const result: ValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
  };

  // Get all roles from database
  const dbRoles = db.prepare('SELECT name FROM roles').all() as { name: string }[];
  const dbRoleNames = dbRoles.map(r => r.name);

  // Check for missing roles in database
  const expectedRoles = Object.values(ROLES);
  const missingInDb = expectedRoles.filter(r => !dbRoleNames.includes(r));
  if (missingInDb.length > 0) {
    result.valid = false;
    result.errors.push(`Missing roles in database: ${missingInDb.join(', ')}`);
  }

  return result;
}

/**
 * Validate role-permission mappings
 */
export function validateRolePermissions(): ValidationResult {
  const db = getDB();
  const result: ValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
  };

  for (const [roleName, roleDef] of Object.entries(ROLE_DEFINITIONS)) {
    if (roleName === ROLES.ADMIN) {
      // Admin should have all permissions or none (bypasses checks)
      continue;
    }

    // Get role ID
    const role = db.prepare('SELECT id FROM roles WHERE name = ?').get(roleName) as { id: number } | undefined;
    if (!role) {
      result.errors.push(`Role ${roleName} not found in database`);
      continue;
    }

    // Get permissions for this role from database
    const dbPerms = db.prepare(`
      SELECT p.key 
      FROM permissions p
      JOIN role_permissions rp ON p.id = rp.permission_id
      WHERE rp.role_id = ?
    `).all(role.id) as { key: string }[];
    
    const dbPermKeys = dbPerms.map((p: { key: string }) => p.key);

    // Check for missing permissions
    const missingPerms = (roleDef as any).permissions.filter((p: string) => !dbPermKeys.includes(p));
    if (missingPerms.length > 0) {
      result.warnings.push(`Role ${roleName} missing permissions in DB: ${missingPerms.join(', ')}`);
    }

    // Check for extra permissions
    const extraPerms = dbPermKeys.filter((p: string) => !(roleDef as any).permissions.includes(p));
    if (extraPerms.length > 0) {
      result.warnings.push(`Role ${roleName} has extra permissions in DB: ${extraPerms.join(', ')}`);
    }
  }

  return result;
}

/**
 * Run all validations
 */
export function validateRBAC(): ValidationResult {
  const permResult = validatePermissions();
  const roleResult = validateRoles();
  const rolePerm = validateRolePermissions();

  return {
    valid: permResult.valid && roleResult.valid && rolePerm.valid,
    errors: [...permResult.errors, ...roleResult.errors, ...rolePerm.errors],
    warnings: [...permResult.warnings, ...roleResult.warnings, ...rolePerm.warnings],
  };
}
