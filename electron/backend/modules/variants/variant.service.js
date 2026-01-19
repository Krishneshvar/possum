/**
 * Variant Service
 * Contains business logic for variant operations
 */
import * as variantRepository from './variant.repository.js';
import * as inventoryService from '../inventory/inventory.service.js';
import * as inventoryRepository from '../inventory/inventory.repository.js';
import { transaction } from '../../shared/db/index.js';
import { buildImageUrl } from '../../shared/utils/index.js';

/**
 * Add a variant to a product
 * @param {number} productId - Parent product ID
 * @param {Object} variantData - Variant data
 * @returns {Object} Insert result
 */
export function addVariant(productId, variantData) {
    return transaction(() => {
        const result = variantRepository.insertVariant(productId, variantData);
        const variantId = Number(result.lastInsertRowid);

        if (variantData.stock && variantData.stock > 0) {
            inventoryService.receiveInventory({
                variantId,
                quantity: parseInt(variantData.stock, 10),
                unitCost: parseFloat(variantData.cost_price || 0),
                userId: variantData.userId || 1
            });
        }
        return result;
    });
}

/**
 * Update a variant
 * @param {Object} variantData - Variant data with id
 * @returns {Object} Update result
 */
export function updateVariant(variantData) {
    return transaction(() => {
        const result = variantRepository.updateVariantById(variantData);

        if (variantData.stock !== undefined) {
            const targetStock = parseInt(variantData.stock, 10);
            if (!isNaN(targetStock)) {
                const currentStock = inventoryRepository.getStockByVariantId(variantData.id);
                const diff = targetStock - currentStock;

                if (diff !== 0) {
                    inventoryService.adjustInventory({
                        variantId: variantData.id,
                        quantityChange: diff,
                        reason: 'correction',
                        userId: variantData.userId || 1
                    });
                }
            }
        }
        return result;
    });
}

/**
 * Delete a variant (soft delete)
 * @param {number} id - Variant ID
 * @returns {Object} Delete result
 */
export function deleteVariant(id) {
    return variantRepository.softDeleteVariant(id);
}

/**
 * Search variants
 * @param {Object} params - Search params
 * @returns {Array} Variants with image URLs
 */
export function searchVariants(params) {
    const variants = variantRepository.searchVariants(params);

    return variants.map(variant => ({
        ...variant,
        imageUrl: buildImageUrl(variant.image_path)
    }));
}
