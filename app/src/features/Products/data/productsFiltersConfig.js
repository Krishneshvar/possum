import { filterBadgeStyles } from '@/lib/styles';

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
