/**
 * Auth Service
 * Handles login, session management, and password security
 */
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import * as UserRepository from '../users/user.repository.js';
import * as SessionRepository from './session.repository.js';
import { User, Session } from '../../../../types/index.js';

const SESSION_DURATION_SECONDS = 30 * 60; // 30 minutes

// Pre-calculated hash for "password" (cost 10) to prevent timing attacks
// generated with: bcrypt.hash('password', 10)
const DUMMY_HASH = '$2b$10$InCX8UtTmhbQP3NuHPaRAeCdfZeaIngIzsAjWjbAYxjprs6WHcoAG';

/**
 * Hash password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
}

/**
 * Verify password using bcrypt
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash);
}

/**
 * Create a new session for a user
 */
function createSession(user: any): string {
    const token = uuidv4();
    const expiresAt = Math.floor(Date.now() / 1000) + SESSION_DURATION_SECONDS;

    const session: Session = {
        ...user,
        user_id: user.id,
        token,
        expires_at: expiresAt
    };

    SessionRepository.create(session);
    return token;
}

/**
 * Get session by token
 * Also handles expiration and auto-renewal
 */
export function getSession(token: string): any | null {
    if (!token) return null;

    const now = Math.floor(Date.now() / 1000);

    // Clean up expired sessions on every call for consistency
    SessionRepository.deleteExpired(now);

    const session = SessionRepository.findByToken(token);
    if (!session) return null;

    // Check expiration
    if (session.expires_at < now) {
        SessionRepository.deleteByToken(token);
        return null;
    }

    // Slide expiration on activity
    const newExpiresAt = now + SESSION_DURATION_SECONDS;
    SessionRepository.updateExpiration(token, newExpiresAt);

    // Update local object for immediate use
    session.expires_at = newExpiresAt;

    return session;
}

/**
 * End a session (logout)
 */
export function endSession(token: string): void {
    SessionRepository.deleteByToken(token);
}

/**
 * Login user and return token + user info
 */
export async function login(username: string, password: string): Promise<{ user: Partial<User>, token: string }> {
    const user = UserRepository.findUserByUsername(username);

    // Prevent timing attacks (username enumeration) by always verifying a password
    // even if the user does not exist.
    const userPasswordHash = (user && user.is_active !== 0 && !user.deleted_at) ? (user.password_hash || '') : DUMMY_HASH;

    const isValid = await verifyPassword(password, userPasswordHash);

    if (!user || user.is_active === 0 || user.deleted_at || !isValid) {
        throw new Error('Invalid username or password');
    }

    // Get permissions
    const permissions = UserRepository.getUserPermissions(user.id);
    const roles = UserRepository.getUserRoles(user.id).map(r => r.name);

    const userData: any = {
        id: user.id,
        name: user.name,
        username: user.username,
        roles, // string[]
        permissions
    };

    const token = createSession(userData);

    return {
        user: userData,
        token
    };
}

/**
 * Get current user from token (via session)
 */
export async function me(userId: number): Promise<Partial<User>> {
    const user = UserRepository.findUserById(userId);
    if (!user || user.is_active === 0) {
        throw new Error('User not found or inactive');
    }

    const permissions = UserRepository.getUserPermissions(user.id);
    const roles = UserRepository.getUserRoles(user.id).map(r => r.name);

    return {
        id: user.id,
        name: user.name,
        username: user.username,
        roles: roles as any,
        permissions
    };
}

/**
 * Clear all sessions
 */
export function clearAllSessions(): void {
    SessionRepository.deleteAll();
}

/**
 * Revoke all sessions for a specific user
 */
export function revokeUserSessions(userId: number): void {
    SessionRepository.deleteByUserId(userId);
}
