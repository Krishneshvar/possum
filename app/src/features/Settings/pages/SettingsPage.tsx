import { useState } from 'react';
import BillSettings from '../components/BillSettings';
import GeneralSettings from '../components/GeneralSettings';
import TaxManagement from '../TaxManagement/TaxManagement';
import PrinterSettings from '../components/PrinterSettings';
import { cn } from '@/lib/utils';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general');

  const tabs = [
    { id: 'general', label: 'General' },
    { id: 'bill', label: 'Bill Structure' },
    { id: 'taxes', label: 'Tax Management' },
    { id: 'printers', label: 'Printers' },
  ];

  return (
    <div className="h-full flex flex-col p-6 overflow-hidden">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      <div className="flex h-full gap-6">
        {/* Sidebar/Tabs */}
        <div className="w-64 flex-shrink-0 space-y-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "w-full text-left px-4 py-2 rounded-md transition-colors",
                activeTab === tab.id
                  ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200 font-medium"
                  : "hover:bg-gray-100 dark:hover:bg-gray-800"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-white dark:bg-gray-900 rounded-lg shadow-sm border p-6 overflow-auto">
          {activeTab === 'general' && <GeneralSettings />}
          {activeTab === 'bill' && <BillSettings />}
          {activeTab === 'taxes' && <TaxManagement />}
          {activeTab === 'printers' && <PrinterSettings />}
        </div>
      </div>
    </div>
  );
};
