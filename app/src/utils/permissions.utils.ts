/**
 * Permission-based sidebar filtering utility
 * Maps routes to required permissions
 */

export interface PermissionMap {
    [route: string]: string | string[];
}

// Define permission requirements for each route
export const routePermissions: PermissionMap = {
    '/': [], // Dashboard - accessible to all authenticated users
    '/dashboard': [],
    
    // Inventory
    '/products': ['products.view', 'products.manage'],
    '/variants': ['products.view', 'products.manage'],
    '/inventory': ['inventory.view', 'inventory.manage'],
    '/categories': ['categories.view', 'categories.manage'],
    
    // Commercial
    '/sales': ['sales.create'],
    '/sales/history': ['sales.view', 'sales.create'],
    '/transactions': ['transactions.view', 'sales.view'],
    '/returns': ['returns.view', 'returns.manage', 'sales.refund'],
    
    // Purchase
    '/purchase': ['purchase.view', 'purchase.manage'],
    '/suppliers': ['suppliers.view', 'suppliers.manage'],
    
    // People
    '/people': ['users.view', 'users.manage', 'customers.view', 'customers.manage'],
    '/customers': ['customers.view', 'customers.manage'],
    '/employees': ['users.view', 'users.manage'],
    
    // Reports & Logs
    '/reports/sales': ['reports.view'],
    '/audit-log': ['audit.view', 'users.manage'],
    
    // Settings & Plugins
    '/plugins': ['settings.manage'],
    '/settings': ['settings.view', 'settings.manage'],
    '/help': [], // Help is accessible to all
};

/**
 * Check if user has permission to access a route
 * @param route - The route path
 * @param userPermissions - Array of user's permissions
 * @param userRoles - Array of user's roles
 * @returns boolean indicating if user can access the route
 */
export function canAccessRoute(
    route: string,
    userPermissions: string[],
    userRoles: string[]
): boolean {
    // Admin role bypasses all checks
    if (userRoles.includes('admin')) {
        return true;
    }
    
    const requiredPermissions = routePermissions[route];
    
    // If no permissions required, allow access
    if (!requiredPermissions || requiredPermissions.length === 0) {
        return true;
    }
    
    // Convert to array if single permission
    const permissions = Array.isArray(requiredPermissions) 
        ? requiredPermissions 
        : [requiredPermissions];
    
    // OR logic: user needs at least one of the required permissions
    return permissions.some(p => userPermissions.includes(p));
}

/**
 * Filter sidebar items based on user permissions
 * @param items - Array of sidebar items
 * @param userPermissions - Array of user's permissions
 * @param userRoles - Array of user's roles
 * @returns Filtered array of sidebar items
 */
export function filterSidebarItems(
    items: any[],
    userPermissions: string[],
    userRoles: string[]
): any[] {
    return items
        .map(item => {
            // Check if user can access this item
            const canAccess = canAccessRoute(item.url, userPermissions, userRoles);
            
            if (!canAccess && (!item.items || item.items.length === 0)) {
                return null;
            }
            
            // If item has sub-items, filter them recursively
            if (item.items && item.items.length > 0) {
                const filteredSubItems = filterSidebarItems(item.items, userPermissions, userRoles);
                
                // If no sub-items remain after filtering, hide the parent
                if (filteredSubItems.length === 0) {
                    return null;
                }
                
                return {
                    ...item,
                    items: filteredSubItems
                };
            }
            
            return canAccess ? item : null;
        })
        .filter(item => item !== null);
}
