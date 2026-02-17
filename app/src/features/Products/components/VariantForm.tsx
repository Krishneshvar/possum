import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronDown, ChevronRight, X, Star } from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
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
      className="border border-border/50 rounded-xl overflow-hidden bg-card shadow-sm transition-all duration-200 hover:shadow-md"
    >
      <div className={cn(
        "flex items-center justify-between px-4 py-3 bg-muted/30 border-b border-border/50 transition-colors",
        isOpen && "bg-muted/50"
      )}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="p-0 hover:bg-transparent flex items-center gap-2 font-medium">
            {isOpen ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
            <span>Variant #{index + 1}</span>
            <span className="text-muted-foreground font-normal ml-1">
              — {variant.name || '(Unnamed)'}
            </span>
            {variant.is_default && (
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary">
                Default
              </span>
            )}
          </Button>
        </CollapsibleTrigger>
        <div className="flex items-center gap-2">
          {!variant.is_default && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSetDefaultVariant(variant._tempId)}
              className="h-8 text-xs text-muted-foreground hover:text-primary"
              title="Set as default variant"
            >
              <Star className="h-3.5 w-3.5 mr-1.5" />
              Make Default
            </Button>
          )}
          {showRemoveButton && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onRemoveVariant(variant._tempId)}
              className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full transition-colors"
              title="Remove variant"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <CollapsibleContent className="animate-collapsible-down">
        <div className="p-6 space-y-8">
          <VariantInformation variant={variant} onVariantChange={onVariantChange} />
          <VariantPricings
            variant={variant}
            onVariantChange={onVariantChange}
            onClearPriceFields={onClearPriceFields}
          />
          <VariantInventory
            variant={variant}
            onVariantChange={onVariantChange}
            isEditing={isEditMode}
          />
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
