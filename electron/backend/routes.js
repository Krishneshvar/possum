/**
 * Central Route Registration
 * All module routes are registered here
 */
import productsRouter from './modules/products/product.routes.js';
import categoriesRouter from './modules/categories/category.routes.js';

/**
 * Register all routes on the Express app
 * @param {Express} app - Express application instance
 */
export function registerRoutes(app) {
    app.use('/api/products', productsRouter);
    app.use('/api/categories', categoriesRouter);
}
