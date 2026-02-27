import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useCurrency } from "@/hooks/useCurrency"
import { cn } from "@/lib/utils"

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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cardData.map((item, index) => {
        const Icon = item.icon;
        const formatValue = (val: string | number) => {
          if (item.isCurrency) {
            return `${currency}${parseFloat(String(val)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
          }
          return val
        }

        return (
          <Card key={index} className="overflow-hidden border-border/50 shadow-sm">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className={cn("p-1.5 rounded-lg bg-muted/50", item.color.replace('text-', 'bg-').replace('-500', '-500/10'))}>
                  <Icon className={cn("size-4", item.color)} />
                </div>
                <CardDescription className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {item.title}
                </CardDescription>
              </div>
              <CardTitle className="text-2xl font-bold mt-2">
                {formatValue(item.todayValue)}
              </CardTitle>
            </CardHeader>
          </Card>
        );
      })}
    </div>
  );
};
