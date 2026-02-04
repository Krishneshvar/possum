import React, { useState } from 'react';
import BillSettings from '../components/BillSettings';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('bill');

  return (
    <div className="h-full flex flex-col p-6 overflow-hidden">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      <div className="flex h-full gap-6">
        {/* Sidebar/Tabs */}
        <div className="w-64 flex-shrink-0 space-y-2">
          <button
            onClick={() => setActiveTab('general')}
            className={`w-full text-left px-4 py-2 rounded-md ${activeTab === 'general' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
          >
            General
          </button>
          <button
            onClick={() => setActiveTab('bill')}
            className={`w-full text-left px-4 py-2 rounded-md ${activeTab === 'bill' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
          >
            Bill Structure
          </button>
          <button
            onClick={() => setActiveTab('printers')}
            className={`w-full text-left px-4 py-2 rounded-md ${activeTab === 'printers' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
          >
            Printers
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-white dark:bg-gray-900 rounded-lg shadow-sm border p-6 overflow-auto">
          {activeTab === 'general' && (
            <div>
              <h2 className="text-lg font-semibold mb-4">General Settings</h2>
              <p className="text-gray-500">General application settings will go here.</p>
            </div>
          )}

          {activeTab === 'bill' && <BillSettings />}

          {activeTab === 'printers' && (
            <div>
              <h2 className="text-lg font-semibold mb-4">Printer Configuration</h2>
              <p className="text-gray-500">Printer connection settings will go here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
