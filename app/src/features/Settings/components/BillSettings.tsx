import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SectionEditor from "./SectionEditor";
import BillPreview from "./BillPreview";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
import { DEFAULT_BILL_SCHEMA, BillSchema } from "@/render/billRenderer";

export default function BillSettings() {
    const [schema, setSchema] = useState<BillSchema>(DEFAULT_BILL_SCHEMA);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        async function loadSettings() {
            try {
                if ((window as any).electronAPI) {
                    const savedSchema = await (window as any).electronAPI.getBillSettings();
                    if (savedSchema) {
                        setSchema(savedSchema);
                    }
                }
            } catch (error) {
                console.error("Failed to load bill settings", error);
                toast.error("Failed to load bill settings");
            } finally {
                setLoading(false);
            }
        }
        loadSettings();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            if ((window as any).electronAPI) {
                await (window as any).electronAPI.saveBillSettings(JSON.parse(JSON.stringify(schema)));
                toast.success("Bill settings saved successfully");
            } else {
                console.log("Saving schema:", schema);
                toast.success("Settings saved successfully");
            }
        } catch (error) {
            console.error("Failed to save settings", error);
            toast.error("Failed to save settings");
        } finally {
            setSaving(false);
        }
    };

    const updateSection = (index: number, newSection: any) => {
        const newSections = [...schema.sections];
        newSections[index] = newSection;
        setSchema({ ...schema, sections: newSections });
    };

    const moveSection = (index: number, direction: number) => {
        const newSections = [...schema.sections];
        const temp = newSections[index];
        newSections[index] = newSections[index + direction];
        newSections[index + direction] = temp;
        setSchema({ ...schema, sections: newSections });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-start justify-between">
                <div>
                    <h2 className="text-lg font-semibold">Bill Structure</h2>
                    <p className="text-sm text-muted-foreground mt-1">Customize receipt layout and formatting</p>
                </div>
                <Button onClick={handleSave} disabled={saving} aria-label="Save bill settings">
                    {saving ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <Save className="mr-2 h-4 w-4" aria-hidden="true" />
                            Save Changes
                        </>
                    )}
                </Button>
            </div>

            <Separator />

            <div className="flex flex-col lg:flex-row gap-6">
                <div className="flex-1 space-y-6">
                    <Tabs defaultValue="layout" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="layout">Layout & Sections</TabsTrigger>
                            <TabsTrigger value="general">General Options</TabsTrigger>
                        </TabsList>

                        <TabsContent value="general" className="space-y-4 mt-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Format Settings</CardTitle>
                                    <CardDescription>Configure paper size, date/time formats, and currency</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="paperWidth">Paper Width</Label>
                                            <Select
                                                value={schema.paperWidth}
                                                onValueChange={(val: any) => setSchema({ ...schema, paperWidth: val })}
                                            >
                                                <SelectTrigger id="paperWidth">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="58mm">58mm (Thermal)</SelectItem>
                                                    <SelectItem value="80mm">80mm (Thermal)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="dateFormat">Date Format</Label>
                                            <Select
                                                value={schema.dateFormat}
                                                onValueChange={(val: any) => setSchema({ ...schema, dateFormat: val })}
                                            >
                                                <SelectTrigger id="dateFormat">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="standard">Standard (DD/MM/YYYY)</SelectItem>
                                                    <SelectItem value="ISO">ISO (YYYY-MM-DD)</SelectItem>
                                                    <SelectItem value="short">Short</SelectItem>
                                                    <SelectItem value="long">Long</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="timeFormat">Time Format</Label>
                                            <Select
                                                value={schema.timeFormat}
                                                onValueChange={(val: any) => setSchema({ ...schema, timeFormat: val })}
                                            >
                                                <SelectTrigger id="timeFormat">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="12h">12 Hour (AM/PM)</SelectItem>
                                                    <SelectItem value="24h">24 Hour</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="currency">Currency Symbol</Label>
                                            <Input
                                                id="currency"
                                                value={schema.currency || '₹'}
                                                onChange={(e) => setSchema({ ...schema, currency: e.target.value })}
                                                placeholder="e.g. ₹, $, €"
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="layout" className="space-y-4 mt-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Receipt Sections</CardTitle>
                                    <CardDescription>Toggle visibility and reorder sections to customize your receipt layout</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {schema.sections.map((section: any, index: number) => (
                                        <SectionEditor
                                            key={section.id}
                                            section={section}
                                            index={index}
                                            isFirst={index === 0}
                                            isLast={index === schema.sections.length - 1}
                                            onUpdate={(updated: any) => updateSection(index, updated)}
                                            onMoveUp={() => moveSection(index, -1)}
                                            onMoveDown={() => moveSection(index, 1)}
                                        />
                                    ))}
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>

                <div className="w-full lg:w-[400px] flex-shrink-0">
                    <Card className="sticky top-6">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Live Preview</CardTitle>
                            <CardDescription>{schema.paperWidth} thermal receipt</CardDescription>
                        </CardHeader>
                        <CardContent className="p-4 bg-muted/30">
                            <div className="flex justify-center">
                                <BillPreview schema={schema} />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
