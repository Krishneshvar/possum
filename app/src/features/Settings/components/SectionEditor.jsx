import React from 'react';

export default function SectionEditor({ section, isFirst, isLast, onUpdate, onMoveUp, onMoveDown }) {
    const handleChange = (field, value) => {
        onUpdate({ ...section, [field]: value });
    };

    const handleOptionChange = (option, value) => {
        onUpdate({
            ...section,
            options: { ...section.options, [option]: value }
        });
    };

    return (
        <div className="border rounded-md p-4 mb-3 bg-white dark:bg-gray-800 shadow-sm">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                    <input
                        type="checkbox"
                        checked={section.visible}
                        onChange={(e) => handleChange('visible', e.target.checked)}
                        className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="font-medium capitalize text-gray-900 dark:text-gray-100">
                        {section.id.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                </div>

                <div className="flex gap-1">
                    <button
                        onClick={onMoveUp}
                        disabled={isFirst}
                        className="p-1 px-2 text-sm bg-gray-100 hover:bg-gray-200 rounded disabled:opacity-50 text-gray-700 font-mono"
                        title="Move Up"
                    >
                        ↑
                    </button>
                    <button
                        onClick={onMoveDown}
                        disabled={isLast}
                        className="p-1 px-2 text-sm bg-gray-100 hover:bg-gray-200 rounded disabled:opacity-50 text-gray-700 font-mono"
                        title="Move Down"
                    >
                        ↓
                    </button>
                </div>
            </div>

            {section.visible && (
                <div className="pl-8 pt-2 grid grid-cols-2 gap-4 text-sm">
                    {section.options.alignment && (
                        <div>
                            <label className="block text-gray-500 mb-1">Alignment</label>
                            <select
                                value={section.options.alignment}
                                onChange={(e) => handleOptionChange('alignment', e.target.value)}
                                className="w-full border rounded p-1 dark:bg-gray-700 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                            >
                                <option value="left">Left</option>
                                <option value="center">Center</option>
                                <option value="right">Right</option>
                            </select>
                        </div>
                    )}

                    {section.options.fontSize && (
                        <div>
                            <label className="block text-gray-500 mb-1">Font Size</label>
                            <select
                                value={section.options.fontSize}
                                onChange={(e) => handleOptionChange('fontSize', e.target.value)}
                                className="w-full border rounded p-1 dark:bg-gray-700 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                            >
                                <option value="small">Small</option>
                                <option value="medium">Medium</option>
                                <option value="large">Large</option>
                            </select>
                        </div>
                    )}

                    {section.id === 'footer' && (
                        <div className="col-span-2">
                            <label className="block text-gray-500 mb-1">Footer Text</label>
                            <input
                                type="text"
                                value={section.options.text || ''}
                                onChange={(e) => handleOptionChange('text', e.target.value)}
                                className="w-full border rounded p-1 dark:bg-gray-700 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                            />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
