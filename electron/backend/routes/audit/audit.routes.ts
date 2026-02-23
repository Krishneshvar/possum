import { Router } from 'express';
import * as AuditController from './audit.controller.js';
import { requirePermission } from '../../shared/middleware/auth.middleware.js';

const router = Router();

router.get('/', requirePermission(['audit.view', 'users.manage']), AuditController.getAuditLogs);

export default router;
