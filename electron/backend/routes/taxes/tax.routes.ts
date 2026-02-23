import { Router } from 'express';
import * as taxController from './tax.controller.js';
import { requirePermission } from '../../shared/middleware/auth.middleware.js';

const router = Router();

// Profiles
router.get('/profiles', requirePermission(['settings.view', 'settings.manage']), taxController.getTaxProfiles);
router.post('/profiles', requirePermission('settings.manage'), taxController.createTaxProfile);
router.put('/profiles/:id', requirePermission('settings.manage'), taxController.updateTaxProfile);
router.delete('/profiles/:id', requirePermission('settings.manage'), taxController.deleteTaxProfile);

// Categories
router.get('/categories', requirePermission(['settings.view', 'settings.manage']), taxController.getTaxCategories);
router.post('/categories', requirePermission('settings.manage'), taxController.createTaxCategory);
router.put('/categories/:id', requirePermission('settings.manage'), taxController.updateTaxCategory);
router.delete('/categories/:id', requirePermission('settings.manage'), taxController.deleteTaxCategory);

// Rules
router.get('/rules', requirePermission(['settings.view', 'settings.manage']), taxController.getTaxRules); // Expects ?profileId=
router.post('/rules', requirePermission('settings.manage'), taxController.createTaxRule);
router.put('/rules/:id', requirePermission('settings.manage'), taxController.updateTaxRule);
router.delete('/rules/:id', requirePermission('settings.manage'), taxController.deleteTaxRule);

// Calculation - requires sales permission since it's used during sales
router.post('/calculate', requirePermission('sales.create'), taxController.calculateTax);

export default router;
