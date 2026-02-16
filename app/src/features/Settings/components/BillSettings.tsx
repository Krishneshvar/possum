import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
        // Fetch existing settings
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
                // Fallback for browser dev
                console.log("Saving schema:", schema);
                toast.success("Settings saved (Simulated)");
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

    if (loading) return <div className="p-8 text-center">Loading settings...</div>;

    return (
        <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-10rem)]">
            {/* Editor Panel */}
            <div className="flex-1 flex flex-col gap-4 overflow-hidden">
                <Card className="flex-1 flex flex-col overflow-hidden">
                    <CardHeader className="pb-3">
                        <div className="flex justify-between items-center">
                            <div>
                                <CardTitle>Bill Configuration</CardTitle>
                                <CardDescription>Customize your receipt layout</CardDescription>
                            </div>
                            <Button onClick={handleSave} disabled={saving}>
                                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                Save Changes
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-y-auto pr-2">
                        <Tabs defaultValue="layout" className="w-full">
                            <TabsList className="grid w-full grid-cols-2 mb-4">
                                <TabsTrigger value="layout">Layout & Sections</TabsTrigger>
                                <TabsTrigger value="general">General Options</TabsTrigger>
                            </TabsList>

                            <TabsContent value="general" className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Paper Width</Label>
                                        <Select
                                            value={schema.paperWidth}
                                            onValueChange={(val: any) => setSchema({ ...schema, paperWidth: val })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="58mm">58mm (Thermal)</SelectItem>
                                                <SelectItem value="80mm">80mm (Thermal)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Date Format</Label>
                                        <Select
                                            value={schema.dateFormat}
                                            onValueChange={(val: any) => setSchema({ ...schema, dateFormat: val })}
                                        >
                                            <SelectTrigger>
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
                                        <Label>Time Format</Label>
                                        <Select
                                            value={schema.timeFormat}
                                            onValueChange={(val: any) => setSchema({ ...schema, timeFormat: val })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="12h">12 Hour (AM/PM)</SelectItem>
                                                <SelectItem value="24h">24 Hour</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Currency Symbol</Label>
                                        <Input
                                            value={schema.currency || '₹'}
                                            onChange={(e) => setSchema({ ...schema, currency: e.target.value })}
                                            placeholder="e.g. ₹, $, €"
                                        />
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="layout" className="space-y-4">
                                <p className="text-sm text-muted-foreground mb-4">
                                    Toggle visibility and reorder sections to match your needs.
                                </p>
                                <div className="space-y-2">
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
                                </div>
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>
            </div>

            {/* Preview Panel */}
            <div className="w-full lg:w-[400px] xl:w-[450px] flex-shrink-0 border rounded-lg bg-muted/20 overflow-hidden flex flex-col">
                <div className="p-3 border-b bg-background font-medium text-sm text-center">
                    Live Preview ({schema.paperWidth})
                </div>
                <div className="flex-1 overflow-auto p-4 flex justify-center bg-gray-100 dark:bg-gray-900">
                    <BillPreview schema={schema} />
                </div>
            </div>
        </div>
    );
}
