import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Loader2, Printer, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

export default function PrinterSettings() {
    const [printers, setPrinters] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedPrinter, setSelectedPrinter] = useState('');
    const [generalSettings, setGeneralSettings] = useState({});

    const fetchPrinters = async () => {
        if (!window.electronAPI) return;
        setLoading(true);
        try {
            const list = await window.electronAPI.getPrinters();
            setPrinters(list || []);
        } catch (error) {
            console.error("Failed to fetch printers", error);
            toast.error("Failed to load printers");
        } finally {
            setLoading(false);
        }
    };

    const fetchSettings = async () => {
        if (!window.electronAPI) return;
        try {
            const settings = await window.electronAPI.getGeneralSettings();
            if (settings) {
                setGeneralSettings(settings);
                if (settings.defaultPrinter) {
                    setSelectedPrinter(settings.defaultPrinter);
                }
            }
        } catch (error) {
            console.error("Failed to fetch settings", error);
        }
    };

    useEffect(() => {
        fetchPrinters();
        fetchSettings();
    }, []);

    const handlePrinterChange = async (value) => {
        setSelectedPrinter(value);
        const newSettings = { ...generalSettings, defaultPrinter: value };
        setGeneralSettings(newSettings);

        if (window.electronAPI) {
            try {
                await window.electronAPI.saveGeneralSettings(newSettings);
                toast.success(`Default printer set to: ${value}`);
            } catch (error) {
                console.error("Failed to save printer setting", error);
                toast.error("Failed to save default printer");
            }
        }
    };

    return (
        <div className="space-y-6 max-w-2xl">
            <div>
                <h2 className="text-lg font-semibold mb-1">Printer Configuration</h2>
                <p className="text-sm text-muted-foreground">
                    Select the default thermal printer for printing receipts.
                </p>
            </div>

            <div className="p-6 border rounded-lg bg-card text-card-foreground shadow-sm space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="printer-select">Default Printer</Label>
                    <div className="flex gap-2">
                        <Select
                            value={selectedPrinter}
                            onValueChange={handlePrinterChange}
                            disabled={loading}
                        >
                            <SelectTrigger id="printer-select" className="w-full">
                                <SelectValue placeholder={loading ? "Loading printers..." : "Select a printer"} />
                            </SelectTrigger>
                            <SelectContent>
                                {printers.length === 0 && !loading ? (
                                    <div className="p-2 text-sm text-muted-foreground text-center">No printers found</div>
                                ) : (
                                    printers.map((printer) => (
                                        <SelectItem key={printer.name} value={printer.name}>
                                            <div className="flex items-center">
                                                <Printer className="mr-2 h-4 w-4" />
                                                <span>{printer.name}</span>
                                                {printer.isDefault && <span className="ml-2 text-xs text-muted-foreground">(System Default)</span>}
                                            </div>
                                        </SelectItem>
                                    ))
                                )}
                            </SelectContent>
                        </Select>

                        <Button
                            variant="outline"
                            size="icon"
                            onClick={fetchPrinters}
                            disabled={loading}
                            title="Refresh Printers"
                        >
                            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                        Note: Ensure your thermal printer is connected and installed in your OS settings.
                    </p>
                </div>

                {selectedPrinter && (
                    <div className="mt-4 pt-4 border-t">
                        <div className="flex items-center gap-2 text-sm text-green-600 font-medium">
                            <div className="h-2 w-2 rounded-full bg-green-500"></div>
                            Ready to print to: {selectedPrinter}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
