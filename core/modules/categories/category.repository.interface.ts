import type { Category } from '../../../models/index.js';

export interface ICategoryRepository {
  findAllCategories(): Category[];
  findCategoryById(id: number): Category | undefined;
  insertCategory(name: string, parentId: number | null): Category;
  updateCategoryById(id: number, data: { name?: string; parentId?: number | null }): any;
  softDeleteCategory(id: number): any;
}
