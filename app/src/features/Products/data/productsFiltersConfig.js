export const stockStatusFilter = {
  key: "stockStatus",
  label: "Stock Status",
  placeholder: "Stock Status",
  options: [
    { value: "in-stock", label: "In Stock", color: "text-green-600" },
    { value: "low-stock", label: "Low Stock", color: "text-amber-600" },
    { value: "out-of-stock", label: "Out of Stock", color: "text-red-600" },
  ],
  badgeProps: {
    className: "bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100",
  },
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
  badgeProps: {
    className: "bg-green-50 text-green-700 border border-green-200 hover:bg-green-100",
  },
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
  badgeProps: {
    className: "bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100",
  },
});
