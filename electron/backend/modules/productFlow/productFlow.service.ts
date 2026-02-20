/**
 * Product Flow Service
 * Contains business logic for product flow analysis
 */
import * as productFlowRepository from './productFlow.repository.js';
import { FlowQueryOptions } from './productFlow.repository.js';
import { buildImageUrl } from '../../shared/utils/index.js';

/**
 * Get timeline of flow events for a variant
 * @param {number} variantId - Variant ID
 * @param {Object} options - Query options
 * @returns {Array} Flow events
 */
export function getVariantTimeline(variantId: number, options: FlowQueryOptions = {}) {
    return productFlowRepository.findFlowByVariantId(variantId, options);
}

/**
 * Get flow summary for a variant
 * @param {number} variantId - Variant ID
 * @returns {Object} Flow summary
 */
export function getVariantFlowSummary(variantId: number) {
    return productFlowRepository.getFlowSummary(variantId);
}

/**
 * Get flow events by reference
 * @param {string} referenceType - Reference type
 * @param {number} referenceId - Reference ID
 * @returns {Array} Flow events
 */
export function getFlowByReference(referenceType: string, referenceId: number) {
    return productFlowRepository.findFlowByReference(referenceType, referenceId);
}

/**
 * Log a product flow event
 * @param {Object} params - Flow event parameters
 * @returns {Object} Insert result
 */
export function logProductFlow({
    variantId,
    eventType,
    quantity,
    referenceType,
    referenceId
}: {
    variantId: number;
    eventType: string;
    quantity: number;
    referenceType?: string | null;
    referenceId?: number | null;
}) {
    return productFlowRepository.insertProductFlow({
        variant_id: variantId,
        event_type: eventType,
        quantity,
        reference_type: referenceType,
        reference_id: referenceId
    });
}
