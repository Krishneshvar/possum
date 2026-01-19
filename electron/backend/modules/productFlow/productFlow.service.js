/**
 * Product Flow Service
 * Contains business logic for product flow analysis
 */
import * as productFlowRepository from './productFlow.repository.js';
import { buildImageUrl } from '../../shared/utils/index.js';

/**
 * Get timeline of flow events for a variant
 * @param {number} variantId - Variant ID
 * @param {Object} options - Query options
 * @returns {Array} Flow events
 */
export function getVariantTimeline(variantId, options = {}) {
    return productFlowRepository.findFlowByVariantId(variantId, options);
}

/**
 * Get flow summary for a variant
 * @param {number} variantId - Variant ID
 * @returns {Object} Flow summary
 */
export function getVariantFlowSummary(variantId) {
    return productFlowRepository.getFlowSummary(variantId);
}

/**
 * Get flow events by reference
 * @param {string} referenceType - Reference type
 * @param {number} referenceId - Reference ID
 * @returns {Array} Flow events
 */
export function getFlowByReference(referenceType, referenceId) {
    return productFlowRepository.findFlowByReference(referenceType, referenceId);
}
