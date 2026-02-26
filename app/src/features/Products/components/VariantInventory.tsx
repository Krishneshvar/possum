import { BarChart3, Info } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ADJUSTMENT_REASONS = [
  { value: 'correction', label: 'Correction' },
  { value: 'damage', label: 'Damage' },
  { value: 'theft', label: 'Theft' },
  { value: 'spoilage', label: 'Spoilage' },
  { value: 'return', label: 'Return' },
  { value: 'confirm_receive', label: 'Purchase / Receive' },
];

interface VariantInventoryProps {
  variant: any;
  onVariantChange: (id: number, field: string, value: string) => void;
  isEditing?: boolean;
}

export default function VariantInventory({ variant, onVariantChange, isEditing = false }: VariantInventoryProps) {
  // Determine if the user has changed the stock from the initial value
  const originalStock = variant._originalStock;
  const currentStock = variant.stock;
  const stockHasChanged = isEditing && originalStock !== undefined && String(currentStock) !== String(originalStock);

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

      {/* Adjustment reason — only show in edit mode and only when stock differs */}
      {isEditing && stockHasChanged && (
        <div className="space-y-3">
          <Label
            htmlFor={`stock_adjustment_reason-${variant._tempId}`}
            className="text-sm font-medium"
          >
            Adjustment Reason <span className="text-destructive">*</span>
          </Label>
          <Select
            value={variant.stock_adjustment_reason ?? 'correction'}
            onValueChange={(value) =>
              onVariantChange(variant._tempId, 'stock_adjustment_reason', value)
            }
          >
            <SelectTrigger
              id={`stock_adjustment_reason-${variant._tempId}`}
              className="h-11 w-full"
              aria-label="Reason for stock adjustment"
            >
              <SelectValue placeholder="Select a reason…" />
            </SelectTrigger>
            <SelectContent>
              {ADJUSTMENT_REASONS.map((r) => (
                <SelectItem key={r.value} value={r.value}>
                  {r.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            This reason will be recorded in the inventory adjustment log.
          </p>
        </div>
      )}
    </div>
  );
}
