import { Package, Layers, AlertTriangle, XCircle } from "lucide-react";

export const stockStatusFilter = {
  key: "stockStatus",
  type: "radio",
  label: "Stock Status",
  placeholder: "Filter by stock",
  options: [
    { value: "all", label: "All Stock", color: "text-muted-foreground" },
    { value: "in-stock", label: "In Stock", color: "text-green-600" },
    { value: "low-stock", label: "Low Stock", color: "text-amber-600" },
    { value: "out-of-stock", label: "Out of Stock", color: "text-red-600" },
  ],
  badgeProps: {
    className: "bg-green-50 text-green-700 border border-green-200 hover:bg-green-100",
  },
};

export const statusFilter = {
  key: "status",
  type: "radio",
  label: "Product Status",
  placeholder: "Filter by status",
  options: [
    { value: "all", label: "All Status" },
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
    { value: "discontinued", label: "Discontinued" },
  ],
  badgeProps: {
    className: "bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100",
  },
};

export const categoryFilter = (categories) => ({
  key: "categories",
  type: "checkbox",
  label: "Categories",
  placeholder: "Categories",
  options: categories.map((cat) => ({
    value: String(cat.id ?? cat.category_id),
    label: cat.name ?? String(cat.id ?? cat.category_id),
    color: "text-purple-600",
  })),
  badgeProps: {
    className: "bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100",
  },
});
