import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Package2 } from "lucide-react";
import RequiredFieldIndicator from "@/components/common/RequiredFieldIndicator";

interface ProductDetailsSectionProps {
    formData: any;
    errors?: any;
    handleChange: (field: string, value: any) => void;
    handleBlur?: (field: string) => void;
}

export default function ProductDetailsSection({
    formData,
    errors,
    handleChange,
    handleBlur,
}: ProductDetailsSectionProps) {
    return (
        <Card>
            <CardHeader className="pb-4">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <Package2 className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                        <CardTitle className="text-base font-semibold">Product Details</CardTitle>
                        <CardDescription className="text-sm">Basic information about the product</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-5">
                <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-medium">
                        Product Name <RequiredFieldIndicator />
                    </Label>
                    <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange(e.target.name, e.target.value)}
                        onBlur={() => handleBlur?.('name')}
                        placeholder="e.g., Wireless Noise-Cancelling Headphones"
                        className="h-11"
                        required
                        aria-required="true"
                        aria-invalid={!!errors?.name}
                    />
                    {errors?.name && (
                        <p className="text-xs text-destructive mt-1">{errors.name}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="description" className="text-sm font-medium">
                        Description
                    </Label>
                    <Textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleChange(e.target.name, e.target.value)}
                        placeholder="Describe the product features, specifications, and benefits..."
                        className="min-h-[120px] resize-y"
                        aria-label="Product description"
                    />
                </div>
            </CardContent>
        </Card>
    );
}
