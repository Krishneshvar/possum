import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Package2 } from "lucide-react";
import RequiredFieldIndicator from "@/components/common/RequiredFieldIndicator";

interface ProductDetailsSectionProps {
    formData: any;
    handleChange: (field: string, value: any) => void;
}

export default function ProductDetailsSection({
    formData,
    handleChange,
}: ProductDetailsSectionProps) {
    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <Package2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <CardTitle className="text-lg font-semibold">Product Details</CardTitle>
                        <CardDescription>Basic information about the product</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-3">
                    <Label htmlFor="name" className="text-sm font-medium">
                        Product Name <RequiredFieldIndicator />
                    </Label>
                    <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange(e.target.name, e.target.value)}
                        placeholder="e.g., Wireless Noise-Cancelling Headphones"
                        className="h-11"
                        required
                    />
                </div>

                <div className="space-y-3">
                    <Label htmlFor="description" className="text-sm font-medium">
                        Description
                    </Label>
                    <Textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleChange(e.target.name, e.target.value)}
                        placeholder="Detailed description of the product features, specs, etc..."
                        className="min-h-[120px] resize-y"
                    />
                </div>
            </CardContent>
        </Card>
    );
}
