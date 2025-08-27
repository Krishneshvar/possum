import { filterBadgeStyles } from '@/lib/styles';

export const stockStatusFilter = {
  key: "stockStatus",
  label: "Stock Status",
  placeholder: "Stock Status",
  options: [
    { value: "in-stock", label: "In Stock", color: "text-green-600" },
    { value: "low-stock", label: "Low Stock", color: "text-amber-600" },
    { value: "out-of-stock", label: "Out of Stock", color: "text-red-600" },
  ],
  badgeProps: { className: filterBadgeStyles.stockStatus },
};

export const statusFilter = {
  key: "status",
  label: "Product Status",
  placeholder: "Status",
  options: [
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
    { value: "discontinued", label: "Discontinued" },
  ],
  badgeProps: { className: filterBadgeStyles.productStatus },
};

export const categoryFilter = (categories) => ({
  key: "categories",
  label: "Categories",
  placeholder: "Categories",
  options: categories.map((cat) => ({
    value: String(cat.id ?? cat.category_id),
    label: cat.name ?? String(cat.id ?? cat.category_id),
    color: "text-muted-foreground",
  })),
  badgeProps: { className: filterBadgeStyles.categories },
});
