import {
  Archive,
  Box,
  Layers,
  Tags,
} from 'lucide-react';

export const productsStatsData = [
  {
    title: 'Total Products',
    icon: Box,
    color: 'text-blue-500',
    todayValue: '0',
    overallValue: '0',
  },
  {
    title: 'Total Variants',
    icon: Layers,
    color: 'text-purple-500',
    todayValue: '0',
    overallValue: '0',
  },
  {
    title: 'Categories',
    icon: Tags,
    color: 'text-green-500',
    todayValue: '0',
  },
  {
    title: 'Low Stock',
    icon: Archive,
    color: 'text-orange-500',
    todayValue: '0',
  },
];