/**
 * Central Route Registration
 * All module routes are registered here
 */
import productsRouter from './modules/products/product.routes.js';
import categoriesRouter from './modules/categories/category.routes.js';
import customersRouter from './modules/customers/customer.routes.js';
import inventoryRouter from './modules/inventory/inventory.routes.js';
import salesRouter from './modules/sales/sale.routes.js';
import returnsRouter from './modules/returns/return.routes.js';
import productFlowRouter from './modules/productFlow/productFlow.routes.js';
import reportsRouter from './modules/reports/reports.routes.js';
import taxesRouter from './modules/taxes/tax.routes.js';
import variantsRouter from './modules/variants/variant.routes.js';
import usersRouter from './modules/users/user.routes.js';
import suppliersRouter from './modules/suppliers/supplier.routes.js';
import purchaseRouter from './modules/purchase/purchase.routes.js';
import { getSaleReturnsController } from './modules/returns/return.controller.js';

/**
 * Register all routes on the Express app
 * @param {Express} app - Express application instance
 */
export function registerRoutes(app) {
    // Products & Categories
    app.use('/api/products', productsRouter);
    app.use('/api/categories', categoriesRouter);

    // Customers
    app.use('/api/customers', customersRouter);

    // Inventory
    app.use('/api/inventory', inventoryRouter);

    // Sales
    app.use('/api/sales', salesRouter);

    // Nested route: Get returns for a specific sale
    app.get('/api/sales/:saleId/returns', getSaleReturnsController);

    // Returns
    app.use('/api/returns', returnsRouter);

    // Product Flow Analysis
    app.use('/api/product-flow', productFlowRouter);

    // Reports
    app.use('/api/reports', reportsRouter);

    // Taxes
    app.use('/api/taxes', taxesRouter);

    // Variants
    app.use('/api/variants', variantsRouter);

    // Users
    app.use('/api/users', usersRouter);

    // Suppliers
    app.use('/api/suppliers', suppliersRouter);

    // Purchase Orders
    app.use('/api/purchase', purchaseRouter);
}
