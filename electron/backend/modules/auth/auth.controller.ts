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
            return res.status(400).json({ 
                error: 'Username and password are required',
                code: 'MISSING_CREDENTIALS'
            });
        }

        const result = await AuthService.login(username, password);

        AuditService.logLogin(result.user.id, {
            username: result.user.username,
            ip: req.ip || req.socket.remoteAddress || 'unknown',
            timestamp: new Date().toISOString()
        });

        res.json(result);
    } catch (error: any) {
        const { username } = req.body;
        if (username) {
            AuditService.logAction(0, 'login_failed', 'auth', null, null, null, {
                username,
                ip: req.ip || req.socket.remoteAddress || 'unknown',
                timestamp: new Date().toISOString()
            });
        }
        res.status(401).json({ 
            error: error.message,
            code: 'AUTHENTICATION_FAILED'
        });
    }
}

export async function me(req: Request, res: Response) {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ 
                error: 'User ID not found',
                code: 'UNAUTHORIZED'
            });
        }

        const result = await AuthService.me(userId);
        res.json(result);
    } catch (error: any) {
        res.status(404).json({ 
            error: error.message,
            code: 'USER_NOT_FOUND'
        });
    }
}

export async function logout(req: Request, res: Response) {
    try {
        const userId = req.user?.id;
        const token = req.token;

        if (token) {
            AuthService.endSession(token);
        }

        if (userId) {
            AuditService.logLogout(userId, {
                ip: req.ip || req.socket.remoteAddress || 'unknown',
                timestamp: new Date().toISOString()
            });
        }

        res.json({ message: 'Logged out successfully' });
    } catch (error: any) {
        res.status(500).json({ 
            error: error.message,
            code: 'LOGOUT_FAILED'
        });
    }
}
