// app/src/features/Products/data/productsFiltersConfig.ts
export const stockStatusFilter = {
    key: "stockStatus",
    label: "Stock Status",
    options: [
        { label: "In Stock", value: "ok" },
        { label: "Low Stock", value: "low" },
        { label: "Out of Stock", value: "out" },
    ],
};

export const statusFilter = {
    key: "status",
    label: "Status",
    options: [
        { label: "Active", value: "active" },
        { label: "Inactive", value: "inactive" },
        { label: "Archived", value: "archived" },
    ],
};

export const categoryFilter = {
    key: "category",
    label: "Category",
    options: [],
};
