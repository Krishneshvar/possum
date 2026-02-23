import * as productService from '../../../../packages/core/src/modules/products/index.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { Request, Response } from 'express';
import { getQueryNumber, getQueryString, getQueryArray } from '../../shared/utils/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// From dist/electron/backend/modules/products/ to root: 5 levels
const basePath = path.join(__dirname, '../../../../..');

/**
 * GET /api/products
 * Get paginated products list
 */
export async function getProductsController(req: Request, res: Response) {
    try {
        const {
            page,
            limit,
            searchTerm,
            stockStatus,
            status,
            categories,
            sortBy,
            sortOrder,
        } = req.query;

        const stockStatusArray = getQueryArray(stockStatus);
        const statusArray = getQueryArray(status);

        let categoryIds: any[] = [];
        if (categories) {
            categoryIds = Array.isArray(categories) ? categories : [categories];
            categoryIds = categoryIds.filter(id => id !== '');
        }

        const productsData = await productService.getProducts({
            searchTerm: getQueryString(searchTerm) || '',
            stockStatus: stockStatusArray,
            status: statusArray,
            categories: categoryIds,
            currentPage: getQueryNumber(page, 1) || 1,
            itemsPerPage: getQueryNumber(limit, 10) || 10,
            sortBy: getQueryString(sortBy) || 'name',
            sortOrder: getQueryString(sortOrder) || 'ASC',
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
export async function createProductController(req: Request, res: Response) {
    if (!req.user?.id) return res.status(401).json({ error: 'Unauthorized: No user session' });
    
    const { name, category_id, description, status, variants, taxIds } = req.body;
    const image_path = req.file ? `/uploads/${req.file.filename}` : null;

    let parsedVariants: any[];
    try {
        parsedVariants = typeof variants === 'string' ? JSON.parse(variants) : variants;
    } catch (e) {
        if (image_path) {
            fs.unlinkSync(path.join(basePath, image_path));
        }
        return res.status(400).json({ error: 'Invalid variants format.' });
    }

    let parsedTaxIds: any[];
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
        const userId = req.user.id;

        const newProduct = productService.createProductWithVariants({
            name,
            category_id: category_id ? parseInt(category_id, 10) : null,
            description: description || null,
            status: (status || 'active') as 'active' | 'inactive' | 'discontinued',
            image_path,
            variants: parsedVariants,
            taxIds: parsedTaxIds,
            userId
        });
        res.status(201).json(newProduct);
    } catch (err: any) {
        console.error('Error creating product:', err);
        if (image_path) {
            try { fs.unlinkSync(path.join(basePath, image_path)); } catch (e) { console.error('Failed to cleanup image:', e); }
        }
        res.status(500).json({ error: 'Failed to create product.', details: err.message });
    }
}

/**
 * GET /api/products/:id
 * Get product details with variants
 */
export async function getProductDetails(req: Request, res: Response) {
    const { id } = req.params;
    try {
        const product = await productService.getProductWithVariants(parseInt(id as string, 10));
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
export async function updateProductController(req: Request, res: Response) {
    if (!req.user?.id) return res.status(401).json({ error: 'Unauthorized: No user session' });
    
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

    const productData = { 
        name, 
        category_id: category_id !== undefined ? (category_id ? parseInt(category_id, 10) : null) : undefined, 
        description, 
        status, 
        variants: parsedVariants, 
        taxIds: parsedTaxIds 
    };

    try {
        const userId = req.user.id;
        const changes = productService.updateProduct(parseInt(id as string, 10), productData, image_path, userId);
        if (changes.changes === 0) {
            if (image_path) {
                try { fs.unlinkSync(path.join(basePath, image_path)); } catch (e) { console.error('Failed to cleanup image:', e); }
            }
            return res.status(404).json({ error: 'Product not found or no changes made.' });
        }
        res.status(200).json({ message: 'Product updated successfully.' });
    } catch (err: any) {
        console.error('Error updating product:', err);
        if (image_path) {
            try { fs.unlinkSync(path.join(basePath, image_path)); } catch (e) { console.error('Failed to cleanup image:', e); }
        }
        const statusCode = err.message === 'Product not found' ? 404 : 500;
        res.status(statusCode).json({ error: 'Failed to update product.', details: err.message });
    }
}

/**
 * DELETE /api/products/:id
 * Delete a product
 */
export async function deleteProductController(req: Request, res: Response) {
    if (!req.user?.id) return res.status(401).json({ error: 'Unauthorized: No user session' });
    
    const { id } = req.params;
    const productId = parseInt(id as string, 10);
    if (isNaN(productId)) {
        return res.status(400).json({ error: 'Invalid product ID.' });
    }

    try {
        const userId = req.user.id;
        const changes = productService.deleteProduct(productId, userId);
        if (changes.changes === 0) {
            return res.status(404).json({ error: 'Product not found.' });
        }
        res.status(204).end();
    } catch (err: any) {
        console.error('Error deleting product:', err);
        const statusCode = err.message === 'Product not found' ? 404 : 500;
        res.status(statusCode).json({ error: 'Failed to delete product.', details: err.message });
    }
}
