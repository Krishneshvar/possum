import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Split, Plus, Loader2 } from "lucide-react";
import RequiredFieldIndicator from "@/components/common/RequiredFieldIndicator";

import ProductInformation from "./ProductInformation";
import VariantForm from "./VariantForm";

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

  const handleRemoveVariant = (variantId: number) => {
    const variantToRemove = formData.variants.find((v: any) => v._tempId === variantId);
    if (variantToRemove && variantToRemove.id) {
      deleteVariantFromApi(variantToRemove.id, initialData.id);
    }
    removeVariantLocally(variantId);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 mb-6">
      <ProductInformation
        formData={formData}
        categories={categories}
        handleChange={handleProductChange}
        handleFileChange={handleFileChange}
        handleRemoveImage={handleRemoveImage}
        imageUrl={formData.imageUrl}
        taxCategories={taxCategories}
      />
      <Separator className="my-4" />
      <div className="space-y-6">
        <Card>
          <CardContent className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <span className="h-5 w-5 text-primary">
                <Split />
              </span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Variants</h3>
              <p className="text-sm text-muted-foreground">Add and manage different versions of your product.</p>
            </div>
          </CardContent>
        </Card>
        <div className="space-y-6">
          {formData.variants.map((variant: any, index: number) => (
            <VariantForm
              key={variant._tempId}
              variant={variant}
              index={index}
              isEditMode={isEditMode}
              onVariantChange={handleVariantChange}
              onClearPriceFields={clearPriceFields}
              onRemoveVariant={handleRemoveVariant}
              showRemoveButton={formData.variants.length > 1}
              onSetDefaultVariant={handleSetDefaultVariantLocally}
            />
          ))}
        </div>
        <div className="flex">
          <Button
            type="button"
            variant="secondary"
            className="mx-auto cursor-pointer"
            onClick={addVariantLocally}
          >
            <Plus />
            Add variant
          </Button>
        </div>
      </div>
      <Card className="flex flex-row justify-between items-center px-6 py-4">
        <p className="text-sm text-muted-foreground"> <RequiredFieldIndicator /> Required fields</p>
        <Button
          type="submit"
          disabled={isSaving}
          className="cursor-pointer min-w-[100px]"
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save"
          )}
        </Button>
      </Card>
    </form>
  );
};
