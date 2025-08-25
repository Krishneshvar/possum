import { Split } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import { useProductAndVariantForm } from "@/features/Products/hooks/useProductAndVariantForm";
import ProductInformation from "./ProductInformation";
import VariantForm from "./VariantForm";
import RequiredFieldIndicator from "@/components/common/RequiredFieldIndicator";

export default function ProductForm({ initialData, categories, onSubmit, isEditMode, isSaving }) {
  const {
    formData,
    handleProductChange,
    handleProductSelectChange,
    handleVariantChange,
    handleVariantSelectChange,
    handleRadioChange,
    clearPriceFields,
    addVariant,
    removeVariant,
    getCleanData,
  } = useProductAndVariantForm(initialData);

  const handleSubmit = (e) => {
    e.preventDefault();
    const productData = getCleanData();
    console.log("Form data being sent:", productData);
    onSubmit(productData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <ProductInformation
        formData={formData}
        categories={categories}
        handleSelectChange={handleProductSelectChange}
        handleChange={handleProductChange}
      />

      <Separator className="my-8" />

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
              onSelectChange={handleVariantSelectChange}
              onRadioChange={handleRadioChange}
              onClearPriceFields={clearPriceFields}
              onRemoveVariant={removeVariant}
              showRemoveButton={formData.variants.length > 1}
            />
          ))}
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={addVariant}
        >
          Add another variant
        </Button>
      </div>

      <CardFooter className="flex justify-between items-center bg-muted/30 px-6 py-4">
        <p className="text-sm text-muted-foreground"> <RequiredFieldIndicator /> Required fields</p>
        <Button type="submit" disabled={isSaving} className="min-w-[120px] h-11">
          {isSaving ? "Saving..." : isEditMode ? "Save Changes" : "Add Product"}
        </Button>
      </CardFooter>
    </form>
  );
};
