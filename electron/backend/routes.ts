/**
 * Central Route Registration
 * All module routes are registered here
 */
import { Express } from 'express';
import productsRouter from './routes/products/product.routes.js';
import categoriesRouter from './routes/categories/category.routes.js';
import customersRouter from './routes/customers/customer.routes.js';
import inventoryRouter from './routes/inventory/inventory.routes.js';
import salesRouter from './routes/sales/sale.routes.js';
import returnsRouter from './routes/returns/return.routes.js';
import productFlowRouter from './routes/productFlow/productFlow.routes.js';
import reportsRouter from './routes/reports/reports.routes.js';
import taxesRouter from './routes/taxes/tax.routes.js';
import variantsRouter from './routes/variants/variant.routes.js';
import usersRouter from './routes/users/user.routes.js';
import suppliersRouter from './routes/suppliers/supplier.routes.js';
import purchaseRouter from './routes/purchase/purchase.routes.js';
import authRouter from './routes/auth/auth.routes.js';
import auditRouter from './routes/audit/audit.routes.js';
import transactionsRouter from './routes/transactions/transactions.routes.js';
import { getSaleReturnsController } from './routes/returns/return.controller.js';
import { authenticate, requirePermission } from './shared/middleware/auth.middleware.js';

/**
 * Register all routes on the Express app
 * @param {Express} app - Express application instance
 */
export function registerRoutes(app: Express) {
    // Auth
    app.use('/api/auth', authRouter);

    // Everything below requires authentication
    app.use('/api', authenticate);

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
    app.get('/api/sales/:saleId/returns', requirePermission('sales.refund'), getSaleReturnsController);

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

    // Audit Logs
    app.use('/api/audit', auditRouter);

    // Transactions
    app.use('/api/transactions', transactionsRouter);
}
