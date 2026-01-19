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
        console.error('Error fetching products:', err);
        res.status(500).json({ error: 'Failed to retrieve products.' });
    }
}

/**
 * POST /api/products
 * Create a new product with variants
 */
export async function createProductController(req, res) {
    const { name, category_id, description, status, variants, taxIds } = req.body;
    const image_path = req.file ? `/uploads/${req.file.filename}` : null;

    let parsedVariants;
    try {
        parsedVariants = typeof variants === 'string' ? JSON.parse(variants) : variants;
    } catch (e) {
        if (image_path) {
            fs.unlinkSync(path.join(basePath, image_path));
        }
        return res.status(400).json({ error: 'Invalid variants format.' });
    }

    let parsedTaxIds;
    try {
        parsedTaxIds = taxIds ? (typeof taxIds === 'string' ? JSON.parse(taxIds) : taxIds) : [];
    } catch (e) {
        parsedTaxIds = [];
    }

    if (!name || !parsedVariants || parsedVariants.length === 0) {
        if (image_path) {
            fs.unlinkSync(path.join(basePath, image_path));
        }
        return res.status(400).json({ error: 'Product name and at least one variant are required fields.' });
    }

    for (const variant of parsedVariants) {
        if (!variant.name) {
            if (image_path) {
                fs.unlinkSync(path.join(basePath, image_path));
            }
            return res.status(400).json({ error: 'Each variant must have a name.' });
        }
    }

    try {
        const newProduct = productService.createProductWithVariants({
            name,
            category_id: category_id || null,
            description: description || null,
            status: status || 'active',
            image_path,
            variants: parsedVariants,
            taxIds: parsedTaxIds,
        });
        res.status(201).json(newProduct);
    } catch (err) {
        console.error('Error creating product:', err);
        if (image_path) {
            try { fs.unlinkSync(path.join(basePath, image_path)); } catch (e) { /* ignore */ }
        }
        res.status(500).json({ error: 'Failed to create product.', details: err.message });
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
        console.error('Error fetching product details:', err);
        res.status(500).json({ error: 'Failed to retrieve product details.' });
    }
}

/**
 * PUT /api/products/:id
 * Update a product
 */
export async function updateProductController(req, res) {
    const { id } = req.params;
    const { name, category_id, description, status, variants, taxIds } = req.body;
    const image_path = req.file ? `/uploads/${req.file.filename}` : undefined;

    let parsedTaxIds;
    try {
        parsedTaxIds = taxIds !== undefined
            ? (typeof taxIds === 'string' ? JSON.parse(taxIds) : taxIds)
            : undefined;
    } catch (e) {
        parsedTaxIds = undefined;
    }

    let parsedVariants;
    try {
        parsedVariants = variants !== undefined
            ? (typeof variants === 'string' ? JSON.parse(variants) : variants)
            : undefined;
    } catch (e) {
        parsedVariants = undefined;
    }

    const productData = { name, category_id, description, status, variants: parsedVariants, taxIds: parsedTaxIds };

    try {
        const changes = productService.updateProduct(parseInt(id, 10), productData, image_path);
        if (changes.changes === 0) {
            if (image_path) {
                try { fs.unlinkSync(path.join(basePath, image_path)); } catch (e) { /* ignore */ }
            }
            return res.status(404).json({ error: 'Product not found or no changes made.' });
        }
        res.status(200).json({ message: 'Product updated successfully.' });
    } catch (err) {
        console.error('Error updating product:', err);
        if (image_path) {
            try { fs.unlinkSync(path.join(basePath, image_path)); } catch (e) { /* ignore */ }
        }
        res.status(500).json({ error: 'Failed to update product.', details: err.message });
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
        console.error('Error deleting product:', err);
        res.status(500).json({ error: 'Failed to delete product.' });
    }
}
