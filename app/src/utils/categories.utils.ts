import type { Category } from '@shared/index.js';

export interface FlattenedCategory extends Category {
  depth: number;
}

export const flattenCategories = (
  categories: Category[], 
  result: FlattenedCategory[] = [], 
  depth = 0
): FlattenedCategory[] => {
  for (const category of categories) {
    result.push({ ...category, depth });
    if (category.subcategories && category.subcategories.length > 0) {
      flattenCategories(category.subcategories, result, depth + 1);
    }
  }
  return result;
};
