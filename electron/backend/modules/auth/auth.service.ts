/**
 * Auth Service
 * Handles login, session management, and password security
 */
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import * as UserRepository from '../users/user.repository.js';
import { User, Session } from '../../../../types/index.js';

// In-memory session store
const sessions = new Map<string, Session>();
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
        id: uuidv4(),
        user_id: user.id,
        token,
        expires_at: expiresAt,
        // Store flattened permissions/roles for quick access
        ...user
    };

    sessions.set(token, session);
    return token;
}

/**
 * Get session by token
 * Also handles expiration and auto-renewal (optional, strictly speaking just check valid)
 */
export function getSession(token: string): any | null {
    if (!token) return null;

    const session = sessions.get(token);
    if (!session) return null;

    // Check expiration
    if (session.expires_at < Math.floor(Date.now() / 1000)) {
        sessions.delete(token);
        return null;
    }

    // Slide expiration on activity? (Optional, usually good for UX)
    // requirement says "30-minute auto-logout", usually implies "inactivity timeout".
    session.expires_at = Math.floor(Date.now() / 1000) + SESSION_DURATION_SECONDS;
    sessions.set(token, session);

    return session;
}

/**
 * End a session (logout)
 */
export function endSession(token: string): void {
    sessions.delete(token);
}

/**
 * Login user and return token + user info
 */
export async function login(username: string, password: string): Promise<{ user: Partial<User>, token: string }> {
    const user = UserRepository.findUserByUsername(username);

    // Prevent timing attacks (username enumeration) by always verifying a password
    // even if the user does not exist.
    const userPasswordHash = (user && user.is_active !== 0) ? (user.password_hash || '') : DUMMY_HASH;

    const isValid = await verifyPassword(password, userPasswordHash);

    if (!user || user.is_active === 0 || !isValid) {
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
    // This function was used to refresh user data.
    // Now we can just use the session or re-fetch from DB if needed.
    // Assuming the caller has the token, they can just use getSession.
    // But if we need fresh data from DB:
    const user = UserRepository.findUserById(userId);
    if (!user) throw new Error('User not found');

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
 * Clear all sessions (on app restart if needed, though memory is cleared anyway)
 */
export function clearAllSessions(): void {
    sessions.clear();
}
