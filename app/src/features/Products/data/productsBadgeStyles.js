export const productStatusBadges = {
  active: {
    text: "Active",
    className: "text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200",
  },
  inactive: {
    text: "Inactive",
    className: "text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200",
  },
  discontinued: {
    text: "Discontinued",
    className: "bg-destructive",
  },
};

export const stockStatusBadges = {
  "out-of-stock": {
    text: "Out of Stock",
    className: "bg-destructive",
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
