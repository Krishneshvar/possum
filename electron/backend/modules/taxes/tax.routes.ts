import { Router } from 'express';
import * as taxController from './tax.controller.js';

const router = Router();

// Profiles
router.get('/profiles', taxController.getTaxProfiles);
router.post('/profiles', taxController.createTaxProfile);
router.put('/profiles/:id', taxController.updateTaxProfile);
router.delete('/profiles/:id', taxController.deleteTaxProfile);

// Categories
router.get('/categories', taxController.getTaxCategories);
router.post('/categories', taxController.createTaxCategory);
router.put('/categories/:id', taxController.updateTaxCategory);
router.delete('/categories/:id', taxController.deleteTaxCategory);

// Rules
router.get('/rules', taxController.getTaxRules); // Expects ?profileId=
router.post('/rules', taxController.createTaxRule);
router.put('/rules/:id', taxController.updateTaxRule);
router.delete('/rules/:id', taxController.deleteTaxRule);

// Calculation
router.post('/calculate', taxController.calculateTax);

export default router;
