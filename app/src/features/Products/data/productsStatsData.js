import {
  Package,
  Split,
  TriangleAlert,
  CircleAlert,
} from 'lucide-react';

export const productsStatsConfig = [
  {
    title: 'Total Products',
    icon: Package,
    color: 'text-green-500',
    todayValue: "123",
  },
  {
    title: 'Total Variants',
    icon: Split,
    color: 'text-blue-500',
    todayValue: "123",
  },
  {
    title: 'Inactive Products',
    icon: TriangleAlert,
    color: 'text-yellow-500',
    todayValue: "123",
  },
  {
    title: 'Discontinued Products',
    icon: CircleAlert,
    color: 'text-red-500',
    todayValue: "123",
  },
];
