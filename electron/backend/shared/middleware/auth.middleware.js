import * as AuthService from '../../modules/auth/auth.service.js';

/**
 * Middleware to verify session token
 */
export function authenticate(req, res, next) {
    if (req.path.startsWith('/auth/')) {
        return next();
    }

    const authHeader = req.headers['authorization'];
    if (!authHeader) {
        return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'Unauthorized: Invalid token format' });
    }

    const session = AuthService.getSession(token);
    if (!session) {
        return res.status(401).json({ error: 'Unauthorized: Session expired or invalid' });
    }

    req.user = session.user;
    req.permissions = session.permissions;
    req.token = token;

    next();
}

/**
 * Middleware to require specific permission
 * Supports single string or array of strings (OR logic)
 */
export function requirePermission(permission) {
    return (req, res, next) => {
        if (!req.user || !req.permissions) {
            return res.status(401).json({ error: 'Unauthorized: User not authenticated' });
        }

        const userPermissions = req.permissions;
        let hasAccess = false;

        if (Array.isArray(permission)) {
            hasAccess = permission.some(p => userPermissions.includes(p));
        } else {
            hasAccess = userPermissions.includes(permission);
        }

        if (!hasAccess) {
            return res.status(403).json({ error: `Forbidden: Missing required permission (${Array.isArray(permission) ? permission.join(' OR ') : permission})` });
        }

        next();
    };
}
