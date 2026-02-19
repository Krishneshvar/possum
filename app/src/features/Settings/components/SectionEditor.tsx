import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ChevronUp, ChevronDown } from 'lucide-react';

interface SectionEditorProps {
    section: any;
    index: number;
    isFirst: boolean;
    isLast: boolean;
    onUpdate: (updated: any) => void;
    onMoveUp: () => void;
    onMoveDown: () => void;
}

export default function SectionEditor({ section, isFirst, isLast, onUpdate, onMoveUp, onMoveDown }: SectionEditorProps) {
    const handleChange = (field: string, value: any) => {
        onUpdate({ ...section, [field]: value });
    };

    const handleOptionChange = (option: string, value: any) => {
        onUpdate({
            ...section,
            options: { ...section.options, [option]: value }
        });
    };

    const sectionLabel = section.id.replace(/([A-Z])/g, ' $1').trim();

    return (
        <div className="border rounded-lg p-4 bg-card shadow-sm">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                    <Checkbox
                        id={`section-${section.id}`}
                        checked={section.visible}
                        onCheckedChange={(checked) => handleChange('visible', checked)}
                        aria-label={`Toggle ${sectionLabel} section visibility`}
                    />
                    <Label 
                        htmlFor={`section-${section.id}`}
                        className="font-medium capitalize cursor-pointer"
                    >
                        {sectionLabel}
                    </Label>
                </div>

                <div className="flex gap-1">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={onMoveUp}
                        disabled={isFirst}
                        aria-label={`Move ${sectionLabel} section up`}
                        className="h-8 w-8"
                    >
                        <ChevronUp className="h-4 w-4" aria-hidden="true" />
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={onMoveDown}
                        disabled={isLast}
                        aria-label={`Move ${sectionLabel} section down`}
                        className="h-8 w-8"
                    >
                        <ChevronDown className="h-4 w-4" aria-hidden="true" />
                    </Button>
                </div>
            </div>

            {section.visible && (
                <div className="pl-8 pt-3 space-y-4 border-t">
                    <div className="grid grid-cols-2 gap-4">
                        {section.options.alignment && (
                            <div className="space-y-2">
                                <Label htmlFor={`${section.id}-alignment`}>Alignment</Label>
                                <Select
                                    value={section.options.alignment}
                                    onValueChange={(val) => handleOptionChange('alignment', val)}
                                >
                                    <SelectTrigger id={`${section.id}-alignment`}>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="left">Left</SelectItem>
                                        <SelectItem value="center">Center</SelectItem>
                                        <SelectItem value="right">Right</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        {section.options.fontSize && (
                            <div className="space-y-2">
                                <Label htmlFor={`${section.id}-fontSize`}>Font Size</Label>
                                <Select
                                    value={section.options.fontSize}
                                    onValueChange={(val) => handleOptionChange('fontSize', val)}
                                >
                                    <SelectTrigger id={`${section.id}-fontSize`}>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="small">Small</SelectItem>
                                        <SelectItem value="medium">Medium</SelectItem>
                                        <SelectItem value="large">Large</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                    </div>

                    {section.id === 'storeHeader' && (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="storeName">Store Name</Label>
                                <Input
                                    id="storeName"
                                    type="text"
                                    value={section.options.storeName || ''}
                                    onChange={(e) => handleOptionChange('storeName', e.target.value)}
                                    placeholder="Enter store name"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="storeDetails">Store Details</Label>
                                <Textarea
                                    id="storeDetails"
                                    value={section.options.storeDetails || ''}
                                    onChange={(e) => handleOptionChange('storeDetails', e.target.value)}
                                    rows={2}
                                    placeholder="Address, contact information, etc."
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Phone</Label>
                                    <Input
                                        id="phone"
                                        type="text"
                                        value={section.options.phone || ''}
                                        onChange={(e) => handleOptionChange('phone', e.target.value)}
                                        placeholder="Phone number"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="gst">GSTIN</Label>
                                    <Input
                                        id="gst"
                                        type="text"
                                        value={section.options.gst || ''}
                                        onChange={(e) => handleOptionChange('gst', e.target.value)}
                                        placeholder="GST number"
                                    />
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Checkbox
                                    id="showLogo"
                                    checked={section.options.showLogo}
                                    onCheckedChange={(checked) => handleOptionChange('showLogo', checked)}
                                />
                                <Label htmlFor="showLogo" className="cursor-pointer">Show Logo</Label>
                            </div>
                            {section.options.showLogo && (
                                <div className="space-y-2">
                                    <Label htmlFor="logoUrl">Logo URL / Base64</Label>
                                    <Input
                                        id="logoUrl"
                                        type="text"
                                        placeholder="data:image/png;base64,..."
                                        value={section.options.logoUrl || ''}
                                        onChange={(e) => handleOptionChange('logoUrl', e.target.value)}
                                    />
                                    <div className="space-y-1">
                                        <Label htmlFor="logoFile" className="text-xs text-muted-foreground">Or upload image</Label>
                                        <Input
                                            id="logoFile"
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    const reader = new FileReader();
                                                    reader.onloadend = () => handleOptionChange('logoUrl', reader.result);
                                                    reader.readAsDataURL(file);
                                                }
                                            }}
                                            className="text-sm"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {section.id === 'footer' && (
                        <div className="space-y-2">
                            <Label htmlFor="footerText">Footer Text</Label>
                            <Textarea
                                id="footerText"
                                value={section.options.text || ''}
                                onChange={(e) => handleOptionChange('text', e.target.value)}
                                rows={3}
                                placeholder="Thank you message, terms, etc."
                            />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
