import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCurrency } from "@/hooks/useCurrency";
import { Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";

import RequiredFieldIndicator from "@/components/common/RequiredFieldIndicator";

interface VariantPricingsProps {
    variant: any;
    onVariantChange: (id: number, field: string, value: string) => void;
    onClearPriceFields: (id: number) => void;
}

export default function VariantPricings({ variant, onVariantChange, onClearPriceFields }: VariantPricingsProps) {
  const currency = useCurrency();
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
          <Wallet className="h-5 w-5 text-success" />
        </div>
        <div className="flex w-full items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">Pricings</h3>
          <Button
            variant="outline"
            onClick={() => onClearPriceFields(variant._tempId)}
            type="button"
            className="cursor-pointer"
            title="Reset pricing fields"
          >
            Reset
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-end">
        <div className="space-y-3">
          <Label htmlFor={`mrp-${variant._tempId}`} className="text-sm font-medium">
            MRP <RequiredFieldIndicator />
          </Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{currency}</span>
            <Input
              id={`mrp-${variant._tempId}`}
              name="mrp"
              type="number"
              value={variant.mrp}
              onChange={(e) => onVariantChange(variant._tempId, e.target.name, e.target.value)}
              step="0.01"
              className="h-11 pl-8"
              placeholder="0.00"
              required
            />
          </div>
        </div>
        <div className="space-y-3">
          <Label htmlFor={`cost_price-${variant._tempId}`} className="text-sm font-medium">
            Cost Price
          </Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{currency}</span>
            <Input
              id={`cost_price-${variant._tempId}`}
              name="cost_price"
              type="number"
              value={variant.cost_price}
              onChange={(e) => onVariantChange(variant._tempId, e.target.name, e.target.value)}
              step="0.01"
              className="h-11 pl-8"
              placeholder="0.00"
            />
          </div>
        </div>
        <div className="space-y-3">
          <Label htmlFor={`profit_margin-${variant._tempId}`} className="text-sm font-medium">
            Profit Margin
          </Label>
          <div className="relative">
            <Input
              id={`profit_margin-${variant._tempId}`}
              name="profit_margin"
              type="number"
              value={variant.profit_margin}
              onChange={(e) => onVariantChange(variant._tempId, e.target.name, e.target.value)}
              step="0.01"
              className="h-11 pr-8"
              placeholder="0.00"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
