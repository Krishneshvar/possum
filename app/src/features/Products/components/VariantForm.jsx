import { Trash2, DollarSign, BarChart3, Info, RefreshCcw } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,

} from "@/components/ui/select";

import RequiredFieldIndicator from "@/components/common/RequiredFieldIndicator";

export default function VariantForm({
  variant,
  index,
  onVariantChange,
  onSelectChange,
  onRadioChange,
  onClearPriceFields,
  onRemoveVariant,
  showRemoveButton,
}) {
  return (
    <Card className="shadow-sm border-2">
      <CardHeader className="flex flex-row items-center justify-between p-4 bg-slate-50 border-1 border-slate-100">
        <h4 className="font-semibold">Variant {index + 1}</h4>
        {showRemoveButton && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onRemoveVariant(variant._tempId)}
            className="text-muted-foreground hover:text-red-500"
            title="Remove variant"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent className="p-6 space-y-8">
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="space-y-3">
              <Label htmlFor="status" className="text-sm font-medium">
                Status <RequiredFieldIndicator />
              </Label>
              <Select>
              {/* <Select onValueChange={(value) => handleSelectChange("status", value)} value={formData.status}> */}
                <SelectTrigger id="status" className="w-full py-[1.3rem]">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-green-500" />
                      Active
                    </div>
                  </SelectItem>
                  <SelectItem value="inactive">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-yellow-500" />
                      Inactive
                    </div>
                  </SelectItem>
                  <SelectItem value="discontinued">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-red-500" />
                      Discontinued
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label htmlFor={`variant-name-${variant._tempId}`} className="text-sm font-medium">
                Variant Name <RequiredFieldIndicator />
              </Label>
              <Input
                id={`variant-name-${variant._tempId}`}
                name="name"
                value={variant.name}
                onChange={(e) => onVariantChange(variant._tempId, e)}
                placeholder="e.g. Red, Size L"
                className="h-11"
                required
              />
            </div>
            <div className="space-y-3">
              <Label htmlFor={`sku-${variant._tempId}`} className="text-sm font-medium">
                SKU <RequiredFieldIndicator />
              </Label>
              <Input
                id={`sku-${variant._tempId}`}
                name="sku"
                value={variant.sku}
                onChange={(e) => onVariantChange(variant._tempId, e)}
                placeholder="Variant SKU"
                className="h-11 font-mono"
                required
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Pricing */}
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
                onValueChange={(value) => onRadioChange(variant._tempId, value)}
                value={variant.disabledField}
                className="grid grid-cols-1 sm:grid-cols-3 gap-4"
              >
                <div className="flex items-center space-x-3 rounded-lg border bg-background p-3 hover:bg-accent/50 transition-colors">
                  <RadioGroupItem value="price" id={`calc-price-${variant._tempId}`} />
                  <Label htmlFor={`calc-price-${variant._tempId}`} className="flex-1 cursor-pointer">
                    Selling Price
                  </Label>
                </div>
                <div className="flex items-center space-x-3 rounded-lg border bg-background p-3 hover:bg-accent/50 transition-colors">
                  <RadioGroupItem value="cost_price" id={`calc-cost_price-${variant._tempId}`} />
                  <Label htmlFor={`calc-cost_price-${variant._tempId}`} className="flex-1 cursor-pointer">
                    Cost Price
                  </Label>
                </div>
                <div className="flex items-center space-x-3 rounded-lg border bg-background p-3 hover:bg-accent/50 transition-colors">
                  <RadioGroupItem value="profit_margin" id={`calc-profit_margin-${variant._tempId}`} />
                  <Label htmlFor={`calc-profit_margin-${variant._tempId}`} className="flex-1 cursor-pointer">
                    Profit Margin
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-end">
            <div className="space-y-3">
              <Label htmlFor={`price-${variant._tempId}`} className="text-sm font-medium">
                Selling Price <RequiredFieldIndicator />
                {variant.disabledField === "price" && (
                  <Badge variant="secondary" className="ml-2 text-xs">
                    Auto
                  </Badge>
                )}
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  id={`price-${variant._tempId}`}
                  name="price"
                  type="number"
                  value={variant.price}
                  onChange={(e) => onVariantChange(variant._tempId, e)}
                  step="0.01"
                  disabled={variant.disabledField === "price"}
                  className="h-11 pl-8"
                  placeholder="0.00"
                  required
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label htmlFor={`cost_price-${variant._tempId}`} className="text-sm font-medium">
                Cost Price
                {variant.disabledField === "cost_price" && (
                  <Badge variant="secondary" className="ml-2 text-xs">
                    Auto
                  </Badge>
                )}
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  id={`cost_price-${variant._tempId}`}
                  name="cost_price"
                  type="number"
                  value={variant.cost_price}
                  onChange={(e) => onVariantChange(variant._tempId, e)}
                  step="0.01"
                  disabled={variant.disabledField === "cost_price"}
                  className="h-11 pl-8"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label htmlFor={`profit_margin-${variant._tempId}`} className="text-sm font-medium">
                Profit Margin
                {variant.disabledField === "profit_margin" && (
                  <Badge variant="secondary" className="ml-2 text-xs">
                    Auto
                  </Badge>
                )}
              </Label>
              <div className="relative">
                <Input
                  id={`profit_margin-${variant._tempId}`}
                  name="profit_margin"
                  type="number"
                  value={variant.profit_margin}
                  onChange={(e) => onVariantChange(variant._tempId, e)}
                  step="0.01"
                  disabled={variant.disabledField === "profit_margin"}
                  className="h-11 pr-8"
                  placeholder="0.00"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
              </div>
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={() => onClearPriceFields(variant._tempId)}
              type="button"
              className="h-11 w-11 shrink-0 bg-transparent"
              title="Reset pricing fields"
            >
              <RefreshCcw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Separator />

        {/* Inventory */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/10">
              <BarChart3 className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Inventory</h3>
              <p className="text-sm text-muted-foreground">Stock management</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label htmlFor={`stock-${variant._tempId}`} className="text-sm font-medium">
                Current Stock
              </Label>
              <Input
                id={`stock-${variant._tempId}`}
                name="stock"
                type="number"
                value={variant.stock}
                onChange={(e) => onVariantChange(variant._tempId, e)}
                placeholder="0"
                className="h-11"
                min="0"
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor={`stock_alert_cap-${variant._tempId}`} className="text-sm font-medium">
                Low Stock Alert
              </Label>
              <Input
                id={`stock_alert_cap-${variant._tempId}`}
                name="stock_alert_cap"
                type="number"
                value={variant.stock_alert_cap}
                onChange={(e) => onVariantChange(variant._tempId, e)}
                placeholder="10"
                className="h-11"
                min="0"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
