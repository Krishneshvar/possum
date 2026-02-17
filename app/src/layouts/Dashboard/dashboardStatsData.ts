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
    todayValue: '1250.00',
    overallValue: '2250.00',
    isCurrency: true
  },
  {
    title: 'Profit',
    icon: Wallet,
    color: 'text-primary',
    todayValue: '1234.00',
    overallValue: '1789.00',
    isCurrency: true
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
    todayValue: '123.00',
    overallValue: '1234.00',
    isCurrency: true
  },
];
