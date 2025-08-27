import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import VariantInformation from "./VariantInformation";
import VariantPricings from "./VariantPricings";
import VariantInventory from "./VariantInventory";

export default function VariantForm({
  variant,
  index,
  onVariantChange,
  onSelectChange,
  onRemoveVariant,
  showRemoveButton,
  onClearPriceFields,
  onSetDefaultVariant
}) {
  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between py-2 bg-slate-50 border-1 border-slate-100">
        <h4 className="font-semibold">Variant {index + 1}</h4>
        <div className="flex gap-2">
          {variant.is_default !== 1 && (
            <Button
              variant="outline"
              onClick={() => onSetDefaultVariant(variant._tempId)}
              className="h-auto text-xs cursor-pointer"
            >
              Set as Default
            </Button>
          )}
          {showRemoveButton && (
            <Button
              size="icon"
              onClick={() => onRemoveVariant(variant._tempId)}
              className="bg-red-600 hover:bg-red-500 cursor-pointer"
              title="Remove variant"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="p- space-y-4">
        <VariantInformation
          variant={variant}
          onVariantChange={onVariantChange}
          onSelectChange={onSelectChange}
        />

        <Separator />

        <VariantPricings
          variant={variant}
          onVariantChange={onVariantChange}
          onClearPriceFields={onClearPriceFields}
        />

        <Separator />

        <VariantInventory
          variant={variant}
          onVariantChange={onVariantChange}
        />
      </CardContent>
    </Card>
  );
}
