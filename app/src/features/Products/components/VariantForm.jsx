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
  onClearPriceFields
}) {
  return (
    <Card className="shadow-sm">
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
