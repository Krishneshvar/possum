export const stockStatusFilter = {
    key: "stockStatus",
    label: "Stock Status",
    options: [
        { label: "All Stock Levels", value: "" },
        { label: "Healthy (In Stock)", value: "ok" },
        { label: "Low Stock", value: "low" },
        { label: "Out of Stock", value: "out" },
    ],
};

export const statusFilter = {
    key: "status",
    label: "Status",
    options: [
        { label: "All Statuses", value: "" },
        { label: "Active", value: "active" },
        { label: "Inactive", value: "inactive" },
        { label: "Discontinued", value: "discontinued" },
    ],
};
