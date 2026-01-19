import { useGetTaxesQuery } from "@/services/taxesApi";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

export default function TaxSelector({ selectedTaxIds = [], onChange }) {
    const { data: taxes = [], isLoading } = useGetTaxesQuery();

    const handleToggle = (taxId) => {
        const isSelected = selectedTaxIds.includes(taxId);
        if (isSelected) {
            onChange("taxIds", selectedTaxIds.filter(id => id !== taxId));
        } else {
            onChange("taxIds", [...selectedTaxIds, taxId]);
        }
    };

    if (isLoading) return <div className="text-sm text-muted-foreground">Loading taxes...</div>;

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {taxes.map((tax) => {
                    const isSelected = selectedTaxIds.includes(tax.id);
                    return (
                        <div
                            key={tax.id}
                            className={`flex items-center space-x-3 p-3 rounded-lg border transition-colors relative ${isSelected
                                ? "bg-primary/5 border-primary"
                                : "bg-background border-border hover:bg-muted/50"
                                }`}
                        >
                            <Checkbox
                                id={`tax-${tax.id}`}
                                checked={isSelected}
                                onCheckedChange={() => handleToggle(tax.id)}
                                className="z-10"
                            />
                            <Label
                                htmlFor={`tax-${tax.id}`}
                                className="flex-grow flex flex-col cursor-pointer select-none"
                            >
                                <span className="text-sm font-medium leading-none">
                                    {tax.name}
                                </span>
                                <span className="text-xs text-muted-foreground mt-1">
                                    {tax.rate}% ({tax.type})
                                </span>
                            </Label>
                        </div>
                    );
                })}
            </div>

            {taxes.length === 0 && (
                <p className="text-sm text-muted-foreground italic">No taxes defined. Please add taxes in settings.</p>
            )}

            {selectedTaxIds.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2">
                    <span className="text-xs font-medium text-muted-foreground w-full mb-1">Active Taxes:</span>
                    {selectedTaxIds.map(id => {
                        const tax = taxes.find(t => t.id === id);
                        return tax ? (
                            <Badge key={id} variant="secondary" className="px-2 py-0.5">
                                {tax.name}
                            </Badge>
                        ) : null;
                    })}
                </div>
            )}
        </div>
    );
}
