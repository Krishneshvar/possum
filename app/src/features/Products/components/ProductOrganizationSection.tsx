import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings } from "lucide-react";
import CategorySelector from "./CategorySelector";
import RequiredFieldIndicator from "@/components/common/RequiredFieldIndicator";

interface ProductOrganizationSectionProps {
    formData: any;
    categories: any[];
    taxCategories?: any[];
    handleChange: (field: string, value: any) => void;
}

export default function ProductOrganizationSection({
    formData,
    categories,
    taxCategories,
    handleChange,
}: ProductOrganizationSectionProps) {
    return (
        <Card>
            <CardHeader className="pb-4">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Settings className="h-4 w-4 text-primary" />
                    Settings
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
                {/* Status */}
                <div className="space-y-2">
                    <Label htmlFor="status" className="text-sm font-medium">
                        Status <RequiredFieldIndicator />
                    </Label>
                    <Select
                        key={formData.status}
                        onValueChange={(value: string) => handleChange("status", value)}
                        value={formData.status?.toLowerCase().trim()}
                    >
                        <SelectTrigger id="status" className="w-full" aria-label="Product status">
                            <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="active">
                                <div className="flex items-center gap-2">
                                    <span className="h-2 w-2 rounded-full bg-green-500" />
                                    Active
                                </div>
                            </SelectItem>
                            <SelectItem value="inactive">
                                <div className="flex items-center gap-2">
                                    <span className="h-2 w-2 rounded-full bg-yellow-500" />
                                    Inactive
                                </div>
                            </SelectItem>
                            <SelectItem value="discontinued">
                                <div className="flex items-center gap-2">
                                    <span className="h-2 w-2 rounded-full bg-destructive" />
                                    Discontinued
                                </div>
                            </SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Category */}
                <div className="space-y-2">
                    <Label htmlFor="category_id" className="text-sm font-medium">
                        Category
                    </Label>
                    <CategorySelector
                        categories={categories}
                        value={formData.category_id}
                        onChange={handleChange}
                    />
                </div>

                {/* Tax Category */}
                <div className="space-y-2">
                    <Label htmlFor="tax_category_id" className="text-sm font-medium">
                        Tax Category
                    </Label>
                    <Select
                        key={`${formData.tax_category_id || ""}-${taxCategories?.length || 0}`}
                        value={String(formData.tax_category_id || '')}
                        onValueChange={(value: string) => handleChange('tax_category_id', value)}
                    >
                        <SelectTrigger id="tax_category_id" aria-label="Tax category">
                            <SelectValue placeholder="Select Tax Category" />
                        </SelectTrigger>
                        <SelectContent>
                            {taxCategories?.length ? (
                                taxCategories.map((tc) => (
                                    <SelectItem key={tc.id} value={String(tc.id)}>
                                        {tc.name}
                                    </SelectItem>
                                ))
                            ) : (
                                <div className="p-2 text-sm text-muted-foreground text-center">
                                    No tax categories available
                                </div>
                            )}
                        </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                        Tax rules applied to this product
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}
