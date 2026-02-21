# RBAC Module

Role-Based Access Control system for POSSUM application.

## Overview

This module provides a centralized, type-safe, and flexible RBAC system with:
- Centralized permission registry
- Role definitions with permission mappings
- User-specific permission overrides
- Validation utilities
- Reusable permission checking functions

## Structure

```
shared/rbac/
├── permissions.ts       # Permission constants and registry
├── roles.ts            # Role definitions and mappings
├── rbac.service.ts     # Permission checking logic
├── rbac.validator.ts   # Validation utilities
└── index.ts            # Module exports
```

## Quick Start

### 1. Import the module

```typescript
import { PERMISSIONS, hasPermission, hasAnyPermission } from '../shared/rbac';
```

### 2. Use in middleware

```typescript
import { requirePermission, requireRole, requireAdmin } from '../shared/middleware/auth.middleware';

// Require single permission
router.get('/users', requirePermission(PERMISSIONS.USERS_VIEW), getUsers);

// Require any of multiple permissions (OR logic)
router.get('/sales', requirePermission([PERMISSIONS.SALES_VIEW, PERMISSIONS.SALES_CREATE]), getSales);

// Require specific role
router.post('/admin-action', requireAdmin, adminAction);

// Require any role
router.get('/report', requireRole(['admin', 'manager']), getReport);
```

### 3. Use in services

```typescript
import { hasPermission, isAdmin } from '../shared/rbac';

function processRefund(user: UserContext, saleId: number) {
  if (!hasPermission(user, PERMISSIONS.SALES_REFUND)) {
    throw new Error('Insufficient permissions');
  }
  // Process refund...
}
```

## Permission Registry

All permissions are defined in `permissions.ts`:

```typescript
export const PERMISSIONS = {
  USERS_VIEW: 'users.view',
  USERS_MANAGE: 'users.manage',
  PRODUCTS_VIEW: 'products.view',
  // ... etc
} as const;
```

**Benefits:**
- Type safety (autocomplete in IDE)
- Single source of truth
- Easy refactoring
- Compile-time validation

## Role Definitions

Roles and their permissions are defined in `roles.ts`:

```typescript
export const ROLE_DEFINITIONS: Record<RoleName, RoleDefinition> = {
  admin: {
    name: 'admin',
    description: 'Full system access',
    permissions: [], // Bypasses all checks
  },
  manager: {
    name: 'manager',
    description: 'Manages operations',
    permissions: [
      PERMISSIONS.PRODUCTS_VIEW,
      PERMISSIONS.PRODUCTS_MANAGE,
      // ... etc
    ],
  },
  // ... etc
};
```

## User-Specific Permissions

Grant or revoke specific permissions for individual users:

### Database Operations

```sql
-- Grant a permission to a user
INSERT INTO user_permissions (user_id, permission_id, granted)
SELECT 123, id, 1 FROM permissions WHERE key = 'reports.view';

-- Revoke a permission from a user
INSERT OR REPLACE INTO user_permissions (user_id, permission_id, granted)
SELECT 123, id, 0 FROM permissions WHERE key = 'users.manage';

-- Remove override (revert to role permissions)
DELETE FROM user_permissions WHERE user_id = 123 AND permission_id = ?;
```

### Repository Functions

```typescript
import { setUserPermission, removeUserPermission } from '../users/user.repository';

// Grant permission
setUserPermission(userId, permissionId, true);

// Revoke permission
setUserPermission(userId, permissionId, false);

// Remove override
removeUserPermission(userId, permissionId);
```

## Permission Checking

### Service Functions

```typescript
import { 
  hasPermission, 
  hasAnyPermission, 
  hasAllPermissions,
  hasRole,
  isAdmin 
} from '../shared/rbac';

const userContext = {
  id: user.id,
  roles: user.roles,
  permissions: user.permissions
};

// Check single permission
if (hasPermission(userContext, PERMISSIONS.SALES_REFUND)) {
  // Allow action
}

// Check any permission (OR logic)
if (hasAnyPermission(userContext, [PERMISSIONS.SALES_VIEW, PERMISSIONS.SALES_CREATE])) {
  // Allow action
}

// Check all permissions (AND logic)
if (hasAllPermissions(userContext, [PERMISSIONS.PRODUCTS_VIEW, PERMISSIONS.INVENTORY_VIEW])) {
  // Allow action
}

// Check role
if (hasRole(userContext, 'manager')) {
  // Allow action
}

// Check admin
if (isAdmin(userContext)) {
  // Allow action
}
```

## Validation

Validate RBAC configuration to ensure database matches code:

### Programmatic

```typescript
import { validateRBAC } from '../shared/rbac/rbac.validator';

const result = validateRBAC();

if (!result.valid) {
  console.error('RBAC errors:', result.errors);
}

if (result.warnings.length > 0) {
  console.warn('RBAC warnings:', result.warnings);
}
```

### CLI

```bash
# Validate configuration
npm run rbac:validate

# Sync database with code
npm run rbac:sync

# Sync and validate
npm run rbac:full
```

## Adding New Permissions

1. Add to `permissions.ts`:
```typescript
export const PERMISSIONS = {
  // ... existing
  NEW_FEATURE_VIEW: 'new_feature.view',
  NEW_FEATURE_MANAGE: 'new_feature.manage',
} as const;
```

2. Add to role definitions in `roles.ts`:
```typescript
[ROLES.MANAGER]: {
  // ... existing permissions
  permissions: [
    // ... existing
    PERMISSIONS.NEW_FEATURE_VIEW,
    PERMISSIONS.NEW_FEATURE_MANAGE,
  ],
},
```

3. Run sync:
```bash
npm run rbac:sync
```

4. Use in routes:
```typescript
router.get('/new-feature', requirePermission(PERMISSIONS.NEW_FEATURE_VIEW), handler);
```

## Adding New Roles

1. Add to `roles.ts`:
```typescript
export const ROLES = {
  // ... existing
  SUPERVISOR: 'supervisor',
} as const;

export const ROLE_DEFINITIONS: Record<RoleName, RoleDefinition> = {
  // ... existing
  [ROLES.SUPERVISOR]: {
    name: ROLES.SUPERVISOR,
    description: 'Supervises cashiers',
    permissions: [
      PERMISSIONS.SALES_VIEW,
      PERMISSIONS.SALES_CREATE,
      PERMISSIONS.REPORTS_VIEW,
    ],
  },
};
```

2. Run sync:
```bash
npm run rbac:sync
```

## Best Practices

1. **Always use constants:** Use `PERMISSIONS.USERS_VIEW` instead of `'users.view'`
2. **Validate regularly:** Run `npm run rbac:validate` in CI/CD
3. **Document changes:** Update role descriptions when changing permissions
4. **Use OR logic for flexibility:** `requirePermission([A, B])` allows either permission
5. **Admin bypass:** Admin role automatically has all permissions
6. **User overrides sparingly:** Use for exceptions, not as primary access control

## Security Notes

- Admin role bypasses all permission checks
- User-specific overrides take precedence over role permissions
- Sessions are invalidated when user roles/permissions change
- All permission checks are enforced server-side
- Frontend permission checks are for UX only (not security)

## Troubleshooting

### "Permission not found" error
Run `npm run rbac:sync` to sync permissions to database.

### "User-specific permissions not available"
Run migration `002_add_user_permissions.sql`.

### Permissions not updating
Check if sessions are being invalidated when permissions change.

### Validation warnings
Review warnings from `npm run rbac:validate` and sync if needed.
