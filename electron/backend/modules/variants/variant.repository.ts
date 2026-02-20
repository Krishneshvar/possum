/**
 * Variant Repository
 * Handles all database operations for variants
 * Note: Stock is NEVER stored directly - it is derived from inventory_lots + inventory_adjustments
 */
import { getDB } from '../../shared/db/index.js';
import { getComputedStock, getComputedStockBatch } from '../../shared/utils/inventoryHelpers.js';
import { Variant } from '../../../../types/index.js';
import { ValidationError } from '../../shared/errors/index.js';

export interface VariantQueryOptions {
  searchTerm?: string;
  categoryId?: number;
  stockStatus?: 'low' | 'out' | 'ok' | string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC' | string;
  currentPage?: number;
  itemsPerPage?: number;
}

interface VariantInput {
  name: string;
  sku?: string | null;
  price: number;
  cost_price: number;
  stock_alert_cap?: number;
  is_default?: number;
  status?: string;
}

/**
 * Insert a new variant (without stock - stock comes from inventory operations)
 */
export function insertVariant(productId: number, variant: VariantInput) {
  if (!productId || !variant.name || variant.price == null || variant.cost_price == null) {
    throw new ValidationError('Product ID, name, price, and cost_price are required');
  }

  const db = getDB();
  const stmt = db.prepare(`
    INSERT INTO variants (
      product_id, name, sku, mrp, cost_price, stock_alert_cap, is_default, status
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  return stmt.run(
    productId,
    variant.name,
    variant.sku || null,
    variant.price,
    variant.cost_price,
    variant.stock_alert_cap ?? 10,
    variant.is_default ?? 0,
    variant.status ?? 'active'
  );
}

/**
 * Find all variants for a product with computed stock
 */
export async function findVariantsByProductId(productId: number): Promise<Variant[]> {
  const db = getDB();
  const variants = db.prepare(`
      SELECT
        id, product_id, name, sku, mrp as price, cost_price,
        stock_alert_cap, is_default, status, created_at, updated_at, deleted_at
      FROM variants
      WHERE product_id = ? AND deleted_at IS NULL
  `).all(productId) as Variant[];

  if (variants.length === 0) {
    return [];
  }

  const variantIds = variants.map(v => v.id!);
  const stockMap = await getComputedStockBatch(variantIds);

  return variants.map(variant => ({
    ...variant,
    stock: stockMap[variant.id!] ?? 0
  }));
}

/**
 * Find a single variant by ID with computed stock
 */
export async function findVariantById(id: number): Promise<Variant | null> {
  const db = getDB();
  const variant = db.prepare(`
      SELECT
        id, product_id, name, sku, mrp as price, cost_price,
        stock_alert_cap, is_default, status, created_at, updated_at, deleted_at
      FROM variants
      WHERE id = ? AND deleted_at IS NULL
  `).get(id) as Variant | undefined;

  if (!variant) {
    return null;
  }

  const stock = await getComputedStock(id);

  return {
    ...variant,
    stock
  };
}

/**
 * Find a single variant by ID synchronously (for validation)
 */
export function findVariantByIdSync(id: number): Omit<Variant, 'stock'> | null {
  const db = getDB();
  const variant = db.prepare(`
      SELECT
        id, product_id, name, sku, mrp as price, cost_price,
        stock_alert_cap, is_default, status, created_at, updated_at, deleted_at
      FROM variants
      WHERE id = ? AND deleted_at IS NULL
  `).get(id) as Variant | undefined;

  return variant || null;
}

/**
 * Update a variant (without stock - stock is derived)
 */
export function updateVariantById(variant: VariantInput & { id: number }) {
  if (!variant.id || !variant.name || variant.price == null || variant.cost_price == null) {
    throw new ValidationError('ID, name, price, and cost_price are required');
  }

  const db = getDB();
  const stmt = db.prepare(`
    UPDATE variants
    SET name = ?, sku = ?, mrp = ?, cost_price = ?, stock_alert_cap = ?, status = ?, is_default = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND deleted_at IS NULL
  `);
  
  return stmt.run(
    variant.name,
    variant.sku || null,
    variant.price,
    variant.cost_price,
    variant.stock_alert_cap ?? 10,
    variant.status ?? 'active',
    variant.is_default ?? 0,
    variant.id
  );
}

/**
 * Soft delete a variant
 */
export function softDeleteVariant(id: number) {
  const db = getDB();
  const stmt = db.prepare('UPDATE variants SET deleted_at = CURRENT_TIMESTAMP WHERE id = ? AND deleted_at IS NULL');
  return stmt.run(id);
}

/**
 * Find variants with filtering, pagination, and sorting
 */
export async function findVariants({ searchTerm, categoryId, stockStatus, sortBy = 'p.name', sortOrder = 'ASC', currentPage = 1, itemsPerPage = 10 }: VariantQueryOptions) {
  const db = getDB();
  const filterClauses: string[] = [];
  const filterParams: any[] = [];

  filterClauses.push(`v.deleted_at IS NULL`);
  filterClauses.push(`p.deleted_at IS NULL`);

  if (searchTerm) {
    filterClauses.push(`(p.name LIKE ? OR v.name LIKE ? OR v.sku LIKE ?)`);
    filterParams.push(`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`);
  }

  if (categoryId) {
    filterClauses.push(`p.category_id = ?`);
    filterParams.push(categoryId);
  }

  const whereClause = `WHERE ${filterClauses.join(' AND ')}`;

  let stockFilterClause = '';
  if (stockStatus === 'low') {
    stockFilterClause = 'WHERE current_stock <= stock_alert_cap AND current_stock > 0';
  } else if (stockStatus === 'out') {
    stockFilterClause = 'WHERE current_stock = 0';
  } else if (stockStatus === 'ok') {
    stockFilterClause = 'WHERE current_stock > stock_alert_cap';
  }

  const sortMap: Record<string, string> = {
    'p.name': 'product_name',
    'v.name': 'name',
    'v.sku': 'sku',
    'v.mrp': 'price',
    'price': 'price',
    'v.cost_price': 'cost_price',
    'v.created_at': 'created_at',
    'stock': 'stock'
  };

  const safeSortBy = sortMap[sortBy] || 'product_name';
  const safeSortOrder = (sortOrder || 'ASC').toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

  const isStockSort = safeSortBy === 'stock';
  const hasStockFilter = Boolean(stockStatus);

  if (!isStockSort && !hasStockFilter) {
    const countSql = `
      SELECT COUNT(*) as total
      FROM variants v
      JOIN products p ON v.product_id = p.id
      ${whereClause}
    `;
    const totalCount = (db.prepare(countSql).get(...filterParams) as any).total;

    const startIndex = (currentPage! - 1) * itemsPerPage!;
    const sql = `
      SELECT
        v.id, v.product_id, v.name, v.sku, v.mrp as price, v.cost_price,
        v.stock_alert_cap, v.is_default, v.status, v.created_at,
        p.name as product_name, p.image_path,
        p.tax_category_id,
        c.name as category_name
      FROM variants v
      JOIN products p ON v.product_id = p.id
      LEFT JOIN categories c ON p.category_id = c.id
      ${whereClause}
      ORDER BY ${safeSortBy} ${safeSortOrder}
      LIMIT ? OFFSET ?
    `;

    const variantsWithoutStock = db.prepare(sql).all(...filterParams, itemsPerPage, startIndex);

    const variantIds = variantsWithoutStock.map((v: any) => v.id);
    const stockMap = await getComputedStockBatch(variantIds);

    const variants = variantsWithoutStock.map((v: any) => ({
      ...v,
      stock: stockMap[v.id] ?? 0
    })) as Variant[];

    if (variants.length === 0) {
      return {
        variants: [],
        totalCount: 0,
        totalPages: 0
      };
    }

    return {
      variants,
      totalCount,
      totalPages: Math.ceil(totalCount / itemsPerPage!)
    };
  }

  const countSql = `
    SELECT COUNT(*) as total FROM (
      SELECT
        v.id,
        (
            COALESCE((SELECT SUM(quantity) FROM inventory_lots WHERE variant_id = v.id), 0)
            + COALESCE((SELECT SUM(quantity_change) FROM inventory_adjustments WHERE variant_id = v.id AND (reason != 'confirm_receive' OR lot_id IS NULL)), 0)
        ) AS current_stock,
        v.stock_alert_cap
      FROM variants v
      JOIN products p ON v.product_id = p.id
      ${whereClause}
    ) ${stockFilterClause}
  `;
  const totalCount = (db.prepare(countSql).get(...filterParams) as any).total;

  const startIndex = (currentPage! - 1) * itemsPerPage!;
  const sql = `
    SELECT * FROM (
      SELECT 
        v.id, v.product_id, v.name, v.sku, v.mrp as price, v.cost_price,
        v.stock_alert_cap, v.is_default, v.status, v.created_at,
        p.name as product_name, p.image_path,
        p.tax_category_id,
        c.name as category_name,
        (
            COALESCE((SELECT SUM(quantity) FROM inventory_lots WHERE variant_id = v.id), 0)
            + COALESCE((SELECT SUM(quantity_change) FROM inventory_adjustments WHERE variant_id = v.id AND (reason != 'confirm_receive' OR lot_id IS NULL)), 0)
        ) AS stock
      FROM variants v
      JOIN products p ON v.product_id = p.id
      LEFT JOIN categories c ON p.category_id = c.id
      ${whereClause}
    ) ${stockFilterClause === '' ? '' : stockFilterClause.replace(/current_stock/g, 'stock')}
    ORDER BY ${safeSortBy} ${safeSortOrder}
    LIMIT ? OFFSET ?
  `;

  const rows = db.prepare(sql).all(...filterParams, itemsPerPage, startIndex);

  const variants = rows.map((v: any) => ({
    ...v,
    stock: v.stock
  })) as Variant[];

  if (variants.length === 0) {
    return {
      variants: [],
      totalCount: 0,
      totalPages: 0
    };
  }

  return {
    variants,
    totalCount,
    totalPages: Math.ceil(totalCount / itemsPerPage!)
  };
}

/**
 * Get variant statistics
 */
export async function getVariantStats(): Promise<{
  totalVariants: number;
  lowStockVariants: number;
  inactiveVariants: number;
  avgStockLevel: number;
}> {
  const db = getDB();

  const sql = `
    SELECT 
      v.id,
      v.stock_alert_cap,
      v.status,
      (
        COALESCE((SELECT SUM(quantity) FROM inventory_lots WHERE variant_id = v.id), 0)
        + COALESCE((SELECT SUM(quantity_change) FROM inventory_adjustments WHERE variant_id = v.id AND (reason != 'confirm_receive' OR lot_id IS NULL)), 0)
      ) AS stock
    FROM variants v
    JOIN products p ON v.product_id = p.id
    WHERE v.deleted_at IS NULL AND p.deleted_at IS NULL
  `;

  const variants = db.prepare(sql).all() as Array<{ id: number; stock: number; stock_alert_cap: number; status: string }>;

  const totalVariants = variants.length;
  const lowStockVariants = variants.filter(v => v.stock <= v.stock_alert_cap && v.stock > 0).length;
  const inactiveVariants = variants.filter(v => v.status !== 'active').length;
  const avgStockLevel = totalVariants > 0
    ? Math.round(variants.reduce((sum, v) => sum + v.stock, 0) / totalVariants)
    : 0;

  return {
    totalVariants,
    lowStockVariants,
    inactiveVariants,
    avgStockLevel
  };
}
