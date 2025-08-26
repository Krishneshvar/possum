import { BarChart3 } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function VariantInventory({ variant, onVariantChange }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/10">
          <BarChart3 className="h-5 w-5 text-orange-600" />
        </div>
        <h3 className="text-lg font-semibold text-foreground">Inventory</h3>
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
  );
}
