import { Button } from "@/components/ui/button";
import { CardContent, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import { useProductForm } from "@/features/Products/hooks/useProductForm";
import ProductInformation from "./ProductInformation";
import ProductPricings from "./ProductPricings";
import ProductInventory from "./ProductInventory";
import RequiredFieldIndicator from "@/components/common/RequiredFieldIndicator";

export default function ProductForm({ initialData, categories, onSubmit, isEditMode, isSaving }) {
  const {
    formData,
    handleChange,
    handleSelectChange,
    handleRadioChange,
    disabledField,
    clearPriceFields,
    getCleanData,
  } = useProductForm(initialData)

  const handleSubmit = (e) => {
    e.preventDefault()
    const productData = getCleanData()
    console.log("Form data being sent 2:", productData)
    onSubmit(productData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <CardContent>
        <ProductInformation
          formData={formData}
          categories={categories}
          handleSelectChange={handleSelectChange}
          handleChange={handleChange}
        />

        <Separator className="my-8" />

        <ProductPricings
          formData={formData}
          handleChange={handleChange}
          handleRadioChange={handleRadioChange}
          disabledField={disabledField}
          clearPriceFields={clearPriceFields}
        />

        <Separator className="my-8" />

        <ProductInventory
          formData={formData}
          handleChange={handleChange}
        />
      </CardContent>

      <CardFooter className="flex justify-between items-center bg-muted/30 px-6 py-4">
        <p className="text-sm text-muted-foreground"> <RequiredFieldIndicator /> Required fields</p>
        <Button type="submit" disabled={isSaving} className="min-w-[120px] h-11">
          {isSaving ? "Saving..." : isEditMode ? "Save Changes" : "Add Product"}
        </Button>
      </CardFooter>
    </form>
  );
};
