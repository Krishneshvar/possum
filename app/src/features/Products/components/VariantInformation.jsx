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

export default function VariantInformation({ variant, onVariantChange }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="space-y-3">
        <Label htmlFor={`status-${variant._tempId}`} className="text-sm font-medium">
          Status <RequiredFieldIndicator />
        </Label>
        <Select
          onValueChange={(value) => onVariantChange(variant._tempId, 'status', value)}
          value={variant.status}
        >
          <SelectTrigger id={`status-${variant._tempId}`} className="w-full py-[1.3rem]">
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
        <Label htmlFor={`variant-name-${variant._tempId}`} className="text-sm font-medium">
          Variant Name <RequiredFieldIndicator />
        </Label>
        <Input
          id={`variant-name-${variant._tempId}`}
          name="name"
          value={variant.name}
          onChange={(e) => onVariantChange(variant._tempId, e.target.name, e.target.value)}
          placeholder="e.g. Red, Size L"
          className="h-11"
          required
        />
      </div>
      <div className="space-y-3">
        <Label htmlFor={`sku-${variant._tempId}`} className="text-sm font-medium">
          SKU
        </Label>
        <Input
          id={`sku-${variant._tempId}`}
          name="sku"
          value={variant.sku}
          onChange={(e) => onVariantChange(variant._tempId, e.target.name, e.target.value)}
          placeholder="Variant SKU"
          className="h-11 font-mono"
          required
        />
      </div>
    </div>
  );
}
