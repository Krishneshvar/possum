import { Router } from 'express';
import * as AuditController from './audit.controller.js';
import { requirePermission } from '../../shared/middleware/auth.middleware.js';

const router = Router();

router.get('/', requirePermission('MANAGE_USERS'), AuditController.getAuditLogs);

export default router;
