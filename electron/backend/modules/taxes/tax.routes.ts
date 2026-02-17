import { Router } from 'express';
import * as taxController from './tax.controller.js';
import { requirePermission } from '../../shared/middleware/auth.middleware.js';

const router = Router();

// Profiles
router.get('/profiles', requirePermission('settings.manage'), taxController.getTaxProfiles);
router.post('/profiles', requirePermission('settings.manage'), taxController.createTaxProfile);
router.put('/profiles/:id', requirePermission('settings.manage'), taxController.updateTaxProfile);
router.delete('/profiles/:id', requirePermission('settings.manage'), taxController.deleteTaxProfile);

// Categories
router.get('/categories', requirePermission('settings.manage'), taxController.getTaxCategories);
router.post('/categories', requirePermission('settings.manage'), taxController.createTaxCategory);
router.put('/categories/:id', requirePermission('settings.manage'), taxController.updateTaxCategory);
router.delete('/categories/:id', requirePermission('settings.manage'), taxController.deleteTaxCategory);

// Rules
router.get('/rules', requirePermission('settings.manage'), taxController.getTaxRules); // Expects ?profileId=
router.post('/rules', requirePermission('settings.manage'), taxController.createTaxRule);
router.put('/rules/:id', requirePermission('settings.manage'), taxController.updateTaxRule);
router.delete('/rules/:id', requirePermission('settings.manage'), taxController.deleteTaxRule);

// Calculation
router.post('/calculate', taxController.calculateTax);

export default router;
