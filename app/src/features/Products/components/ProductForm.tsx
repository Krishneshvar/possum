import { Button } from "@/components/ui/button";
import { Loader2, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

import ProductDetailsSection from "./ProductDetailsSection";
import ProductOrganizationSection from "./ProductOrganizationSection";
import ProductMediaSection from "./ProductMediaSection";
import VariantForm from "./VariantForm";
import GenericDeleteDialog from "@/components/common/GenericDeleteDialog";
import { useState } from "react";

interface ProductFormProps {
  initialData?: any;
  categories: any[];
  onSuccess: (name: string) => void;
  onFailure: (error: any) => void;
  isEditMode?: boolean;
  isSaving?: boolean;
  saveProductAndVariants: (isEditMode: boolean, id?: number) => Promise<{ success: boolean; error?: any }>;
  deleteVariantFromApi: (variantId: number, productId: number) => Promise<void>;
  taxCategories?: any[];
  formData: any;
  errors?: any;
  handleProductChange: (field: string, value: any) => void;
  handleVariantChange: (index: number, field: string, value: any) => void;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleRemoveImage: () => void;
  handleBlur?: (field: string) => void;
  handleVariantBlur?: (index: number, field: string) => void;
  clearPriceFields: (index: number) => void;
  addVariantLocally: () => void;
  removeVariantLocally: (tempId: number) => void;
  handleSetDefaultVariantLocally: (index: number) => void;
  reorderVariants?: (startIndex: number, endIndex: number) => void;
}

export default function ProductForm({
  initialData,
  categories,
  onSuccess,
  onFailure,
  isEditMode = false,
  isSaving = false,
  saveProductAndVariants,
  deleteVariantFromApi,
  taxCategories,
  formData,
  errors,
  handleProductChange,
  handleVariantChange,
  handleFileChange,
  handleRemoveImage,
  handleBlur,
  handleVariantBlur,
  clearPriceFields,
  addVariantLocally,
  removeVariantLocally,
  handleSetDefaultVariantLocally,
  reorderVariants
}: ProductFormProps) {
  const navigate = useNavigate();
  const [variantToDelete, setVariantToDelete] = useState<number | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = formData.variants.findIndex((v: any) => v._tempId === active.id);
      const newIndex = formData.variants.findIndex((v: any) => v._tempId === over.id);
      reorderVariants?.(oldIndex, newIndex);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { success, error } = await saveProductAndVariants(isEditMode, initialData?.id);

    if (success) {
      onSuccess(formData.name);
    } else {
      onFailure(error);
      console.error("Submission failed:", error);
    }
  };

  const confirmRemoveVariant = (variantId: number) => {
    setVariantToDelete(variantId);
  };

  const handleConfirmDelete = () => {
    if (variantToDelete !== null) {
      const variantId = variantToDelete;
      const variantToRemove = formData.variants.find((v: any) => v._tempId === variantId);
      if (variantToRemove && variantToRemove.id) {
        deleteVariantFromApi(variantToRemove.id, initialData.id);
      }
      removeVariantLocally(variantId);
      setVariantToDelete(null);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full pb-20">
      {/* Form Progress Indicator */}
      <div className="mb-6 p-4 bg-muted/30 rounded-lg border">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Info className="h-4 w-4" />
          <span>
            Complete all required fields marked with <span className="text-destructive">*</span> to save the product
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">

        {/* Left Column: Main Content */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* Section 1: Product Details */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 px-1">
              <span className="flex items-center justify-center h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                1
              </span>
              <h2 className="text-base font-medium text-muted-foreground">Product Details</h2>
            </div>
            <ProductDetailsSection
              formData={formData}
              errors={errors}
              handleChange={handleProductChange}
              handleBlur={handleBlur}
            />
          </div>

          {/* Section 4: Product Variants */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 px-1">
              <span className="flex items-center justify-center h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                4
              </span>
              <div className="flex-1">
                <h2 className="text-base font-medium text-muted-foreground">Product Variants</h2>
                <p className="text-sm text-muted-foreground">Define pricing, inventory, and attributes for each variant</p>
              </div>
            </div>

            <div className="grid gap-4">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={formData.variants.map((v: any) => v._tempId)}
                  strategy={verticalListSortingStrategy}
                >
                  {formData.variants.map((variant: any, index: number) => (
                    <VariantForm
                      key={variant._tempId}
                      variant={variant}
                      index={index}
                      errors={errors?.variants?.[index]}
                      isEditMode={isEditMode}
                      onVariantChange={handleVariantChange}
                      onVariantBlur={handleVariantBlur}
                      onClearPriceFields={clearPriceFields}
                      onRemoveVariant={confirmRemoveVariant}
                      showRemoveButton={formData.variants.length > 1}
                      onSetDefaultVariant={handleSetDefaultVariantLocally}
                    />
                  ))}
                </SortableContext>
              </DndContext>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full py-6 border-2 border-dashed hover:border-primary hover:bg-primary/5 text-muted-foreground hover:text-primary transition-all"
              onClick={addVariantLocally}
            >
              <Plus className="mr-2 h-5 w-5" />
              Add another variant
            </Button>
          </div>
        </div>

        {/* Right Column: Sidebar (Sticky) */}
        <div className="lg:col-span-4 flex flex-col gap-6 lg:sticky lg:top-6">
          {/* Section 2: Organization */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 px-1">
              <span className="flex items-center justify-center h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                2
              </span>
              <h2 className="text-base font-medium text-muted-foreground">Organization</h2>
            </div>
            <ProductOrganizationSection
              formData={formData}
              categories={categories}
              taxCategories={taxCategories}
              handleChange={handleProductChange}
            />
          </div>

          {/* Section 3: Media */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 px-1">
              <span className="flex items-center justify-center h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                3
              </span>
              <h2 className="text-base font-medium text-muted-foreground">Product Image</h2>
            </div>
            <ProductMediaSection
              imageUrl={formData.imageUrl}
              handleFileChange={handleFileChange}
              handleRemoveImage={handleRemoveImage}
            />
          </div>

          {/* Action Buttons */}
          <div className="bg-card border rounded-xl p-6 shadow-sm space-y-3">
            <Button
              type="submit"
              disabled={isSaving}
              className="w-full h-11 text-base font-medium transition-all hover:shadow-md"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                isEditMode ? "Update Product" : "Create Product"
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full h-11"
              onClick={() => navigate('/products')}
              disabled={isSaving}
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>

      <GenericDeleteDialog
        open={variantToDelete !== null}
        onOpenChange={(open) => !open && setVariantToDelete(null)}
        onConfirm={handleConfirmDelete}
        dialogTitle="Delete Variant?"
        itemName="this variant"
      />
    </form>
  );
};
