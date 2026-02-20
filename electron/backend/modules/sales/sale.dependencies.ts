/**
 * Sale Dependencies
 * Abstraction layer for cross-module dependencies
 * Provides interface contracts to reduce tight coupling
 */
import type { Variant, Product, Customer } from '../../../../types/index.js';

// Repository imports - encapsulated
import { findVariantById } from '../variants/variant.repository.js';
import { findProductById } from '../products/product.repository.js';
import { findCustomerById } from '../customers/customer.repository.js';
import { paymentMethodExists } from './sale.repository.js';
import { getStockByVariantId } from '../inventory/inventory.repository.js';

/**
 * Fetch multiple variants in batch
 * @returns Map of variant ID to Variant object
 */export async function fetchVariantsBatch(variantIds: number[]): Promise<Map<number, Variant>> {
    const variantPromises = variantIds.map(id => findVariantById(id));
    const variantsList = await Promise.all(variantPromises);
    
    const variantMap = new Map<number, Variant>();
    variantsList.forEach(v => {
        if (v) variantMap.set(v.id!, v);
    });
    
    return variantMap;
}

export function fetchProductById(productId: number): Product | null {
    return findProductById(productId) || null;
}

export function fetchCustomerById(customerId: number): Customer | null {
    return findCustomerById(customerId) || null;
}

export function validatePaymentMethod(paymentMethodId: number): boolean {
    return paymentMethodExists(paymentMethodId);
}

export function getVariantStock(variantId: number): number {
    return getStockByVariantId(variantId);
}
