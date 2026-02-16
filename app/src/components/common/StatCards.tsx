import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useCurrency } from "@/hooks/useCurrency"

interface StatCardData {
    title: string;
    icon: React.ElementType;
    color: string;
    todayValue: string | number;
    overallValue?: string | number;
    isCurrency?: boolean;
}

interface StatCardsProps {
    cardData: StatCardData[];
}

export function StatCards({ cardData }: StatCardsProps) {
  const currency = useCurrency()
  return (
    <div
      className="grid lg:grid-cols-4 sm:grid-cols-2 gap-2">
      {cardData.map((item, index) => {
        const Icon = item.icon;
        const formatValue = (val: string | number) => {
          if (item.isCurrency) {
            return `${currency}${parseFloat(String(val)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
          }
          return val
        }

        return (
          <Card key={index}>
            <CardHeader>
              <CardDescription className="flex gap-2 items-center">
                <Icon className={item.color} /> {item.title}
              </CardDescription>
              <CardTitle className="text-2xl font-semibold">
                {formatValue(item.todayValue)}
              </CardTitle>
              {item.overallValue && (
                <p className="text-xs text-muted-foreground">
                  Overall: {formatValue(item.overallValue)}
                </p>
              )}
            </CardHeader>
          </Card>
        );
      })}
    </div>
  );
};
