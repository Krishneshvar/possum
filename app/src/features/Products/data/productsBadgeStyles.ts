// app/src/features/Products/data/productsBadgeStyles.ts
export const stockStatusStyles: Record<string, string> = {
    'In Stock': 'bg-green-100 text-green-800',
    'Low Stock': 'bg-yellow-100 text-yellow-800',
    'Out of Stock': 'bg-red-100 text-red-800',
};

export const statusStyles: Record<string, string> = {
    active: 'bg-blue-100 text-blue-800',
    inactive: 'bg-gray-100 text-gray-800',
    archived: 'bg-purple-100 text-purple-800',
};

export const productStatusBadges = statusStyles;
