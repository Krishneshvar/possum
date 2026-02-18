interface Category {
  id: number;
  name: string;
  subcategories?: Category[];
  [key: string]: any;
  depth?: number;
}

export const flattenCategories = (categories: Category[], result: Category[] = [], depth = 0): Category[] => {
  for (const category of categories) {
    result.push({ ...category, depth });
    if (category.subcategories && category.subcategories.length > 0) {
      flattenCategories(category.subcategories, result, depth + 1);
    }
  }
  return result;
};
