/**
 * Product Service
 * Contains business logic for product operations
 */
import * as productRepository from './product.repository.js';
import * as variantRepository from '../variants/variant.repository.js';
import * as variantService from '../variants/variant.service.js';
import * as inventoryService from '../inventory/inventory.service.js';
import { transaction } from '../../shared/db/index.js';
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
export function createProductWithVariants({ name, description, category_id, status, image_path, variants, taxIds }) {
    return transaction(() => {
        const productInfo = productRepository.insertProduct({
            name, description, category_id, status, image_path
        });

        const newProductId = Number(productInfo.lastInsertRowid);

        for (const variant of variants) {
            const variantResult = variantRepository.insertVariant(newProductId, variant);
            const variantId = Number(variantResult.lastInsertRowid);

            // If initial stock is provided, receive it
            if (variant.stock && variant.stock > 0) {
                inventoryService.receiveInventory({
                    variantId,
                    quantity: parseInt(variant.stock, 10),
                    unitCost: parseFloat(variant.cost_price || 0),
                    userId: variant.userId || 1 // Fallback to user 1
                });
            }
        }

        // Set product taxes if provided
        if (taxIds && taxIds.length > 0) {
            productRepository.setProductTaxes(newProductId, taxIds);
        }

        return { id: newProductId };
    });
}

/**
 * Get a product with all its variants and taxes
 * @param {number} id - Product ID
 * @returns {Object|null} Product with variants and taxes or null
 */
export function getProductWithVariants(id) {
    const product = productRepository.findProductById(id);
    if (!product) return null;

    const variants = variantRepository.findVariantsByProductId(id);
    const taxes = productRepository.findProductTaxes(id);

    return {
        ...product,
        variants,
        taxes,
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
    return transaction(() => {
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

        // Update product taxes if provided
        if (productData.taxIds !== undefined) {
            productRepository.setProductTaxes(productId, productData.taxIds || []);
            delete productData.taxIds;
        }

        // Update variants if provided
        if (productData.variants && Array.isArray(productData.variants)) {
            for (const variant of productData.variants) {
                if (variant.id) {
                    // Update existing variant (including stock adjustment in variantService)
                    variantService.updateVariant(variant);
                } else {
                    // Add new variant
                    variantService.addVariant(productId, variant);
                }
            }
            delete productData.variants;
        }

        return productRepository.updateProductById(productId, productData);
    });
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
