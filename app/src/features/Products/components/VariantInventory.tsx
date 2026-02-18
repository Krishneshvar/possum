import { BarChart3, Info } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

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

      {isEditing && (
        <Alert className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900">
          <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <AlertDescription className="text-sm text-blue-800 dark:text-blue-300">
            Changing stock quantity will create an inventory adjustment record.
          </AlertDescription>
        </Alert>
      )}

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
            aria-label="Current stock quantity"
          />
          <p className="text-xs text-muted-foreground">
            {isEditing ? "Current available units" : "Initial stock level"}
          </p>
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
            onChange={(e) => onVariantChange(variant._tempId, e.target.name, e.target.value)}
            placeholder="10"
            className="h-11"
            min="0"
            aria-label="Low stock alert threshold"
          />
          <p className="text-xs text-muted-foreground">
            Alert when stock falls below this level
          </p>
        </div>
      </div>
    </div>
  );
}
