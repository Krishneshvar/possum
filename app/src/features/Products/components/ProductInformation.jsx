import { Package } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

import RequiredFieldIndicator from "@/components/common/RequiredFieldIndicator";

export default function ProductInformation({ formData, categories, handleSelectChange, handleChange }) {
  return (
    <div className="space-y-6">
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
          <Select onValueChange={(value) => handleSelectChange("status", value)} value={formData.status}>
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
                  <div className="h-2 w-2 rounded-full bg-red-500" />
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
            onChange={handleChange}
            placeholder="Enter product name"
            className="h-11"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-3">
          <Label htmlFor="category_id" className="text-sm font-medium">
            Category
          </Label>
          <Select
            onValueChange={(value) => handleSelectChange("category_id", value)}
            value={formData.category_id}
            key={formData.category_id}
          >
            <SelectTrigger id="category_id" className="w-full py-[1.3rem]">
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category.id} value={String(category.id)}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};
