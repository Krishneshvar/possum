import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Package, Upload, X } from "lucide-react";
import RequiredFieldIndicator from "@/components/common/RequiredFieldIndicator";
import CategorySelector from "./CategorySelector";
import { useEffect, useRef } from "react";

interface ProductInformationProps {
    formData: any;
    handleChange: (field: string, value: any) => void;
    handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    imageUrl: string | null;
    handleRemoveImage: () => void;
    categories: any[];
    taxCategories?: any[];
}

export default function ProductInformation({
    formData,
    handleChange,
    handleFileChange,
    imageUrl,
    handleRemoveImage,
    categories,
    taxCategories
}: ProductInformationProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (imageUrl && imageUrl.startsWith('blob:')) {
        URL.revokeObjectURL(imageUrl);
      }
    };
  }, [imageUrl]);

  const handleButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <Card>
      <CardContent className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Package className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Product Information</h3>
            <p className="text-sm text-muted-foreground">Basic product details</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-3">
            <Label htmlFor="status" className="text-sm font-medium">
              Status <RequiredFieldIndicator />
            </Label>
            <Select
              onValueChange={(value) => handleChange("status", value)}
              value={formData.status}
            >
              <SelectTrigger id="status" className="w-full py-[1.3rem]">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                    Active
                  </div>
                </SelectItem>
                <SelectItem value="inactive">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-yellow-500" />
                    Inactive
                  </div>
                </SelectItem>
                <SelectItem value="discontinued">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-destructive" />
                    Discontinued
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label htmlFor="name" className="text-sm font-medium">
              Product Name <RequiredFieldIndicator />
            </Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={(e) => handleChange(e.target.name, e.target.value)}
              placeholder="Enter product name"
              className="h-11"
              required
            />
          </div>

          <div className="space-y-3">
            <Label htmlFor="category_id" className="text-sm font-medium">
              Product Category
            </Label>
            <CategorySelector
              categories={categories}
              value={formData.category_id}
              onChange={handleChange}
            />
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-medium">
              Tax Category
            </Label>
            <Select
              value={String(formData.tax_category_id || '')}
              onValueChange={(value) => handleChange('tax_category_id', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Tax Category" />
              </SelectTrigger>
              <SelectContent>
                {taxCategories?.map((tc) => (
                  <SelectItem key={tc.id} value={String(tc.id)}>
                    {tc.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-6">
          <div className="flex flex-col space-y-3 flex-grow">
            <Label htmlFor="image">Product Image</Label>
            <div className="flex justify-center items-center border-2 border-border border-dashed bg-muted/50 rounded-lg flex-grow relative">
              {imageUrl && (
                <div className="absolute top-2 right-2 z-10">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={handleRemoveImage}
                    className="h-6 w-6 rounded-full bg-background/70 backdrop-blur-sm hover:bg-background text-muted-foreground hover:text-destructive"
                    title="Remove image"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt="Product preview"
                  className="max-h-[200px] object-contain rounded-lg p-2"
                />
              ) : (
                <Label htmlFor="image" className="cursor-pointer">
                  <Button
                    variant="outline"
                    type="button"
                    className="cursor-pointer"
                    onClick={handleButtonClick}
                  >
                    <Upload className="mr-2" />
                    Upload image
                  </Button>
                </Label>
              )}
              <Input
                id="image"
                name="image"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                ref={fileInputRef}
              />
            </div>
          </div>
          <div className="flex flex-col space-y-3 flex-grow">
            <Label htmlFor="description">Product Description</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={(e) => handleChange(e.target.name, e.target.value)}
              placeholder="Enter product description..."
              className="flex-grow"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
