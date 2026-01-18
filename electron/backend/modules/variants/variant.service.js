/**
 * Variant Service
 * Contains business logic for variant operations
 */
import * as variantRepository from './variant.repository.js';
import { buildImageUrl } from '../../shared/utils/index.js';

/**
 * Add a variant to a product
 * @param {number} productId - Parent product ID
 * @param {Object} variantData - Variant data
 * @returns {Object} Insert result
 */
export function addVariant(productId, variantData) {
    return variantRepository.insertVariant(productId, variantData);
}

/**
 * Update a variant
 * @param {Object} variantData - Variant data with id
 * @returns {Object} Update result
 */
export function updateVariant(variantData) {
    return variantRepository.updateVariantById(variantData);
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
