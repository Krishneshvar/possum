/**
 * Product Service
 * Contains business logic for product operations
 */
import * as productRepository from './product.repository.js';
import * as variantRepository from '../variants/variant.repository.js';
import { getDB } from '../../shared/db/index.js';
import { buildImageUrl } from '../../shared/utils/index.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const basePath = path.join(__dirname, '../../../..');

/**
 * Create a product with its variants (transactional)
 * @param {Object} productData - Product and variants data
 * @returns {Object} The created product ID
 */
export function createProductWithVariants({ name, description, category_id, status, product_tax, image_path, variants }) {
    const db = getDB();

    const transaction = db.transaction(() => {
        const productInfo = productRepository.insertProduct({
            name, description, category_id, status, product_tax, image_path
        });

        const newProductId = productInfo.lastInsertRowid;

        for (const variant of variants) {
            variantRepository.insertVariant(newProductId, variant);
        }

        return { id: newProductId };
    });

    return transaction();
}

/**
 * Get a product with all its variants
 * @param {number} id - Product ID
 * @returns {Object|null} Product with variants or null
 */
export function getProductWithVariants(id) {
    const product = productRepository.findProductById(id);
    if (!product) return null;

    const variants = variantRepository.findVariantsByProductId(id);
    return {
        ...product,
        variants,
        imageUrl: buildImageUrl(product.image_path)
    };
}

/**
 * Get paginated products list
 * @param {Object} params - Filter and pagination params
 * @returns {Object} Products with imageUrls and pagination
 */
export function getProducts(params) {
    const productsData = productRepository.findProducts(params);

    const productsWithImageUrls = productsData.products.map(product => ({
        ...product,
        imageUrl: buildImageUrl(product.image_path)
    }));

    return {
        ...productsData,
        products: productsWithImageUrls
    };
}

/**
 * Update a product
 * @param {number} productId - Product ID
 * @param {Object} productData - Updated product data
 * @param {string|undefined} newImagePath - New image path if uploaded
 * @returns {Object} Update result
 */
export function updateProduct(productId, productData, newImagePath) {
    // If new image is provided, delete old one
    if (newImagePath) {
        const oldProduct = productRepository.findProductById(productId);
        if (oldProduct && oldProduct.image_path) {
            const oldImagePath = path.join(basePath, oldProduct.image_path);
            if (fs.existsSync(oldImagePath)) {
                fs.unlinkSync(oldImagePath);
            }
        }
        productData.image_path = newImagePath;
    }

    return productRepository.updateProductById(productId, productData);
}

/**
 * Delete a product (soft delete with image cleanup)
 * @param {number} id - Product ID
 * @returns {Object} Delete result
 */
export function deleteProduct(id) {
    const product = productRepository.findProductImagePath(id);
    if (product && product.image_path) {
        const filePath = path.join(basePath, product.image_path);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    }

    return productRepository.softDeleteProduct(id);
}
