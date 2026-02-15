import { Request, Response, NextFunction } from 'express';

interface RateLimitRecord {
    count: number;
    resetTime: number;
}

// In-memory store for rate limiting
// Note: This resets on server restart, which is acceptable for an Electron app
const loginAttempts = new Map<string, RateLimitRecord>();

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Rate limiter middleware for login attempts
 * Prevents brute-force attacks by limiting attempts per IP address
 */
export function loginRateLimiter(req: Request, res: Response, next: NextFunction) {
    // In a local Electron app, req.ip might be ::1 or 127.0.0.1
    // This effectively limits attempts from the machine itself,
    // which protects against automated scripts running locally.
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();

    let record = loginAttempts.get(ip);

    // If no record exists or the window has passed, reset the counter
    if (!record || now > record.resetTime) {
        record = { count: 0, resetTime: now + WINDOW_MS };
        loginAttempts.set(ip, record);
    }

    // Check if limit exceeded
    if (record.count >= MAX_ATTEMPTS) {
        const timeLeft = Math.ceil((record.resetTime - now) / 1000);
        return res.status(429).json({
            error: `Too many login attempts. Please try again in ${timeLeft} seconds.`
        });
    }

    // Increment attempt counter
    record.count++;
    next();
}
