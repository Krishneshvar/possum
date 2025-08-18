import { Info, DollarSign, RefreshCcw } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";

import RequiredFieldIndicator from "@/components/common/RequiredFieldIndicator";

export default function ProductPricings({ formData, handleChange, handleRadioChange, disabledField, clearPriceFields }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
          <DollarSign className="h-5 w-5 text-green-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">Pricing & Margins</h3>
          <p className="text-sm text-muted-foreground">Configure pricing strategy, profit calculations and tax</p>
        </div>
      </div>

      <div className="flex items-start gap-2 rounded-lg bg-blue-50 dark:bg-blue-950/20 p-3 border border-blue-200 dark:border-blue-800">
        <Info className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
        <p className="text-sm text-blue-700 dark:text-blue-300">
          Provide any two of the three pricing fields to automatically calculate the third value.
        </p>
      </div>

      <div className="rounded-lg border bg-muted/30 p-4">
        <div className="space-y-4">
          <Label className="text-sm font-medium">Auto-calculate field:</Label>
          <RadioGroup
            onValueChange={handleRadioChange}
            value={disabledField}
            className="grid grid-cols-1 sm:grid-cols-3 gap-4"
          >
            <div className="flex items-center space-x-3 rounded-lg border bg-background p-3 hover:bg-accent/50 transition-colors">
              <RadioGroupItem value="price" id="calc-price" />
              <Label htmlFor="calc-price" className="flex-1 cursor-pointer">
                Selling Price
              </Label>
            </div>
            <div className="flex items-center space-x-3 rounded-lg border bg-background p-3 hover:bg-accent/50 transition-colors">
              <RadioGroupItem value="cost_price" id="calc-cost_price" />
              <Label htmlFor="calc-cost_price" className="flex-1 cursor-pointer">
                Cost Price
              </Label>
            </div>
            <div className="flex items-center space-x-3 rounded-lg border bg-background p-3 hover:bg-accent/50 transition-colors">
              <RadioGroupItem value="profit_margin" id="calc-profit_margin" />
              <Label htmlFor="calc-profit_margin" className="flex-1 cursor-pointer">
                Profit Margin
              </Label>
            </div>
          </RadioGroup>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-end">
        <div className="space-y-3">
          <Label htmlFor="price" className="text-sm font-medium">
            Selling Price <RequiredFieldIndicator />
            {disabledField === "price" && (
              <Badge variant="secondary" className="ml-2 text-xs">
                Auto
              </Badge>
            )}
          </Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
            <Input
              id="price"
              name="price"
              type="number"
              value={formData.price}
              onChange={handleChange}
              step="0.01"
              disabled={disabledField === "price"}
              className="h-11 pl-8"
              placeholder="0.00"
              required
            />
          </div>
        </div>

        <div className="space-y-3">
          <Label htmlFor="cost_price" className="text-sm font-medium">
            Cost Price
            {disabledField === "cost_price" && (
              <Badge variant="secondary" className="ml-2 text-xs">
                Auto
              </Badge>
            )}
          </Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
            <Input
              id="cost_price"
              name="cost_price"
              type="number"
              value={formData.cost_price}
              onChange={handleChange}
              step="0.01"
              disabled={disabledField === "cost_price"}
              className="h-11 pl-8"
              placeholder="0.00"
            />
          </div>
        </div>

        <div className="space-y-3">
          <Label htmlFor="profit_margin" className="text-sm font-medium">
            Profit Margin
            {disabledField === "profit_margin" && (
              <Badge variant="secondary" className="ml-2 text-xs">
                Auto
              </Badge>
            )}
          </Label>
          <div className="relative">
            <Input
              id="profit_margin"
              name="profit_margin"
              type="number"
              value={formData.profit_margin}
              onChange={handleChange}
              step="0.01"
              disabled={disabledField === "profit_margin"}
              className="h-11 pr-8"
              placeholder="0.00"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
          </div>
        </div>

        <Button
          variant="outline"
          size="icon"
          onClick={clearPriceFields}
          type="button"
          className="h-11 w-11 shrink-0 bg-transparent"
          title="Reset pricing fields"
        >
          <RefreshCcw className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="space-y-3">
          <Label htmlFor="product_tax" className="text-sm font-medium">
            Tax Rate
          </Label>
          <div className="relative">
            <Input
              id="product_tax"
              name="product_tax"
              type="number"
              value={formData.product_tax}
              onChange={handleChange}
              step="0.01"
              placeholder="0.00"
              className="h-11 pr-8"
              min="0"
              max="100"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
          </div>
        </div>
      </div>
    </div>
  );
};
