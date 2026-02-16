import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectIsAuthenticated, selectCurrentUser, selectAuthLoading } from '@/features/Auth/authSlice';

/**
 * ProtectedRoute component
 * 
 * @param {React.ReactNode} children - The protected content
 * @param {string|string[]} requiredPermissions - Optional permissions needed
 * @param {string|string[]} requiredRoles - Optional roles needed
 */
export default function ProtectedRoute({ children, requiredPermissions = [], requiredRoles = [] }: { children: React.ReactNode, requiredPermissions?: string | string[], requiredRoles?: string | string[] }) {
    const isAuthenticated = useSelector(selectIsAuthenticated);
    const user: any = useSelector(selectCurrentUser);
    const isLoading = useSelector(selectAuthLoading);
    const location = useLocation();

    // If still loading and has a token, show nothing or a spinner
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

    // Check permissions if required
    if (requiredPermissions.length > 0) {
        // Allow admin role to bypass permission checks
        if (user?.roles && user.roles.includes('admin')) {
            return <>{children}</>;
        }

        const permissions = Array.isArray(requiredPermissions) ? requiredPermissions : [requiredPermissions];
        const hasPermission = user?.permissions && permissions.every(p => user.permissions.includes(p));

        if (!hasPermission) {
            return <Navigate to="/" replace />; // Or a custom 403 Forbidden page
        }
    }

    // Check roles if required
    if (requiredRoles.length > 0) {
        // Admin also bypasses role checks
        if (user?.roles && user.roles.includes('admin')) {
            return <>{children}</>;
        }

        const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
        const hasRole = user?.roles && roles.some((r: string) => user.roles.includes(r));

        if (!hasRole) {
            return <Navigate to="/" replace />;
        }
    }

    return <>{children}</>;
}
