export const productStatusBadges = {
  active: {
    text: "Active",
    className: "text-emerald-50 bg-emerald-600",
  },
  inactive: {
    text: "Inactive",
    className: "text-amber-50 bg-amber-600",
  },
  discontinued: {
    text: "Discontinued",
    className: "text-red-50 bg-red-600",
  },
};

export const stockStatusBadges = {
  "out-of-stock": {
    text: "Out of Stock",
    className: "text-red-50 bg-red-600",
    icon: "XCircle",
  },
  "low-stock": {
    text: "Low Stock",
    className: "bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200",
    icon: "AlertTriangle",
  },
  "in-stock": {
    text: "In Stock",
    className: "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200",
    icon: "CheckCircle",
  },
};
