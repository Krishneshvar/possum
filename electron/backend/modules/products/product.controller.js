/**
 * Product Controller
 * Handles HTTP requests for products
 */
import * as productService from './product.service.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const basePath = path.join(__dirname, '../../../..');

/**
 * GET /api/products
 * Get paginated products list
 */
export async function getProductsController(req, res) {
    try {
        const {
            page = 1,
            limit = 10,
            searchTerm = '',
            stockStatus,
            status,
            categories
        } = req.query;

        const stockStatusArray = Array.isArray(stockStatus)
            ? stockStatus.filter(s => s !== '')
            : (stockStatus ? [stockStatus] : []);

        const statusArray = Array.isArray(status)
            ? status.filter(s => s !== '')
            : (status ? [status] : []);

        let categoryIds = [];
        if (categories) {
            categoryIds = Array.isArray(categories) ? categories : [categories];
            categoryIds = categoryIds.filter(id => id !== '');
        }

        const productsData = productService.getProducts({
            searchTerm,
            stockStatus: stockStatusArray,
            status: statusArray,
            categories: categoryIds,
            currentPage: parseInt(page, 10),
            itemsPerPage: parseInt(limit, 10)
        });

        res.json(productsData);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to retrieve products.' });
    }
}

/**
 * POST /api/products
 * Create a new product with variants
 */
export async function createProductController(req, res) {
    const { name, category_id, description, status, product_tax, variants } = req.body;
    const image_path = req.file ? `/uploads/${req.file.filename}` : null;

    const parsedVariants = JSON.parse(variants);

    if (!name || !parsedVariants || parsedVariants.length === 0) {
        if (image_path) {
            fs.unlinkSync(path.join(basePath, image_path));
        }
        return res.status(400).json({ error: 'Product name and at least one variant are required fields.' });
    }

    for (const variant of parsedVariants) {
        if (!variant.name) {
            return res.status(400).json({ error: 'Each variant must have a name.' });
        }
    }

    try {
        const newProduct = productService.createProductWithVariants({
            name,
            category_id,
            description,
            status,
            product_tax,
            image_path,
            variants: parsedVariants,
        });
        res.status(201).json(newProduct);
    } catch (err) {
        console.error(err);
        if (image_path) {
            fs.unlinkSync(path.join(basePath, image_path));
        }
        res.status(500).json({ error: 'Failed to create product.' });
    }
}

/**
 * GET /api/products/:id
 * Get product details with variants
 */
export async function getProductDetails(req, res) {
    const { id } = req.params;
    try {
        const product = productService.getProductWithVariants(parseInt(id, 10));
        if (!product) {
            return res.status(404).json({ error: 'Product not found.' });
        }
        res.json(product);
    } catch (err) {
        res.status(500).json({ error: 'Failed to retrieve product details.' });
    }
}

/**
 * PUT /api/products/:id
 * Update a product
 */
export async function updateProductController(req, res) {
    const { id } = req.params;
    const { name, category_id, description, status, product_tax } = req.body;
    const image_path = req.file ? `/uploads/${req.file.filename}` : undefined;

    const productData = { name, category_id, description, status, product_tax };

    try {
        const changes = productService.updateProduct(parseInt(id, 10), productData, image_path);
        if (changes.changes === 0) {
            if (image_path) {
                fs.unlinkSync(path.join(basePath, image_path));
            }
            return res.status(404).json({ error: 'Product not found or no changes made.' });
        }
        res.status(200).json({ message: 'Product updated successfully.' });
    } catch (err) {
        console.error(err);
        if (image_path) {
            fs.unlinkSync(path.join(basePath, image_path));
        }
        res.status(500).json({ error: 'Failed to update product.' });
    }
}

/**
 * DELETE /api/products/:id
 * Delete a product
 */
export async function deleteProductController(req, res) {
    const { id } = req.params;
    const productId = parseInt(id, 10);
    if (isNaN(productId)) {
        return res.status(400).json({ error: 'Invalid product ID.' });
    }

    try {
        const changes = productService.deleteProduct(productId);
        if (changes.changes === 0) {
            return res.status(404).json({ error: 'Product not found.' });
        }
        res.status(204).end();
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete product.' });
    }
}
