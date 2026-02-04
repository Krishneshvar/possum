import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import BillPreview from './BillPreview';
import SectionEditor from './SectionEditor';
import { DEFAULT_BILL_SCHEMA } from '../../../render/billRenderer';

export default function BillSettings() {
    const [schema, setSchema] = useState(DEFAULT_BILL_SCHEMA);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    useEffect(() => {
        if (window.electronAPI) {
            window.electronAPI.getBillSettings()
                .then(saved => {
                    if (saved) setSchema(saved);
                })
                .catch(err => console.error("Failed to load settings", err));
        }
    }, []);

    const handleSectionUpdate = (index, updatedSection) => {
        const newSections = [...schema.sections];
        newSections[index] = updatedSection;
        updateSchema({ ...schema, sections: newSections });
    };

    const handleMoveSection = (index, direction) => {
        const newSections = [...schema.sections];
        const section = newSections[index];
        newSections.splice(index, 1);
        newSections.splice(index + direction, 0, section);
        updateSchema({ ...schema, sections: newSections });
    };

    const handlePaperWidthChange = (width) => {
        updateSchema({ ...schema, paperWidth: width });
    };

    const updateSchema = (newSchema) => {
        setSchema(newSchema);
        setHasUnsavedChanges(true);
    };

    const handleSave = async () => {
        // TODO: Implement actual save logic via IPC
        console.log('Saving schema:', JSON.stringify(schema, null, 2));
        if (window.electronAPI) {
            try {
                await window.electronAPI.saveBillSettings(schema);
                toast.success('Settings saved successfully!');
            } catch (error) {
                console.error("Failed to save settings via IPC", error);
                toast.error('Failed to save settings');
            }
        }
        setHasUnsavedChanges(false);
    };

    const handleFormatChange = (field, value) => {
        updateSchema({ ...schema, [field]: value });
    };

    return (
        <div className="h-[calc(100vh-100px)] flex flex-col">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Bill Structure & Layout</h2>
                <div className="flex gap-4 items-center flex-wrap">
                    <div className="flex flex-col">
                        <label className="text-xs text-gray-500">Paper Width</label>
                        <select
                            value={schema.paperWidth}
                            onChange={(e) => handlePaperWidthChange(e.target.value)}
                            className="border rounded p-1 text-sm bg-white dark:bg-gray-800"
                        >
                            <option value="58mm">58mm (2 inch)</option>
                            <option value="80mm">80mm (3 inch)</option>
                        </select>
                    </div>

                    <div className="flex flex-col">
                        <label className="text-xs text-gray-500">Date Format</label>
                        <select
                            value={schema.dateFormat || 'standard'}
                            onChange={(e) => handleFormatChange('dateFormat', e.target.value)}
                            className="border rounded p-1 text-sm bg-white dark:bg-gray-800"
                        >
                            <option value="standard">Standard (Local)</option>
                            <option value="ISO">ISO (YYYY-MM-DD)</option>
                            <option value="short">Short (MM/DD/YY)</option>
                            <option value="long">Long (Month DD, YYYY)</option>
                        </select>
                    </div>

                    <div className="flex flex-col">
                        <label className="text-xs text-gray-500">Time Format</label>
                        <select
                            value={schema.timeFormat || '12h'}
                            onChange={(e) => handleFormatChange('timeFormat', e.target.value)}
                            className="border rounded p-1 text-sm bg-white dark:bg-gray-800"
                        >
                            <option value="12h">12 Hour (AM/PM)</option>
                            <option value="24h">24 Hour</option>
                        </select>
                    </div>

                    <button
                        onClick={handleSave}
                        disabled={!hasUnsavedChanges}
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed self-end"
                    >
                        Save Changes
                    </button>
                </div>
            </div>

            <div className="flex gap-6 h-full overflow-hidden">
                {/* Editor Column */}
                <div className="w-1/2 overflow-y-auto pr-2">
                    <div className="space-y-4">
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-md text-sm text-blue-800 dark:text-blue-200">
                            Customize your receipt layout. Toggle sections, reorder them, and adjust alignment to match your brand.
                        </div>

                        {schema.sections.map((section, index) => (
                            <SectionEditor
                                key={section.id}
                                section={section}
                                isFirst={index === 0}
                                isLast={index === schema.sections.length - 1}
                                onUpdate={(updated) => handleSectionUpdate(index, updated)}
                                onMoveUp={() => handleMoveSection(index, -1)}
                                onMoveDown={() => handleMoveSection(index, 1)}
                            />
                        ))}
                    </div>
                </div>

                {/* Preview Column */}
                <div className="w-1/2 h-full">
                    <BillPreview schema={schema} />
                </div>
            </div>
        </div>
    );
}
