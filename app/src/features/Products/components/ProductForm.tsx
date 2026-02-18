import { Button } from "@/components/ui/button";
import { Loader2, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

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
  // Passed from parent hook
  formData: any;
  handleProductChange: (field: string, value: any) => void;
  handleVariantChange: (index: number, field: string, value: any) => void;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleRemoveImage: () => void;
  clearPriceFields: (index: number) => void;
  addVariantLocally: () => void;
  removeVariantLocally: (tempId: number) => void;
  handleSetDefaultVariantLocally: (index: number) => void;
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
  handleProductChange,
  handleVariantChange,
  handleFileChange,
  handleRemoveImage,
  clearPriceFields,
  addVariantLocally,
  removeVariantLocally,
  handleSetDefaultVariantLocally
}: ProductFormProps) {
  const navigate = useNavigate();

  const [variantToDelete, setVariantToDelete] = useState<number | null>(null);

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
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">

        {/* Left Column: Main Content */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <ProductDetailsSection
            formData={formData}
            handleChange={handleProductChange}
          />

          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <div className="space-y-1">
                <h3 className="text-lg font-semibold tracking-tight">Product Variants</h3>
                <p className="text-sm text-muted-foreground">Manage pricing, stock, and attributes for each variant.</p>
              </div>
              {/* 
                  The Add Variant button is also available at the bottom, 
                  but strictly adhering to "No hidden actions", having it here is also good.
                */}
            </div>

            <div className="grid gap-4">
              {formData.variants.map((variant: any, index: number) => (
                <VariantForm
                  key={variant._tempId}
                  variant={variant}
                  index={index}
                  isEditMode={isEditMode}
                  onVariantChange={handleVariantChange}
                  onClearPriceFields={clearPriceFields}
                  onRemoveVariant={confirmRemoveVariant}
                  showRemoveButton={formData.variants.length > 1}
                  onSetDefaultVariant={handleSetDefaultVariantLocally}
                />
              ))}
            </div>

            <Button
              type="button"
              variant="ghost"
              className="w-full py-8 border-2 border-dashed border-border hover:border-primary/50 text-muted-foreground hover:text-primary transition-all duration-200 hover:bg-muted/50"
              onClick={addVariantLocally}
            >
              <Plus className="mr-2 h-5 w-5" />
              Add another variant
            </Button>
          </div>
        </div>

        {/* Right Column: Sidebar (Sticky) */}
        <div className="lg:col-span-4 flex flex-col gap-6 lg:sticky lg:top-6">
          <ProductOrganizationSection
            formData={formData}
            categories={categories}
            taxCategories={taxCategories}
            handleChange={handleProductChange}
          />

          <ProductMediaSection
            imageUrl={formData.imageUrl}
            handleFileChange={handleFileChange}
            handleRemoveImage={handleRemoveImage}
          />

          <div className="bg-card border rounded-xl p-6 shadow-sm space-y-4">
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
            >
              Discard Changes
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
