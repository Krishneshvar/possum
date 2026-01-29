/**
 * Auth Controller
 */
import * as AuthService from './auth.service.js';
import * as AuditService from '../audit/audit.service.js';

export async function login(req, res) {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }

        const result = await AuthService.login(username, password);

        // Log the login event
        AuditService.logLogin(result.user.id, {
            username: result.user.username,
            timestamp: new Date().toISOString()
        });

        res.json(result);
    } catch (error) {
        res.status(401).json({ error: error.message });
    }
}

export async function me(req, res) {
    try {
        // userId is attached to req by auth middleware
        const result = await AuthService.me(req.userId);
        res.json(result);
    } catch (error) {
        res.status(404).json({ error: error.message });
    }
}

export async function logout(req, res) {
    try {
        // userId is attached to req by auth middleware
        AuditService.logLogout(req.userId, {
            timestamp: new Date().toISOString()
        });

        res.json({ message: 'Logged out successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

