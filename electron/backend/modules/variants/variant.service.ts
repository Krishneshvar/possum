/**
 * Variant Service
 * Contains business logic for variant operations
 */
import * as variantRepository from './variant.repository.js';
import * as inventoryService from '../inventory/inventory.service.js';
import * as inventoryRepository from '../inventory/inventory.repository.js';
import { transaction } from '../../shared/db/index.js';
import { buildImageUrl } from '../../shared/utils/index.js';
import { VariantQueryOptions } from './variant.repository.js';
import { Variant } from '../../../../types/index.js';

/**
 * Add a variant to a product
 * @param {number} productId - Parent product ID
 * @param {Object} variantData - Variant data
 * @returns {Object} Insert result
 */
export function addVariant(productId: number, variantData: Partial<Variant> & { stock?: number; userId?: number }) {
    const tx = transaction(() => {
        const result = variantRepository.insertVariant(productId, variantData);
        const variantId = Number(result.lastInsertRowid);

        if (variantData.stock && variantData.stock > 0) {
            inventoryService.receiveInventory({
                variantId,
                quantity: parseInt(String(variantData.stock), 10),
                unitCost: parseFloat(String(variantData.cost_price || 0)),
                userId: variantData.userId || 1
            });
        }
        return result;
    });
    return tx();
}

/**
 * Update a variant
 * @param {Object} variantData - Variant data with id
 * @returns {Object} Update result
 */
export function updateVariant(variantData: Partial<Variant> & { id: number; stock?: number; userId?: number }) {
    const tx = transaction(() => {
        const result = variantRepository.updateVariantById(variantData);

        if (variantData.stock !== undefined) {
            const targetStock = parseInt(String(variantData.stock), 10);
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
    return tx();
}

/**
 * Delete a variant (soft delete)
 * @param {number} id - Variant ID
 * @returns {Object} Delete result
 */
export function deleteVariant(id: number) {
    return variantRepository.softDeleteVariant(id);
}

/**
 * Get variants with filtering, pagination and sorting
 * @param {Object} params - Query parameters
 * @returns {Object} Paginated variants with image URLs
 */
export function getVariants(params: VariantQueryOptions) {
    const result = variantRepository.findVariants(params);

    return {
        ...result,
        variants: result.variants.map(variant => ({
            ...variant,
            taxes: variant.taxes ? JSON.parse(variant.taxes) : [],
            imageUrl: buildImageUrl(variant.image_path)
        }))
    };
}
