import { getDB } from '../../electron/backend/shared/db/index.js';
import { Session } from '../../types/index.js';
import { v4 as uuidv4 } from 'uuid';
import type { ISessionRepository } from '../../core/index.js';

export class SessionRepository implements ISessionRepository {

    create(session: Session): void {
    const db = getDB();
    const { user_id, token, expires_at, ...rest } = session;

    if (!user_id) {
        throw new Error('user_id is required to create a session');
    }

    // Verify user exists and is active
    try {
        const userExists = db.prepare('SELECT id FROM users WHERE id = ? AND is_active = 1 AND deleted_at IS NULL').get(user_id);
        if (!userExists) {
            throw new Error(`Cannot create session for invalid or inactive user (user_id: ${user_id})`);
        }

        // Generate a unique ID for the session record itself
        const sessionId = uuidv4();

        // We store the full session data (including user's numeric id if present in rest)
        // in the 'data' JSON column to restore the object exactly as it was.
        const stmt = db.prepare(`
            INSERT INTO sessions (id, user_id, token, expires_at, data)
            VALUES (?, ?, ?, ?, ?)
        `);

        stmt.run(sessionId, user_id, token, expires_at, JSON.stringify(rest));
    } catch (error: any) {
        console.error('Session creation error:', error.message);
        console.error('user_id:', user_id, 'type:', typeof user_id);
        console.error('Session object:', JSON.stringify(session, null, 2));
        throw error;
    }
}

    findByToken(token: string): Session | null {
    const db = getDB();
    const row = db.prepare('SELECT * FROM sessions WHERE token = ?').get(token) as { id: string; user_id: number; token: string; expires_at: number; data: string | null; created_at: string } | undefined;

    if (!row) return null;

    const rest = row.data ? JSON.parse(row.data) : {};

    return {
        id: row.id,
        ...rest,
        user_id: row.user_id,
        token: row.token,
            expires_at: row.expires_at
        };
    }

    updateExpiration(token: string, newExpiresAt: number): void {
    const db = getDB();
        db.prepare('UPDATE sessions SET expires_at = ? WHERE token = ?').run(newExpiresAt, token);
    }

    deleteByToken(token: string): void {
    const db = getDB();
        db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
    }

    deleteExpired(now: number): void {
    const db = getDB();
        db.prepare('DELETE FROM sessions WHERE expires_at < ?').run(now);
    }

    deleteAll(): void {
    const db = getDB();
        db.prepare('DELETE FROM sessions').run();
    }

    deleteByUserId(userId: number): void {
        const db = getDB();
        db.prepare('DELETE FROM sessions WHERE user_id = ?').run(userId);
    }
}
