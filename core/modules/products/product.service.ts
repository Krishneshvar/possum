import { IProductRepository, ProductFilter } from './product.repository.interface.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const basePath = path.join(__dirname, '../../../../..');

let productRepository: IProductRepository;
let variantRepository: any;
let variantService: any;
let inventoryService: any;
let auditService: any;
let transaction: any;
let buildImageUrl: any;

export function initProductService(
    repo: IProductRepository,
    variantRepo: any,
    variantSvc: any,
    inventorySvc: any,
    auditSvc: any,
    txn: any,
    imgUrlBuilder: any
) {
    productRepository = repo;
    variantRepository = variantRepo;
    variantService = variantSvc;
    inventoryService = inventorySvc;
    auditService = auditSvc;
    transaction = txn;
    buildImageUrl = imgUrlBuilder;
}

interface CreateProductParams {
    name: string;
    description: string;
    category_id: number | null;
    status: 'active' | 'inactive' | 'discontinued';
    image_path: string | null;
    variants: any[];
    taxIds: number[];
    userId: number;
}

/**
 * Create a product with its variants (transactional)
 * @param {Object} productData - Product and variants data
 * @returns {Object} The created product ID
 */
export function createProductWithVariants({ name, description, category_id, status, image_path, variants, taxIds, userId }: CreateProductParams) {
    if (!variants || variants.length === 0) {
        throw new Error('At least one variant is required');
    }

    const tx = transaction(() => {
        const productInfo = productRepository.insertProduct({
            name, 
            description, 
            category_id: category_id || null, 
            tax_category_id: (taxIds && taxIds.length > 0) ? taxIds[0] : null,
            status, 
            image_path
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
                    userId: userId
                });
            }
        }

        // Log product creation
        auditService.logCreate(userId, 'products', newProductId, {
            name, description, category_id, status, image_path
        });

        return { id: newProductId };
    });

    return tx();
}

/**
 * Get a product with all its variants and taxes
 * @param {number} id - Product ID
 * @returns {Promise<Object|null>} Product with variants and taxes or null
 */
export async function getProductWithVariants(id: number) {
    const product = productRepository.findProductById(id);
    if (!product) return null;

    const variants = await productRepository.findProductWithVariants(id);
    const taxes = productRepository.findProductTaxes(id);

    return {
        ...product,
        ...variants,
        taxes,
        imageUrl: buildImageUrl(product.image_path)
    };
}

/**
 * Get paginated products list
 * @param {Object} params - Filter and pagination params
 * @returns {Promise<Object>} Products with imageUrls and pagination
 */
export async function getProducts(params: ProductFilter) {
    const productsData = await productRepository.findProducts(params);

    const productsWithImageUrls = productsData.products.map((product: any) => ({
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
export function updateProduct(productId: number, productData: any, newImagePath: string | undefined, userId: number) {
    const tx = transaction(() => {
        // Verify product exists
        const oldProduct = productRepository.findProductById(productId);
        if (!oldProduct) {
            throw new Error('Product not found');
        }

        // Handle image update
        if (newImagePath) {
            productData.image_path = newImagePath;
        }

        // Update product taxes if provided
        if (productData.taxIds !== undefined) {
            const taxCategoryId = (productData.taxIds && productData.taxIds.length > 0) ? productData.taxIds[0] : null;
            productData.tax_category_id = taxCategoryId;
            delete productData.taxIds;
        }

        // Update variants if provided
        if (productData.variants && Array.isArray(productData.variants)) {
            for (const variant of productData.variants) {
                if (variant.id) {
                    // Verify variant belongs to this product
                    const existingVariant = variantRepository.findVariantByIdSync(variant.id);
                    if (!existingVariant) {
                        throw new Error(`Variant ${variant.id} not found`);
                    }
                    if (existingVariant.product_id !== productId) {
                        throw new Error(`Variant ${variant.id} does not belong to product ${productId}`);
                    }
                    // Update existing variant
                    variantService.updateVariant({ id: variant.id, ...variant, userId });
                } else {
                    // Add new variant
                    variantService.addVariant({ productId, ...variant, userId });
                }
            }
            delete productData.variants;
        }

        const result = productRepository.updateProductById(productId, productData);

        // Delete old image after successful update
        if (newImagePath && oldProduct.image_path) {
            const oldImagePath = path.join(basePath, oldProduct.image_path);
            if (fs.existsSync(oldImagePath)) {
                try {
                    fs.unlinkSync(oldImagePath);
                } catch (err) {
                    console.error('Failed to delete old image:', err);
                }
            }
        }

        // Log product update
        if (result.changes > 0) {
            const newProduct = productRepository.findProductById(productId);
            auditService.logUpdate(userId, 'products', productId, oldProduct, newProduct);
        }

        return result;
    });

    return tx();
}

/**
 * Delete a product (soft delete with image cleanup)
 * @param {number} id - Product ID
 * @returns {Object} Delete result
 */
export function deleteProduct(id: number, userId: number) {
    const tx = transaction(() => {
        const oldProduct = productRepository.findProductById(id);
        if (!oldProduct) {
            throw new Error('Product not found');
        }

        const result = productRepository.softDeleteProduct(id);

        // Delete image after successful soft delete
        if (result.changes > 0 && oldProduct.image_path) {
            const filePath = path.join(basePath, oldProduct.image_path);
            if (fs.existsSync(filePath)) {
                try {
                    fs.unlinkSync(filePath);
                } catch (err) {
                    console.error('Failed to delete product image:', err);
                }
            }
        }

        // Log product deletion
        if (result.changes > 0) {
            auditService.logDelete(userId, 'products', id, oldProduct);
        }

        return result;
    });

    return tx();
}
