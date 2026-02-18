import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCurrency } from "@/hooks/useCurrency";
import { Wallet, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import RequiredFieldIndicator from "@/components/common/RequiredFieldIndicator";

interface VariantPricingsProps {
    variant: any;
    errors?: any;
    onVariantChange: (id: number, field: string, value: string) => void;
    onVariantBlur?: (id: number, field: string) => void;
    onClearPriceFields: (id: number) => void;
}

export default function VariantPricings({ variant, errors, onVariantChange, onVariantBlur, onClearPriceFields }: VariantPricingsProps) {
  const currency = useCurrency();
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
          <Wallet className="h-5 w-5 text-success" />
        </div>
        <div className="flex w-full items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">Pricing</h3>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onClearPriceFields(variant._tempId)}
                type="button"
                className="cursor-pointer h-8"
                aria-label="Reset pricing fields"
              >
                <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                Reset
              </Button>
            </TooltipTrigger>
            <TooltipContent>Clear all pricing fields</TooltipContent>
          </Tooltip>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-end">
        <div className="space-y-3">
          <Label htmlFor={`mrp-${variant._tempId}`} className="text-sm font-medium">
            MRP <RequiredFieldIndicator />
          </Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground select-none">{currency}</span>
            <Input
              id={`mrp-${variant._tempId}`}
              name="mrp"
              type="number"
              value={variant.mrp}
              onChange={(e) => onVariantChange(variant._tempId, e.target.name, e.target.value)}
              onBlur={() => onVariantBlur?.(variant._tempId, 'mrp')}
              step="0.01"
              min="0"
              className="h-11 pl-8"
              placeholder="0.00"
              required
              aria-label="Maximum Retail Price"
              aria-invalid={!!errors?.mrp}
            />
          </div>
          {errors?.mrp && <p className="text-xs text-destructive mt-1">{errors.mrp}</p>}
        </div>
        <div className="space-y-3">
          <Label htmlFor={`cost_price-${variant._tempId}`} className="text-sm font-medium">
            Cost Price
          </Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground select-none">{currency}</span>
            <Input
              id={`cost_price-${variant._tempId}`}
              name="cost_price"
              type="number"
              value={variant.cost_price}
              onChange={(e) => onVariantChange(variant._tempId, e.target.name, e.target.value)}
              step="0.01"
              min="0"
              className="h-11 pl-8"
              placeholder="0.00"
              aria-label="Cost price per unit"
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
              min="0"
              max="100"
              className="h-11 pr-8"
              placeholder="0.00"
              aria-label="Profit margin percentage"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground select-none">%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
