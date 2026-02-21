export const stockStatusFilter = {
    key: "stockStatus",
    label: "Stock Status",
    options: [
        { label: "Healthy (In Stock)", value: "ok" },
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
        { label: "Discontinued", value: "discontinued" },
    ],
};
export const categoryFilter = (categories: any[]) => ({
    key: "categories",
    label: "Category",
    options: (categories || []).map((c: any) => ({ label: c.name, value: String(c.id) })),
});
