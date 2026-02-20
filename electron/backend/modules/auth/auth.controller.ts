/**
 * Auth Controller
 */
import { Request, Response } from 'express';
import * as AuthService from './auth.service.js';
import * as AuditService from '../audit/audit.service.js';

export async function login(req: Request, res: Response) {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }

        const result = await AuthService.login(username, password);

        // Log the login event
        AuditService.logLogin(result.user.id!, {
            username: result.user.username,
            timestamp: new Date().toISOString()
        });

        res.json(result);
    } catch (error: any) {
        // Log failed login attempt
        const { username } = req.body;
        if (username) {
            AuditService.logAction(0, 'login_failed', 'auth', null, null, null, {
                username,
                timestamp: new Date().toISOString(),
                ip: req.ip || req.socket.remoteAddress
            });
        }
        res.status(401).json({ error: error.message });
    }
}

export async function me(req: Request, res: Response) {
    try {
        // userId is attached to req by auth middleware
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'User ID not found' });
        }

        const result = await AuthService.me(userId);
        res.json(result);
    } catch (error: any) {
        res.status(404).json({ error: error.message });
    }
}

export async function logout(req: Request, res: Response) {
    try {
        // userId and token are attached to req by auth middleware
        const userId = req.user?.id;
        const token = req.token;

        if (token) {
            AuthService.endSession(token);
        }

        if (userId) {
             AuditService.logLogout(userId, {
                timestamp: new Date().toISOString()
            });
        }

        res.json({ message: 'Logged out successfully' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
}
