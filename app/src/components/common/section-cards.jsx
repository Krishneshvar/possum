import {
  Coins,
  Crown,
  PackageCheck,
  Wallet,
} from 'lucide-react';

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export function SectionCards() {
  const cardData = [
    {
      title: 'Sales',
      icon: Coins,
      color: 'text-green-500',
      todayValue: '$1,250.00',
      overallValue: '$2,250.00'
    },
    {
      title: 'Profit',
      icon: Wallet,
      color: 'text-blue-500',
      todayValue: '$1,234.00',
      overallValue: '$1,789.00'
    },
    {
      title: 'Items Sold',
      icon: PackageCheck,
      color: 'text-purple-500',
      todayValue: '123',
      overallValue: '212'
    },
    {
      title: 'Highest Bill',
      icon: Crown,
      color: 'text-yellow-500',
      todayValue: '$123.00',
      overallValue: '$1,234.00'
    },
  ];

  return (
    <div
      className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      {cardData.map((item, index) => {
        const Icon = item.icon;
        return (
          <Card key={index} className="@container/card">
            <CardHeader>
              <CardDescription className="flex gap-2 items-center">
                <Icon className={item.color} /> {item.title}
              </CardDescription>
              <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                {item.todayValue}
              </CardTitle>
              {item.overallValue && (
                <p className="text-xs text-muted-foreground">
                  Overall: {item.overallValue}
                </p>
              )}
            </CardHeader>
          </Card>
        );
      })}
    </div>
  );
};
