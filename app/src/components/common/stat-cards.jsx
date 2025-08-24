import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export function StatCards({ cardData }) {
  return (
    <div
      className="grid grid-cols-4 gap-2">
      {cardData.map((item, index) => {
        const Icon = item.icon;
        return (
          <Card key={index}>
            <CardHeader>
              <CardDescription className="flex gap-2 items-center">
                <Icon className={item.color} /> {item.title}
              </CardDescription>
              <CardTitle className="text-2xl font-semibold">
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
