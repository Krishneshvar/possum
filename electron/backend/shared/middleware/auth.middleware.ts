import { Request, Response, NextFunction } from 'express';
import * as AuthService from '../../modules/auth/auth.service.js';
import { hasAnyPermission, isAdmin } from '../rbac/rbac.service.js';

// Extend Express Request
declare global {
  namespace Express {
    interface Request {
      user?: any;
      permissions?: string[];
      token?: string;
    }
  }
}

/**
 * Middleware to verify session token
 */
export function authenticate(req: Request, res: Response, next: NextFunction) {
    // Only skip auth for login endpoint
    if (req.path === '/auth/login') {
        return next();
    }

    const authHeader = req.headers['authorization'];
    if (!authHeader) {
        return res.status(401).json({ 
            error: 'Unauthorized: No token provided',
            code: 'NO_TOKEN'
        });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ 
            error: 'Unauthorized: Invalid token format',
            code: 'INVALID_TOKEN_FORMAT'
        });
    }

    const session = AuthService.getSession(token);
    if (!session) {
        return res.status(401).json({ 
            error: 'Unauthorized: Session expired or invalid',
            code: 'SESSION_INVALID'
        });
    }

    req.user = session;
    req.permissions = session.permissions;
    req.token = token;

    next();
}

/**
 * Middleware to require specific permission
 * Supports single string or array of strings (OR logic)
 * Note: Admin role bypasses all permission checks
 */
export function requirePermission(permission: string | string[]) {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.user || !req.permissions) {
            return res.status(401).json({ 
                error: 'Unauthorized: User not authenticated',
                code: 'NOT_AUTHENTICATED'
            });
        }

        const userContext = {
            id: (req.user as any).id,
            roles: (req.user as any).roles || [],
            permissions: req.permissions
        };
        
        const permissions = Array.isArray(permission) ? permission : [permission];
        const hasAccess = hasAnyPermission(userContext, permissions);

        if (!hasAccess) {
            return res.status(403).json({ 
                error: `Forbidden: Missing required permission (${permissions.join(' OR ')})`,
                code: 'INSUFFICIENT_PERMISSIONS'
            });
        }

        next();
    };
}

/**
 * Middleware to require specific role
 * Supports single string or array of strings (OR logic)
 */
export function requireRole(role: string | string[]) {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.user) {
            return res.status(401).json({ 
                error: 'Unauthorized: User not authenticated',
                code: 'NOT_AUTHENTICATED'
            });
        }

        const userRoles = (req.user as any).roles || [];
        const roles = Array.isArray(role) ? role : [role];
        const hasAccess = roles.some(r => userRoles.includes(r));

        if (!hasAccess) {
            return res.status(403).json({ 
                error: `Forbidden: Missing required role (${roles.join(' OR ')})`,
                code: 'INSUFFICIENT_ROLE'
            });
        }

        next();
    };
}

/**
 * Middleware to require admin role
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
    if (!req.user) {
        return res.status(401).json({ 
            error: 'Unauthorized: User not authenticated',
            code: 'NOT_AUTHENTICATED'
        });
    }

    const userContext = {
        id: (req.user as any).id,
        roles: (req.user as any).roles || [],
        permissions: req.permissions || []
    };

    if (!isAdmin(userContext)) {
        return res.status(403).json({ 
            error: 'Forbidden: Admin access required',
            code: 'ADMIN_REQUIRED'
        });
    }

    next();
}
