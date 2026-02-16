interface Category {
  subcategories?: Category[];
  [key: string]: any;
}

export const flattenCategories = (categories: Category[], result: Category[] = []) => {
  for (const category of categories) {
    result.push(category);
    if (category.subcategories && category.subcategories.length > 0) {
      flattenCategories(category.subcategories, result);
    }
  }
  return result;
};
