/**
 * Variant Service
 * Contains business logic for variant operations
 */
import * as variantRepository from './variant.repository.js';
import * as inventoryRepository from '../inventory/inventory.repository.js';
import * as auditService from '../audit/audit.service.js';
import { transaction } from '../../shared/db/index.js';
import { buildImageUrl } from '../../shared/utils/index.js';
import { VariantQueryOptions } from './variant.repository.js';
import { Variant, INVENTORY_REASONS } from '../../../../types/index.js';
import { ValidationError } from '../../shared/errors/index.js';
import { logger } from '../../shared/utils/logger.js';

interface AddVariantInput {
    productId: number;
    name: string;
    sku?: string | null;
    price: number;
    cost_price: number;
    stock_alert_cap?: number;
    is_default?: boolean;
    status?: 'active' | 'inactive' | 'discontinued';
    stock?: number;
    userId: number;
}

interface UpdateVariantInput {
    id: number;
    name: string;
    sku?: string | null;
    price: number;
    cost_price: number;
    stock_alert_cap?: number;
    is_default?: boolean;
    status?: 'active' | 'inactive' | 'discontinued';
    stock?: number;
    userId: number;
}

/**
 * Add a variant to a product
 */
export function addVariant(input: AddVariantInput) {
    if (!input.productId || !input.name || input.price == null || input.cost_price == null || !input.userId) {
        throw new ValidationError('Product ID, name, price, cost_price, and userId are required');
    }

    if (input.price < 0 || input.cost_price < 0) {
        throw new ValidationError('Price and cost_price must be non-negative');
    }

    const tx = transaction(() => {
        const result = variantRepository.insertVariant(input.productId, {
            name: input.name,
            sku: input.sku,
            price: input.price,
            cost_price: input.cost_price,
            stock_alert_cap: input.stock_alert_cap ?? 10,
            is_default: input.is_default ? 1 : 0,
            status: input.status ?? 'active'
        });
        const variantId = Number(result.lastInsertRowid);

        auditService.logCreate(input.userId, 'variants', variantId, {
            product_id: input.productId,
            name: input.name,
            sku: input.sku,
            price: input.price,
            cost_price: input.cost_price
        });

        if (input.stock && input.stock > 0) {
            const lotResult = inventoryRepository.insertInventoryLot({
                variant_id: variantId,
                quantity: parseInt(String(input.stock), 10),
                unit_cost: input.cost_price
            });
            const lotId = Number(lotResult.lastInsertRowid);

            inventoryRepository.insertInventoryAdjustment({
                variant_id: variantId,
                lot_id: lotId,
                quantity_change: parseInt(String(input.stock), 10),
                reason: INVENTORY_REASONS.CONFIRM_RECEIVE,
                adjusted_by: input.userId
            });

            logger.info(`Initial stock ${input.stock} added for variant ${variantId}`);
        }

        return result;
    });
    return tx();
}

/**
 * Update a variant
 */
export function updateVariant(input: UpdateVariantInput) {
    if (!input.id || !input.name || input.price == null || input.cost_price == null || !input.userId) {
        throw new ValidationError('ID, name, price, cost_price, and userId are required');
    }

    if (input.price < 0 || input.cost_price < 0) {
        throw new ValidationError('Price and cost_price must be non-negative');
    }

    const existing = variantRepository.findVariantByIdSync(input.id);
    if (!existing) {
        throw new ValidationError('Variant not found');
    }

    const tx = transaction(() => {
        const result = variantRepository.updateVariantById({
            id: input.id,
            name: input.name,
            sku: input.sku,
            price: input.price,
            cost_price: input.cost_price,
            stock_alert_cap: input.stock_alert_cap ?? 10,
            is_default: input.is_default ? 1 : 0,
            status: input.status ?? 'active'
        });

        auditService.logUpdate(input.userId, 'variants', input.id, existing, {
            name: input.name,
            sku: input.sku,
            price: input.price,
            cost_price: input.cost_price
        });

        if (input.stock !== undefined) {
            const targetStock = parseInt(String(input.stock), 10);
            if (!isNaN(targetStock) && targetStock >= 0) {
                const currentStock = inventoryRepository.getStockByVariantId(input.id);
                const diff = targetStock - currentStock;

                if (diff !== 0) {
                    inventoryRepository.insertInventoryAdjustment({
                        variant_id: input.id,
                        quantity_change: diff,
                        reason: INVENTORY_REASONS.CORRECTION,
                        adjusted_by: input.userId
                    });
                    logger.info(`Stock adjusted for variant ${input.id}: ${diff > 0 ? '+' : ''}${diff}`);
                }
            }
        }
        return result;
    });
    return tx();
}

/**
 * Delete a variant (soft delete)
 */
export function deleteVariant(id: number, userId: number) {
    if (!id || !userId) {
        throw new ValidationError('ID and userId are required');
    }

    const existing = variantRepository.findVariantByIdSync(id);
    if (!existing) {
        throw new ValidationError('Variant not found');
    }

    const result = variantRepository.softDeleteVariant(id);
    
    auditService.logDelete(userId, 'variants', id, existing);
    logger.info(`Variant ${id} soft deleted by user ${userId}`);
    
    return result;
}

/**
 * Get variants with filtering, pagination and sorting
 */
export async function getVariants(params: VariantQueryOptions) {
    const result = await variantRepository.findVariants(params);

    return {
        ...result,
        variants: result.variants.map((variant: any) => ({
            ...variant,
            taxes: variant.taxes ? JSON.parse(variant.taxes) : [],
            imageUrl: buildImageUrl(variant.image_path)
        }))
    };
}

/**
 * Get variant statistics
 */
export async function getVariantStats() {
    return await variantRepository.getVariantStats();
}
