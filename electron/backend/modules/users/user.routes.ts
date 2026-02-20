/**
 * User Routes
 */
import { Router } from 'express';
import * as UserController from './user.controller.js';
import { requirePermission } from '../../shared/middleware/auth.middleware.js';

import { validate } from '../../shared/middleware/validate.middleware.js';
import { createUserSchema, updateUserSchema, getUserIdSchema, getUsersSchema } from './user.schema.js';

const router = Router();

router.get('/roles', requirePermission('users.manage'), UserController.getRoles);
router.get('/permissions', requirePermission('users.manage'), UserController.getPermissions);

router.get('/', requirePermission('users.manage'), validate(getUsersSchema), UserController.getUsers);
router.get('/:id', requirePermission('users.manage'), validate(getUserIdSchema), UserController.getUserById);
router.post('/', requirePermission('users.manage'), validate(createUserSchema), UserController.createUser);
router.put('/:id', requirePermission('users.manage'), validate(updateUserSchema), UserController.updateUser);
router.delete('/:id', requirePermission('users.manage'), validate(getUserIdSchema), UserController.deleteUser);

export default router;
