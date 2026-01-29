/**
 * Auth Routes
 */
import express from 'express';
import * as AuthController from './auth.controller.js';
import { authenticate } from '../../shared/middleware/auth.middleware.js';

const router = express.Router();

router.post('/login', AuthController.login);
router.post('/logout', authenticate, AuthController.logout);
router.get('/me', authenticate, AuthController.me);

export default router;
