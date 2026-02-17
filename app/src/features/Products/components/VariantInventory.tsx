import { BarChart3 } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface VariantInventoryProps {
    variant: any;
    onVariantChange: (id: number, field: string, value: string) => void;
    isEditing?: boolean;
}

export default function VariantInventory({ variant, onVariantChange, isEditing = false }: VariantInventoryProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/10">
          <BarChart3 className="h-5 w-5 text-orange-600" />
        </div>
        <h3 className="text-lg font-semibold text-foreground">Inventory</h3>
      </div>

      {/* Stock is read-only - derived from inventory_lots + inventory_adjustments */}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-3">
          <Label htmlFor={`stock-${variant._tempId}`} className="text-sm font-medium">
            Stock Quantity
          </Label>
          <Input
            id={`stock-${variant._tempId}`}
            name="stock"
            type="number"
            value={variant.stock ?? 0}
            onChange={(e) => onVariantChange(variant._tempId, e.target.name, e.target.value)}
            placeholder="0"
            className="h-11"
            min="0"
          />
          <p className="text-xs text-muted-foreground">
            {isEditing ? "Entering a different value will create an inventory adjustment." : "Initial stock level."}
          </p>
        </div>
        <div className="space-y-3">
          <Label htmlFor={`stock_alert_cap-${variant._tempId}`} className="text-sm font-medium">
            Low Stock Alert Threshold
          </Label>
          <Input
            id={`stock_alert_cap-${variant._tempId}`}
            name="stock_alert_cap"
            type="number"
            value={variant.stock_alert_cap}
            onChange={(e) => onVariantChange(variant._tempId, e.target.name, e.target.value)}
            placeholder="10"
            className="h-11"
            min="0"
          />
        </div>
      </div>
    </div>
  );
}
