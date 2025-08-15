import { RefreshCcw, Package, DollarSign, BarChart3, AlertTriangle } from "lucide-react"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useProductForm } from "@/hooks/useProductForm"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CardContent, CardFooter } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"

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
    console.log("Form data being sent:", productData)
    onSubmit(productData)
  }

  const getStatusVariant = (status) => {
    switch (status) {
      case "active":
        return "default"
      case "inactive":
        return "secondary"
      case "discontinued":
        return "destructive"
      default:
        return "outline"
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <CardContent>
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Package className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Product Information</h3>
              <p className="text-sm text-muted-foreground">Basic product details and identification</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="space-y-3">
              <Label htmlFor="status" className="text-sm font-medium">
                Status
              </Label>
              <Select onValueChange={(value) => handleSelectChange("status", value)} value={formData.status}>
                <SelectTrigger id="status" className="h-11">
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
                Product Name *
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
              <Label htmlFor="sku" className="text-sm font-medium">
                SKU *
              </Label>
              <Input
                id="sku"
                name="sku"
                value={formData.sku}
                onChange={handleChange}
                placeholder="Product SKU"
                className="h-11 font-mono"
                required
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label htmlFor="category_id" className="text-sm font-medium">
              Category *
            </Label>
            <Select
              onValueChange={(value) => handleSelectChange("category_id", value)}
              required
              value={formData.category_id}
              key={formData.category_id}
            >
              <SelectTrigger id="category_id" className="h-11">
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

        <Separator className="my-8" />

        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
              <DollarSign className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Pricing & Margins</h3>
              <p className="text-sm text-muted-foreground">Configure pricing strategy and profit calculations</p>
            </div>
          </div>

          <div className="rounded-lg border bg-muted/30 p-4">
            <div className="space-y-4">
              <Label className="text-sm font-medium">Auto-calculate field:</Label>
              <RadioGroup
                onValueChange={handleRadioChange}
                value={disabledField}
                className="grid grid-cols-1 sm:grid-cols-3 gap-4"
              >
                <div className="flex items-center space-x-3 rounded-lg border bg-background p-3 hover:bg-accent/50 transition-colors">
                  <RadioGroupItem value="price" id="calc-price" />
                  <Label htmlFor="calc-price" className="flex-1 cursor-pointer">
                    Selling Price
                  </Label>
                </div>
                <div className="flex items-center space-x-3 rounded-lg border bg-background p-3 hover:bg-accent/50 transition-colors">
                  <RadioGroupItem value="cost_price" id="calc-cost_price" />
                  <Label htmlFor="calc-cost_price" className="flex-1 cursor-pointer">
                    Cost Price
                  </Label>
                </div>
                <div className="flex items-center space-x-3 rounded-lg border bg-background p-3 hover:bg-accent/50 transition-colors">
                  <RadioGroupItem value="profit_margin" id="calc-profit_margin" />
                  <Label htmlFor="calc-profit_margin" className="flex-1 cursor-pointer">
                    Profit Margin
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-end">
            <div className="space-y-3">
              <Label htmlFor="price" className="text-sm font-medium">
                Selling Price *
                {disabledField === "price" && (
                  <Badge variant="secondary" className="ml-2 text-xs">
                    Auto
                  </Badge>
                )}
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  value={formData.price}
                  onChange={handleChange}
                  step="0.01"
                  disabled={disabledField === "price"}
                  className="h-11 pl-8"
                  placeholder="0.00"
                  required
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label htmlFor="cost_price" className="text-sm font-medium">
                Cost Price
                {disabledField === "cost_price" && (
                  <Badge variant="secondary" className="ml-2 text-xs">
                    Auto
                  </Badge>
                )}
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  id="cost_price"
                  name="cost_price"
                  type="number"
                  value={formData.cost_price}
                  onChange={handleChange}
                  step="0.01"
                  disabled={disabledField === "cost_price"}
                  className="h-11 pl-8"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label htmlFor="profit_margin" className="text-sm font-medium">
                Profit Margin
                {disabledField === "profit_margin" && (
                  <Badge variant="secondary" className="ml-2 text-xs">
                    Auto
                  </Badge>
                )}
              </Label>
              <div className="relative">
                <Input
                  id="profit_margin"
                  name="profit_margin"
                  type="number"
                  value={formData.profit_margin}
                  onChange={handleChange}
                  step="0.01"
                  disabled={disabledField === "profit_margin"}
                  className="h-11 pr-8"
                  placeholder="0.00"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
              </div>
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={clearPriceFields}
              type="button"
              className="h-11 w-11 shrink-0 bg-transparent"
              title="Reset pricing fields"
            >
              <RefreshCcw className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-start gap-2 rounded-lg bg-blue-50 dark:bg-blue-950/20 p-3 border border-blue-200 dark:border-blue-800">
            <AlertTriangle className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Provide any two of the three pricing fields to automatically calculate the third value.
            </p>
          </div>
        </div>

        <Separator className="my-8" />

        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/10">
              <BarChart3 className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Inventory & Tax</h3>
              <p className="text-sm text-muted-foreground">Stock management and tax configuration</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="space-y-3">
              <Label htmlFor="stock" className="text-sm font-medium">
                Current Stock
              </Label>
              <Input
                id="stock"
                name="stock"
                type="number"
                value={formData.stock}
                onChange={handleChange}
                placeholder="0"
                className="h-11"
                min="0"
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="stock_alert_cap" className="text-sm font-medium">
                Low Stock Alert
              </Label>
              <Input
                id="stock_alert_cap"
                name="stock_alert_cap"
                type="number"
                value={formData.stock_alert_cap}
                onChange={handleChange}
                placeholder="10"
                className="h-11"
                min="0"
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="product_tax" className="text-sm font-medium">
                Tax Rate
              </Label>
              <div className="relative">
                <Input
                  id="product_tax"
                  name="product_tax"
                  type="number"
                  value={formData.product_tax}
                  onChange={handleChange}
                  step="0.01"
                  placeholder="0.00"
                  className="h-11 pr-8"
                  min="0"
                  max="100"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex justify-between items-center bg-muted/30 px-6 py-4">
        <p className="text-sm text-muted-foreground">* Required fields</p>
        <Button type="submit" disabled={isSaving} className="min-w-[120px] h-11">
          {isSaving ? "Saving..." : isEditMode ? "Save Changes" : "Add Product"}
        </Button>
      </CardFooter>
    </form>
  )
}
