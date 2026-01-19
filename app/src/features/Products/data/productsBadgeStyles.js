export const productStatusBadges = {
  active: {
    text: "Active",
    className: "text-white bg-success",
  },
  inactive: {
    text: "Inactive",
    className: "text-white bg-warning",
  },
  discontinued: {
    text: "Discontinued",
    className: "text-white bg-destructive",
  },
};

export const stockStatusBadges = {
  "out-of-stock": {
    text: "Out of Stock",
    className: "text-white bg-destructive",
    icon: "XCircle",
  },
  "low-stock": {
    text: "Low Stock",
    className: "bg-warning/10 text-warning border-warning/20 hover:bg-warning/20",
    icon: "AlertTriangle",
  },
  "in-stock": {
    text: "In Stock",
    className: "bg-success/10 text-success border-success/20 hover:bg-success/20",
    icon: "CheckCircle",
  },
};
