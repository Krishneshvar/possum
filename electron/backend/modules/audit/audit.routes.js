/**
 * Audit Routes
 */
import express from 'express';
import * as auditController from './audit.controller.js';
import { authenticate } from '../../shared/middleware/auth.middleware.js';

const router = express.Router();

// All audit routes require authentication
router.get('/', authenticate, auditController.getAuditLogs);

export default router;
