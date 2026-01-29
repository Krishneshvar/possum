export const actionFilter = {
    key: "action",
    label: "Action Type",
    options: [
        { label: "Create", value: "create" },
        { label: "Update", value: "update" },
        { label: "Delete", value: "delete" },
        { label: "Login", value: "login" },
        { label: "Logout", value: "logout" },
    ],
};

export const resourceFilter = {
    key: "tableName",
    label: "Resource",
    options: [
        { label: "Products", value: "products" },
        { label: "Categories", value: "categories" },
        { label: "Sales", value: "sales" },
        { label: "Customers", value: "customers" },
        { label: "Users", value: "users" },
        { label: "Inventory", value: "inventory_adjustments" },
        { label: "Suppliers", value: "suppliers" },
    ],
};
