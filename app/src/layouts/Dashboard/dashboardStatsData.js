import {
  Coins,
  Crown,
  PackageCheck,
  Wallet,
} from 'lucide-react';

export const cardData = [
  {
    title: 'Sales',
    icon: Coins,
    color: 'text-success',
    todayValue: '$1,250.00',
    overallValue: '$2,250.00'
  },
  {
    title: 'Profit',
    icon: Wallet,
    color: 'text-primary',
    todayValue: '$1,234.00',
    overallValue: '$1,789.00'
  },
  {
    title: 'Items Sold',
    icon: PackageCheck,
    color: 'text-primary',
    todayValue: '123',
    overallValue: '212'
  },
  {
    title: 'Highest Bill',
    icon: Crown,
    color: 'text-warning',
    todayValue: '$123.00',
    overallValue: '$1,234.00'
  },
];
