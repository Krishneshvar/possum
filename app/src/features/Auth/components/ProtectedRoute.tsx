import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectIsAuthenticated, selectCurrentUser, selectAuthLoading } from '@/features/Auth/authSlice';

/**
 * ProtectedRoute component
 * Enforces authentication and authorization for routes
 * 
 * @param {React.ReactNode} children - The protected content
 * @param {string|string[]} requiredPermissions - Optional permissions needed
 * @param {string|string[]} requiredRoles - Optional roles needed
 * 
 * Note: Users with 'admin' role bypass all permission and role checks
 */
export default function ProtectedRoute({ children, requiredPermissions = [], requiredRoles = [] }: { children: React.ReactNode, requiredPermissions?: string | string[], requiredRoles?: string | string[] }) {
    const isAuthenticated = useSelector(selectIsAuthenticated);
    const user: any = useSelector(selectCurrentUser);
    const isLoading = useSelector(selectAuthLoading);
    const location = useLocation();

    // If still loading and has a token, show loading spinner
    if (isLoading && !isAuthenticated) {
        return (
            <div className="flex h-screen w-full items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!isAuthenticated) {
        // Redirect to login but save the current location
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Admin role bypasses all permission and role checks
    const isAdmin = user?.roles && user.roles.includes('admin');

    // Check permissions if required
    if (requiredPermissions.length > 0 && !isAdmin) {
        const permissions = Array.isArray(requiredPermissions) ? requiredPermissions : [requiredPermissions];
        // OR logic: user needs at least one of the required permissions
        const hasPermission = user?.permissions && permissions.some(p => user.permissions.includes(p));

        if (!hasPermission) {
            return <Navigate to="/" replace />; // Or a custom 403 Forbidden page
        }
    }

    // Check roles if required
    if (requiredRoles.length > 0 && !isAdmin) {
        const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
        const hasRole = user?.roles && roles.some((r: string) => user.roles.includes(r));

        if (!hasRole) {
            return <Navigate to="/" replace />;
        }
    }

    return <>{children}</>;
}
