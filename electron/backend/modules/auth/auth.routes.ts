/**
 * Auth Routes
 */
import express from 'express';
import * as AuthController from './auth.controller.js';
import { authenticate } from '../../shared/middleware/auth.middleware.js';
import { loginRateLimiter } from '../../shared/middleware/rateLimit.middleware.js';

import { validate } from '../../shared/middleware/validate.middleware.js';
import { loginSchema } from './auth.schema.js';

const router = express.Router();

router.post('/login', loginRateLimiter, validate(loginSchema), AuthController.login);
router.post('/logout', authenticate, AuthController.logout);
router.get('/me', authenticate, AuthController.me);

export default router;
