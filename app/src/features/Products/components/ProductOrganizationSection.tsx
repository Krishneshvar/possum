import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Layers, Settings, CircleDashed } from "lucide-react";
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
            <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <Settings className="h-5 w-5 text-primary" />
                    Settings
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Status */}
                <div className="space-y-3">
                    <Label htmlFor="status" className="flex items-center gap-2">
                        Status <RequiredFieldIndicator />
                    </Label>
                    <Select
                        onValueChange={(value: string) => handleChange("status", value)}
                        value={formData.status}
                    >
                        <SelectTrigger id="status" className="w-full">
                            <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="active">
                                <div className="flex items-center gap-2">
                                    <span className="h-2 w-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                                    Active
                                </div>
                            </SelectItem>
                            <SelectItem value="inactive">
                                <div className="flex items-center gap-2">
                                    <span className="h-2 w-2 rounded-full bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.6)]" />
                                    Inactive
                                </div>
                            </SelectItem>
                            <SelectItem value="discontinued">
                                <div className="flex items-center gap-2">
                                    <span className="h-2 w-2 rounded-full bg-destructive shadow-[0_0_8px_rgba(239,68,68,0.6)]" />
                                    Discontinued
                                </div>
                            </SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Category */}
                <div className="space-y-3">
                    <Label htmlFor="category_id" className="flex items-center gap-2">
                        Category
                    </Label>
                    <div className="relative">
                        <CategorySelector
                            categories={categories}
                            value={formData.category_id}
                            onChange={handleChange}
                        />
                    </div>
                </div>

                {/* Tax Category */}
                <div className="space-y-3">
                    <Label htmlFor="tax_category_id" className="flex items-center gap-2">
                        Tax Category
                    </Label>
                    <Select
                        value={String(formData.tax_category_id || '')}
                        onValueChange={(value: string) => handleChange('tax_category_id', value)}
                    >
                        <SelectTrigger id="tax_category_id">
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
                </div>
            </CardContent>
        </Card>
    );
}
