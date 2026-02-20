import { Request, Response, NextFunction } from 'express';
import * as AuthService from '../../modules/auth/auth.service.js';

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

        const userPermissions = req.permissions!;
        const userRoles = (req.user as any).roles || [];
        
        // Admin role bypasses all permission checks
        if (userRoles.includes('admin')) {
            return next();
        }

        let hasAccess = false;

        if (Array.isArray(permission)) {
            hasAccess = permission.some(p => userPermissions.includes(p));
        } else {
            hasAccess = userPermissions.includes(permission);
        }

        if (!hasAccess) {
            return res.status(403).json({ 
                error: `Forbidden: Missing required permission (${Array.isArray(permission) ? permission.join(' OR ') : permission})`,
                code: 'INSUFFICIENT_PERMISSIONS'
            });
        }

        next();
    };
}
