/**
 * Auth Service
 * Handles login, JWT generation and verification
 */
import crypto from 'crypto';
import * as UserRepository from '../users/user.repository.js';

const JWT_SECRET = process.env.JWT_SECRET || 'possum-super-secret-key-123';

/**
 * Base64Url Encoding helper
 */
function base64url(obj) {
    return Buffer.from(JSON.stringify(obj))
        .toString('base64')
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');
}

/**
 * Generate a manual JWT
 */
function generateToken(payload) {
    const header = { alg: 'HS256', typ: 'JWT' };
    const encodedHeader = base64url(header);
    const encodedPayload = base64url({
        ...payload,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
    });

    const signature = crypto
        .createHmac('sha256', JWT_SECRET)
        .update(`${encodedHeader}.${encodedPayload}`)
        .digest('base64url');

    return `${encodedHeader}.${encodedPayload}.${signature}`;
}

/**
 * Verify a manual JWT
 */
export function verifyToken(token) {
    try {
        const [header, payload, signature] = token.split('.');
        const expectedSignature = crypto
            .createHmac('sha256', JWT_SECRET)
            .update(`${header}.${payload}`)
            .digest('base64url');

        if (signature !== expectedSignature) return null;

        const decodedPayload = JSON.parse(Buffer.from(payload, 'base64url').toString());

        // Expired?
        if (decodedPayload.exp < Math.floor(Date.now() / 1000)) return null;

        return decodedPayload;
    } catch (e) {
        return null;
    }
}

/**
 * Hash password (consistent with user.service.js)
 */
function hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}

/**
 * Login user and return token + user info
 */
export async function login(username, password) {
    const user = UserRepository.findUserByUsername(username);
    if (!user || user.is_active === 0) {
        throw new Error('Invalid username or password');
    }

    const passwordHash = hashPassword(password);
    if (user.password_hash !== passwordHash) {
        throw new Error('Invalid username or password');
    }

    // Get permissions
    const permissions = UserRepository.getUserPermissions(user.id);
    const roles = UserRepository.getUserRoles(user.id).map(r => r.name);

    const userData = {
        id: user.id,
        name: user.name,
        username: user.username,
        roles,
        permissions
    };

    const token = generateToken(userData);

    return {
        user: userData,
        token
    };
}

/**
 * Get current user from token
 */
export async function me(userId) {
    const user = UserRepository.findUserById(userId);
    if (!user) throw new Error('User not found');

    const permissions = UserRepository.getUserPermissions(user.id);
    const roles = UserRepository.getUserRoles(user.id).map(r => r.name);

    return {
        id: user.id,
        name: user.name,
        username: user.username,
        roles,
        permissions
    };
}
