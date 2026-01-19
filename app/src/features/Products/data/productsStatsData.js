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
    color: 'text-success',
    todayValue: "123",
  },
  {
    title: 'Total Variants',
    icon: Split,
    color: 'text-primary',
    todayValue: "123",
  },
  {
    title: 'Inactive Products',
    icon: TriangleAlert,
    color: 'text-warning',
    todayValue: "123",
  },
  {
    title: 'Discontinued Products',
    icon: CircleAlert,
    color: 'text-destructive',
    todayValue: "123",
  },
];
