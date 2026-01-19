import { Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
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
  onRemoveVariant,
  showRemoveButton,
  onClearPriceFields,
  onSetDefaultVariant
}) {
  const isDefaultVariant = variant.is_default === 1;

  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between py-2 bg-muted/30 border-b border-border">
        <div className="flex items-center gap-2">
          <h4 className="font-semibold">Variant {index + 1}</h4>
          {isDefaultVariant && (
            <Badge variant="secondary" className="bg-accent text-accent-foreground">
              Default
            </Badge>
          )}
        </div>
        <div className="flex gap-2">
          {!isDefaultVariant && (
            <Button
              variant="outline"
              onClick={() => onSetDefaultVariant(variant._tempId)}
              className="h-auto text-xs cursor-pointer"
            >
              Set as Default
            </Button>
          )}
          {showRemoveButton && !isDefaultVariant && (
            <Button
              size="icon"
              onClick={() => onRemoveVariant(variant._tempId)}
              className="bg-destructive hover:bg-destructive/90 cursor-pointer text-destructive-foreground"
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
