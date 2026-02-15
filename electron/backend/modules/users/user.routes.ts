/**
 * User Routes
 */
import { Router } from 'express';
import * as UserController from './user.controller.js';
import { requirePermission } from '../../shared/middleware/auth.middleware.js';

const router = Router();

router.get('/roles', requirePermission('users.manage'), UserController.getRoles);
router.get('/permissions', requirePermission('users.manage'), UserController.getPermissions);

router.get('/', requirePermission('users.manage'), UserController.getUsers);
router.get('/:id', requirePermission('users.manage'), UserController.getUserById);
router.post('/', requirePermission('users.manage'), UserController.createUser);
router.put('/:id', requirePermission('users.manage'), UserController.updateUser);
router.delete('/:id', requirePermission('users.manage'), UserController.deleteUser);

export default router;
