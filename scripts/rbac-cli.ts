#!/usr/bin/env node

/**
 * RBAC Management CLI
 * Validates and syncs RBAC configuration between code and database
 */

import { getDB } from '../electron/backend/shared/db/index.js';
import { ALL_PERMISSIONS, PERMISSIONS } from '../electron/backend/shared/rbac/permissions.js';
import { ROLE_DEFINITIONS, ROLES } from '../electron/backend/shared/rbac/roles.js';
import { validateRBAC } from '../electron/backend/shared/rbac/rbac.validator.js';

function syncPermissions() {
  const db = getDB();
  console.log('🔄 Syncing permissions...');

  for (const permission of ALL_PERMISSIONS) {
    const existing = db.prepare('SELECT id FROM permissions WHERE key = ?').get(permission);
    if (!existing) {
      db.prepare('INSERT INTO permissions (key) VALUES (?)').run(permission);
      console.log(`  ✅ Added permission: ${permission}`);
    }
  }

  console.log('✅ Permissions synced\n');
}

function syncRoles() {
  const db = getDB();
  console.log('🔄 Syncing roles...');

  for (const [roleName, roleDef] of Object.entries(ROLE_DEFINITIONS)) {
    const existing = db.prepare('SELECT id FROM roles WHERE name = ?').get(roleName);
    if (!existing) {
      db.prepare('INSERT INTO roles (name, description) VALUES (?, ?)').run(roleName, roleDef.description);
      console.log(`  ✅ Added role: ${roleName}`);
    } else {
      // Update description
      db.prepare('UPDATE roles SET description = ? WHERE name = ?').run(roleDef.description, roleName);
    }
  }

  console.log('✅ Roles synced\n');
}

function syncRolePermissions() {
  const db = getDB();
  console.log('🔄 Syncing role-permission mappings...');

  for (const [roleName, roleDef] of Object.entries(ROLE_DEFINITIONS)) {
    if (roleName === ROLES.ADMIN) {
      // Admin gets all permissions
      const role = db.prepare('SELECT id FROM roles WHERE name = ?').get(roleName) as { id: number } | undefined;
      if (!role) continue;

      // Clear existing
      db.prepare('DELETE FROM role_permissions WHERE role_id = ?').run(role.id);

      // Add all permissions
      const allPerms = db.prepare('SELECT id FROM permissions').all() as { id: number }[];
      const insertStmt = db.prepare('INSERT OR IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)');
      
      for (const perm of allPerms) {
        insertStmt.run(role.id, perm.id);
      }
      
      console.log(`  ✅ Synced ${roleName}: ALL permissions`);
      continue;
    }

    const role = db.prepare('SELECT id FROM roles WHERE name = ?').get(roleName) as { id: number } | undefined;
    if (!role) continue;

    // Clear existing
    db.prepare('DELETE FROM role_permissions WHERE role_id = ?').run(role.id);

    // Add defined permissions
    const insertStmt = db.prepare(`
      INSERT OR IGNORE INTO role_permissions (role_id, permission_id)
      SELECT ?, id FROM permissions WHERE key = ?
    `);

    for (const permKey of roleDef.permissions) {
      insertStmt.run(role.id, permKey);
    }

    console.log(`  ✅ Synced ${roleName}: ${roleDef.permissions.length} permissions`);
  }

  console.log('✅ Role-permission mappings synced\n');
}

function validate() {
  console.log('🔍 Validating RBAC configuration...\n');
  
  const result = validateRBAC();

  if (result.errors.length > 0) {
    console.log('❌ ERRORS:');
    result.errors.forEach(err => console.log(`  - ${err}`));
    console.log('');
  }

  if (result.warnings.length > 0) {
    console.log('⚠️  WARNINGS:');
    result.warnings.forEach(warn => console.log(`  - ${warn}`));
    console.log('');
  }

  if (result.valid && result.warnings.length === 0) {
    console.log('✅ RBAC configuration is valid!\n');
  } else if (result.valid) {
    console.log('✅ RBAC configuration is valid (with warnings)\n');
  } else {
    console.log('❌ RBAC configuration has errors\n');
    process.exit(1);
  }
}

function showHelp() {
  console.log(`
RBAC Management CLI

Usage:
  npm run rbac:validate    - Validate RBAC configuration
  npm run rbac:sync        - Sync permissions and roles to database
  npm run rbac:full        - Sync and validate

Commands:
  validate    Check if database matches code configuration
  sync        Update database with code configuration
  full        Sync then validate
  help        Show this help message
`);
}

// Main
const command = process.argv[2] || 'help';

try {
  switch (command) {
    case 'validate':
      validate();
      break;
    case 'sync':
      syncPermissions();
      syncRoles();
      syncRolePermissions();
      console.log('🎉 Sync complete!\n');
      break;
    case 'full':
      syncPermissions();
      syncRoles();
      syncRolePermissions();
      validate();
      break;
    case 'help':
    default:
      showHelp();
      break;
  }
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
