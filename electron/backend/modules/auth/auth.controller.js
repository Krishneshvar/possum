/**
 * Auth Controller
 */
import * as AuthService from './auth.service.js';

export async function login(req, res) {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }

        const result = await AuthService.login(username, password);
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
