import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight, Star, Trash2 } from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { cn } from '@/lib/utils';

import VariantInformation from './VariantInformation';
import VariantPricings from './VariantPricings';
import VariantInventory from './VariantInventory';

interface VariantFormProps {
  variant: any;
  index: number;
  isEditMode?: boolean;
  onVariantChange: (id: number, field: string, value: any) => void;
  onClearPriceFields: (id: number) => void;
  onRemoveVariant: (id: number) => void;
  showRemoveButton?: boolean;
  onSetDefaultVariant: (id: number) => void;
}

export default function VariantForm({
  variant,
  index,
  isEditMode = false,
  onVariantChange,
  onClearPriceFields,
  onRemoveVariant,
  showRemoveButton = false,
  onSetDefaultVariant
}: VariantFormProps) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className={cn(
        "group border rounded-xl bg-card shadow-sm transition-all duration-200",
        isOpen ? "ring-1 ring-primary/20 shadow-md" : "hover:border-primary/30"
      )}
    >
      <div className="flex items-center justify-between p-4 pl-4 pr-2">
        <CollapsibleTrigger asChild>
          <div className="flex items-center gap-3 cursor-pointer flex-1 select-none">
            <div className={cn(
              "p-1 rounded-md transition-colors duration-200",
              isOpen ? "bg-primary/10 text-primary" : "text-muted-foreground group-hover:text-primary"
            )}>
              {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
              <span className="font-semibold text-sm">Variant #{index + 1}</span>
              {variant.name && (
                <span className="text-sm font-medium text-foreground hidden sm:inline-block">
                  — {variant.name}
                </span>
              )}
              {variant.sku && (
                <Badge variant="outline" className="text-[10px] font-mono h-5 px-1.5 text-muted-foreground mr-1">
                  {variant.sku}
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2 ml-2">
              {variant.is_default && (
                <Badge variant="secondary" className="gap-1 bg-primary/10 text-primary hover:bg-primary/20 border-transparent">
                  <Star className="h-3 w-3 fill-primary" /> Default
                </Badge>
              )}
              {!isOpen && variant.mrp && (
                <span className="text-sm text-muted-foreground ml-auto pr-4 hidden sm:inline-block">
                  MRP: {variant.mrp}
                </span>
              )}
            </div>
          </div>
        </CollapsibleTrigger>

        <div className="flex items-center gap-1 ml-2">
          {!variant.is_default && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                onSetDefaultVariant(variant._tempId);
              }}
              className="h-8 w-8 p-0 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-full"
              title="Set as default variant"
            >
              <Star className="h-4 w-4" />
            </Button>
          )}

          {showRemoveButton && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                onRemoveVariant(variant._tempId);
              }}
              className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full"
              title="Remove variant"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <CollapsibleContent className="animate-collapsible-down">
        <Separator className="opacity-50" />
        <div className="p-5 sm:p-6 space-y-8 bg-muted/5">
          {/* Information Section */}
          <div className="space-y-4">
            <VariantInformation variant={variant} onVariantChange={onVariantChange} />
          </div>

          <Separator className="bg-border/60" />

          {/* Pricing Section */}
          <div className="space-y-4">
            {/* We accept VariantPricings has its own header internal usage, 
                 but we might want to override or wrap it if it looks repetitive. 
                 Currently it has a header with "Reset" button. Keeping it is fine.
             */}
            <VariantPricings
              variant={variant}
              onVariantChange={onVariantChange}
              onClearPriceFields={onClearPriceFields}
            />
          </div>

          <Separator className="bg-border/60" />

          {/* Inventory Section */}
          <div className="space-y-4">
            <VariantInventory
              variant={variant}
              onVariantChange={onVariantChange}
              isEditing={isEditMode}
            />
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
