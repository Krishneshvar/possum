import { useState, useEffect } from 'react';
import BillSettings from '../components/BillSettings';
import GeneralSettings from '../components/GeneralSettings';
import TaxManagement from '../TaxManagement/TaxManagement';
import PrinterSettings from '../components/PrinterSettings';
import { cn } from '@/lib/utils';
import { Settings2, Receipt, Calculator, Printer } from 'lucide-react';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general');

  const tabs = [
    { id: 'general', label: 'General', icon: Settings2, description: 'Application preferences' },
    { id: 'bill', label: 'Bill Structure', icon: Receipt, description: 'Receipt layout & format' },
    { id: 'taxes', label: 'Tax Management', icon: Calculator, description: 'Tax profiles & rules' },
    { id: 'printers', label: 'Printers', icon: Printer, description: 'Printer configuration' },
  ];

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.altKey && e.key >= '1' && e.key <= '4') {
        e.preventDefault();
        setActiveTab(tabs[parseInt(e.key) - 1].id);
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  return (
    <div className="h-full flex flex-col p-6 overflow-hidden">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1">Settings</h1>
        <p className="text-sm text-muted-foreground">Configure your POS system preferences</p>
      </div>

      <div className="flex h-full gap-6">
        <nav className="w-64 flex-shrink-0 space-y-1" role="navigation" aria-label="Settings navigation">
          {tabs.map((tab, index) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "w-full text-left px-4 py-3 rounded-md transition-colors group flex items-start gap-3",
                  activeTab === tab.id
                    ? "bg-primary text-primary-foreground font-medium"
                    : "hover:bg-muted"
                )}
                aria-label={`${tab.label} settings`}
                aria-current={activeTab === tab.id ? 'page' : undefined}
              >
                <Icon className="h-5 w-5 mt-0.5 flex-shrink-0" aria-hidden="true" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span>{tab.label}</span>
                    <kbd className="hidden group-hover:inline-block px-1.5 py-0.5 text-xs bg-background/50 rounded border">
                      Alt+{index + 1}
                    </kbd>
                  </div>
                  <p className="text-xs opacity-80 mt-0.5">{tab.description}</p>
                </div>
              </button>
            );
          })}
        </nav>

        <main className="flex-1 bg-background rounded-lg shadow-sm border p-6 overflow-auto" role="main" aria-label={`${tabs.find(t => t.id === activeTab)?.label} settings`}>
          {activeTab === 'general' && <GeneralSettings />}
          {activeTab === 'bill' && <BillSettings />}
          {activeTab === 'taxes' && <TaxManagement />}
          {activeTab === 'printers' && <PrinterSettings />}
        </main>
      </div>
    </div>
  );
};
