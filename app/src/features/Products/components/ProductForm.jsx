import { Plus, Split } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useProductAndVariantForm } from "@/features/Products/hooks/useProductAndVariantForm";
import ProductInformation from "./ProductInformation";
import VariantForm from "./VariantForm";
import RequiredFieldIndicator from "@/components/common/RequiredFieldIndicator";

export default function ProductForm({ initialData, categories, onSuccess, onFailure, isEditMode, isSaving }) {
  const {
    formData,
    handleProductChange,
    handleVariantChange,
    handleFileChange,
    handleRemoveImage,
    clearPriceFields,
    addVariantLocally,
    removeVariantLocally,
    handleSetDefaultVariantLocally,
    saveProductAndVariants,
    deleteVariantFromApi,
  } = useProductAndVariantForm(initialData);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { success, error } = await saveProductAndVariants(isEditMode, initialData?.id);
    
    if (success) {
      onSuccess(formData.name);
    } else {
      onFailure(error);
      console.error("Submission failed:", error);
    }
  };

  const handleRemoveVariant = (variantId) => {
    const variantToRemove = formData.variants.find(v => v._tempId === variantId);
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
        isEditMode={isEditMode}
      />
      <Separator className="my-4" />
      <div className="space-y-6">
        <Card>
          <CardContent className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/10">
              <span className="h-5 w-5 text-indigo-600">
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
          {formData.variants.map((variant, index) => (
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
            variant="outline"
            className="mx-auto bg-black text-white hover:bg-gray-700 hover:text-white cursor-pointer"
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
          className="bg-blue-600 hover:bg-blue-700 cursor-pointer"
        >
          Save
        </Button>
      </Card>
    </form>
  );
};
