/**
 * Auth Middleware
 * Handles JWT verification and role/permission checks
 */
import { verifyToken } from '../../modules/auth/auth.service.js';

/**
 * Middleware to authenticate requests via JWT
 */
export function authenticate(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    if (!decoded) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Attach user info to request
    req.userId = decoded.id;
    req.username = decoded.username;
    req.userRoles = decoded.roles || [];
    req.userPermissions = decoded.permissions || [];

    next();
}

/**
 * Middleware to check for specific permissions
 * @param {string|string[]} permissions - Required permission key(s)
 */
export function authorize(permissions) {
    const required = Array.isArray(permissions) ? permissions : [permissions];

    return (req, res, next) => {
        if (!req.userPermissions) {
            return res.status(403).json({ error: 'Forbidden: No permissions assigned' });
        }

        const hasPermission = required.every(p => req.userPermissions.includes(p));

        if (!hasPermission) {
            return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
        }

        next();
    };
}
