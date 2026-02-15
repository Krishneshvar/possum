/**
 * User Routes
 */
import { Router } from 'express';
import * as UserController from './user.controller.js';
import { requirePermission } from '../../shared/middleware/auth.middleware.js';

const router = Router();

router.get('/roles', requirePermission('MANAGE_USERS'), UserController.getRoles);
router.get('/permissions', requirePermission('MANAGE_USERS'), UserController.getPermissions);

router.get('/', requirePermission('MANAGE_USERS'), UserController.getUsers);
router.get('/:id', requirePermission('MANAGE_USERS'), UserController.getUserById);
router.post('/', requirePermission('MANAGE_USERS'), UserController.createUser);
router.put('/:id', requirePermission('MANAGE_USERS'), UserController.updateUser);
router.delete('/:id', requirePermission('MANAGE_USERS'), UserController.deleteUser);

export default router;
