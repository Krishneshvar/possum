import { useSelector } from 'react-redux';
import { selectCurrentUser } from '@/features/Auth/authSlice';

/**
 * Hook to check if the current user has specific permissions
 * @param requiredPermissions - Single permission or array of permissions (OR logic)
 * @returns boolean indicating if user has the required permission(s)
 */
export function useHasPermission(requiredPermissions: string | string[]): boolean {
    const user = useSelector(selectCurrentUser);
    
    if (!user) return false;
    
    // Admin role bypasses all permission checks
    if (user.roles && user.roles.includes('admin')) {
        return true;
    }
    
    const permissions = Array.isArray(requiredPermissions) ? requiredPermissions : [requiredPermissions];
    
    // OR logic: user needs at least one of the required permissions
    return user.permissions ? permissions.some(p => user.permissions.includes(p)) : false;
}

/**
 * Hook to check if the current user has specific role
 * @param requiredRoles - Single role or array of roles (OR logic)
 * @returns boolean indicating if user has the required role(s)
 */
export function useHasRole(requiredRoles: string | string[]): boolean {
    const user = useSelector(selectCurrentUser);
    
    if (!user || !user.roles) return false;
    
    const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
    
    // OR logic: user needs at least one of the required roles
    return roles.some(r => user.roles.includes(r));
}

/**
 * Hook to get all user permissions
 * @returns array of permission strings
 */
export function useUserPermissions(): string[] {
    const user = useSelector(selectCurrentUser);
    return user?.permissions || [];
}

/**
 * Hook to get all user roles
 * @returns array of role strings
 */
export function useUserRoles(): string[] {
    const user = useSelector(selectCurrentUser);
    return user?.roles || [];
}
