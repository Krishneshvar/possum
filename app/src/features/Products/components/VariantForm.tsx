import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight, Star, Trash2, GripVertical } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from '@/lib/utils';

import VariantInformation from './VariantInformation';
import VariantPricings from './VariantPricings';
import VariantInventory from './VariantInventory';

interface VariantFormProps {
  variant: any;
  index: number;
  errors?: any;
  isEditMode?: boolean;
  onVariantChange: (id: number, field: string, value: any) => void;
  onVariantBlur?: (id: number, field: string) => void;
  onClearPriceFields: (id: number) => void;
  onRemoveVariant: (id: number) => void;
  showRemoveButton?: boolean;
  onSetDefaultVariant: (id: number) => void;
}

export default function VariantForm({
  variant,
  index,
  errors,
  isEditMode = false,
  onVariantChange,
  onVariantBlur,
  onClearPriceFields,
  onRemoveVariant,
  showRemoveButton = false,
  onSetDefaultVariant
}: VariantFormProps) {
  const [isOpen, setIsOpen] = useState(true);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: variant._tempId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <Collapsible
      ref={setNodeRef}
      style={style}
      open={isOpen}
      onOpenChange={setIsOpen}
      className={cn(
        "group border rounded-xl bg-card shadow-sm transition-all duration-200",
        isOpen ? "ring-2 ring-primary/20 shadow-md" : "hover:border-primary/30",
        isDragging && "opacity-50"
      )}
    >
      <div className="flex items-center justify-between p-4 gap-3">
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded"
                {...attributes}
                {...listeners}
                aria-label="Drag to reorder"
              >
                <GripVertical className="h-4 w-4 text-muted-foreground" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Drag to reorder</TooltipContent>
          </Tooltip>

          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-3 flex-1 select-none cursor-pointer text-left"
              aria-label={`${isOpen ? 'Collapse' : 'Expand'} variant ${index + 1}`}
            >
            <div className={cn(
              "p-1 rounded-md transition-colors duration-200 flex-shrink-0",
              isOpen ? "bg-primary/10 text-primary" : "text-muted-foreground group-hover:text-primary"
            )}>
              {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 flex-1 min-w-0">
              <span className="font-semibold text-sm flex-shrink-0">Variant #{index + 1}</span>
              {variant.name && (
                <span className="text-sm font-medium text-foreground truncate">
                  {variant.name}
                </span>
              )}
              {variant.sku && (
                <Badge variant="outline" className="text-[10px] font-mono h-5 px-1.5 text-muted-foreground flex-shrink-0">
                  {variant.sku}
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {variant.is_default && (
                <Badge variant="secondary" className="gap-1 bg-primary/10 text-primary hover:bg-primary/20 border-transparent">
                  <Star className="h-3 w-3 fill-primary" /> Default
                </Badge>
              )}
              {!isOpen && variant.mrp && (
                <span className="text-sm text-muted-foreground hidden md:inline-block">
                  ₹{variant.mrp}
                </span>
              )}
            </div>
            </button>
          </CollapsibleTrigger>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          {!variant.is_default && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    onSetDefaultVariant(variant._tempId);
                  }}
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-full"
                  aria-label="Set as default variant"
                >
                  <Star className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Set as default</TooltipContent>
            </Tooltip>
          )}

          {showRemoveButton && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    onRemoveVariant(variant._tempId);
                  }}
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full"
                  aria-label="Remove variant"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Remove variant</TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>

      <CollapsibleContent className="animate-collapsible-down">
        <Separator className="opacity-50" />
        <div className="p-5 sm:p-6 space-y-8 bg-muted/5">
          {/* Information Section */}
          <div className="space-y-4">
            <VariantInformation 
              variant={variant} 
              onVariantChange={onVariantChange}
              onVariantBlur={onVariantBlur}
              errors={errors}
            />
          </div>

          <Separator className="bg-border/60" />

          {/* Pricing Section */}
          <div className="space-y-4">
            <VariantPricings
              variant={variant}
              onVariantChange={onVariantChange}
              onVariantBlur={onVariantBlur}
              onClearPriceFields={onClearPriceFields}
              errors={errors}
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
