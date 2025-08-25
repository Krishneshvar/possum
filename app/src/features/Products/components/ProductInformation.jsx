import { Package, Upload } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import RequiredFieldIndicator from "@/components/common/RequiredFieldIndicator";

import CategorySelector from "./CategorySelector";

export default function ProductInformation({ formData, categories, handleSelectChange, handleChange }) {
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

          <div className="space-y-3">
            <Label htmlFor="name" className="text-sm font-medium">
              Product Category
            </Label>
            <CategorySelector
              categories={categories}
              value={formData.category_id}
              onChange={handleSelectChange}
            />
          </div>

          <div className="space-y-3">
            <Label htmlFor="tax" className="text-sm font-medium">
              Product Tax
            </Label>
            <Input
              id="tax"
              name="tax"
              type="number"
              // value={}
              // onChange={}
              step="0.01"
              className="h-11 pl-8"
              placeholder="0.00"
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-6">
          <div className="flex flex-col space-y-3 flex-grow">
            <Label>Product Image</Label>
            <div className="flex justify-center items-center border-2 border-slate-200 border-dashed bg-slate-50 rounded-lg flex-grow cursor-pointer">
              <Button
                variant="outline"
                type="button"
                className="cursor-pointer"
              >
                <Upload />
                Upload image
              </Button>
            </div>
          </div>
          <div className="flex flex-col space-y-3 flex-grow">
            <Label>Product Description</Label>
            <Textarea placeholder="Enter product description..." className="flex-grow" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
