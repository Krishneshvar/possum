export const flattenCategories = (categories, result = []) => {
  for (const category of categories) {
    result.push(category);
    if (category.subcategories && category.subcategories.length > 0) {
      flattenCategories(category.subcategories, result);
    }
  }
  return result;
};
