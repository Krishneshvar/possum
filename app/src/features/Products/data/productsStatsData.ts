// app/src/features/Products/data/productsStatsData.ts
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
    value: '1,234',
    change: '+12%',
    description: 'from last month',
  },
  {
    title: 'Total Variants',
    icon: Layers,
    value: '3,456',
    change: '+5%',
    description: 'from last month',
  },
  {
    title: 'Categories',
    icon: Tags,
    value: '42',
    change: '+2',
    description: 'new categories',
  },
  {
    title: 'Archived',
    icon: Archive,
    value: '15',
    change: '-3',
    description: 'since last month',
  },
];
