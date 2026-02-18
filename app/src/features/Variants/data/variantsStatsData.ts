import { Layers, AlertTriangle, XCircle, TrendingUp } from "lucide-react";

export const variantsStatsData = [
  {
    title: "Total Variants",
    value: "totalVariants",
    icon: Layers,
    description: "All product variants",
  },
  {
    title: "Low Stock",
    value: "lowStockVariants",
    icon: AlertTriangle,
    description: "Below alert threshold",
    variant: "warning" as const,
  },
  {
    title: "Inactive",
    value: "inactiveVariants",
    icon: XCircle,
    description: "Not available for sale",
    variant: "muted" as const,
  },
  {
    title: "Avg Stock Level",
    value: "avgStockLevel",
    icon: TrendingUp,
    description: "Average across all variants",
    format: "number" as const,
  },
];
