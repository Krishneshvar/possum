import { Variant } from '../../../models/index.js';

export interface VariantQueryOptions {
  searchTerm?: string;
  categoryId?: number;
  categories?: (number | string)[];
  stockStatus?: 'low' | 'out' | 'ok' | string | string[];
  status?: 'active' | 'inactive' | 'discontinued' | string | string[];
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC' | string;
  currentPage?: number;
  itemsPerPage?: number;
}

export interface IVariantRepository {
  insertVariant(productId: number, variant: any): { lastInsertRowid: number | bigint };
  findVariantByIdSync(id: number): any;
  updateVariantById(variant: any): any;
  softDeleteVariant(id: number): any;
  findVariants(params: VariantQueryOptions): Promise<any>;
  getVariantStats(): Promise<any>;
}
