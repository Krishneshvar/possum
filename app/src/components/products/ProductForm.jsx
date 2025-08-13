import { useEffect } from 'react';
import { useProductForm } from '@/hooks/useProductForm';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { RefreshCcw } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function ProductForm({ initialData, categories, onSubmit, isEditMode, isSaving }) {
  const {
    formData,
    setFormData,
    handleChange,
    handleSelectChange,
    clearPriceFields,
    getCleanData
  } = useProductForm(initialData);

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name ?? '',
        sku: initialData.sku ?? '',
        category_id: initialData.category_id ? String(initialData.category_id) : '',
        price: initialData.price ? String(initialData.price) : '',
        cost_price: initialData.cost_price ? String(initialData.cost_price) : '',
        profit_margin: initialData.profit_margin ? String(initialData.profit_margin) : '',
        stock: initialData.stock ? String(initialData.stock) : '',
        status: initialData.status ?? 'active',
      });
    }
  }, [initialData, setFormData]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const productData = getCleanData();
    onSubmit(productData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <CardContent className="space-y-4">
        <div className="flex w-full gap-4">
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select onValueChange={(value) => handleSelectChange('status', value)} value={formData.status}>
              <SelectTrigger id="status">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="discontinued">Discontinued</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Product Name</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sku">SKU</Label>
            <Input
              id="sku"
              name="sku"
              value={formData.sku}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="category_id">Category</Label>
          <Select 
            onValueChange={(value) => handleSelectChange('category_id', value)} 
            required 
            value={formData.category_id}
            key={formData.category_id}
          >
            <SelectTrigger id="category_id">
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

        <div className="flex flex-1 gap-4">
          <div className="space-y-2">
            <Label htmlFor="price">Price</Label>
            <Input
              id="price"
              name="price"
              type="number"
              value={formData.price}
              onChange={handleChange}
              step="0.01"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cost_price">Cost Price</Label>
            <Input
              id="cost_price"
              name="cost_price"
              type="number"
              value={formData.cost_price}
              onChange={handleChange}
              step="0.01"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="profit_margin">Profit Margin (%)</Label>
            <Input
              id="profit_margin"
              name="profit_margin"
              type="number"
              value={formData.profit_margin}
              onChange={handleChange}
              step="0.01"
            />
          </div>
          <div className="flex items-end">
            <Button variant="ghost" size="icon" onClick={clearPriceFields} type="button">
              <RefreshCcw className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-sm text-gray-500">
            Provide any two of the three fields above to calculate the third.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="stock">Stock</Label>
            <Input
              id="stock"
              name="stock"
              type="number"
              value={formData.stock}
              onChange={handleChange}
              required
            />
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button type="submit" disabled={isSaving}>
          {isSaving ? 'Saving...' : (isEditMode ? 'Save Changes' : 'Add Product')}
        </Button>
      </CardFooter>
    </form>
  );
}
