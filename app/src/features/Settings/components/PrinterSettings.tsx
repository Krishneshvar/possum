import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { RefreshCw, Printer, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { saveGeneralSettings, fetchGeneralSettings } from '../settingsSlice';

export default function PrinterSettings() {
    const dispatch = useDispatch();
    const defaultSavedPrinter = useSelector((state: any) => state.settings.defaultPrinter);
    const token = useSelector((state: any) => state.auth?.token);

    const [printers, setPrinters] = useState<{ name: string; isDefault: boolean }[]>([]);
    const [selectedPrinter, setSelectedPrinter] = useState(defaultSavedPrinter || '');
    const [loading, setLoading] = useState(false);
    const [testing, setTesting] = useState(false);

    useEffect(() => {
        if (defaultSavedPrinter && defaultSavedPrinter !== selectedPrinter) {
            setSelectedPrinter(defaultSavedPrinter);
        }
    }, [defaultSavedPrinter]);

    useEffect(() => {
        // @ts-ignore
        dispatch(fetchGeneralSettings());
        handleRefreshPrinters();
    }, []);

    const handleRefreshPrinters = async () => {
        setLoading(true);
        try {
            // @ts-ignore
            if (window.electronAPI) {
                // @ts-ignore
                const list = await window.electronAPI.getPrinters(token);
                setPrinters(list);
                if (!defaultSavedPrinter) {
                    // @ts-ignore
                    const systemDefault = list.find((p: any) => p.isDefault);
                    if (systemDefault) {
                        handlePrinterChange(systemDefault.name);
                    }
                }
                toast.success('Printers refreshed successfully');
            } else {
                setTimeout(() => {
                    setPrinters([
                        { name: 'EPSON TM-T82', isDefault: true },
                        { name: 'Microsoft Print to PDF', isDefault: false },
                    ]);
                    if (!defaultSavedPrinter) {
                        handlePrinterChange('EPSON TM-T82');
                    }
                    toast.success('Printers refreshed successfully');
                }, 1000);
            }
        } catch (err) {
            console.error(err);
            toast.error('Failed to fetch printers');
        } finally {
            setLoading(false);
        }
    };

    const handlePrinterChange = async (printerName: string) => {
        setSelectedPrinter(printerName);
        try {
            // @ts-ignore
            await dispatch(saveGeneralSettings({ defaultPrinter: printerName })).unwrap();
        } catch (error) {
            console.error(error);
            toast.error('Failed to save printer settings');
        }
    };

    const handleTestPrint = async () => {
        setTesting(true);
        try {
            // @ts-ignore
            if (window.electronAPI) {
                // Load bill settings to get paper width for correct thermal page size
                // @ts-ignore
                const billSettings = await window.electronAPI.getBillSettings(token);
                const paperWidth = billSettings?.paperWidth || '80mm';
                const htmlContent = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
                    body { margin: 0; padding: 10px; font-family: 'Courier New', monospace; }
                </style></head><body>
                    <div style="text-align: center; padding: 10px;">
                        <h2 style="font-size: 16px; margin: 0;">Test Print</h2>
                        <p style="font-size: 12px; margin: 5px 0;">Printer: ${selectedPrinter}</p>
                        <p style="font-size: 12px; margin: 5px 0;">Paper: ${paperWidth}</p>
                        <div style="border-top: 1px dashed #000; margin: 8px 0;"></div>
                        <p style="font-size: 12px;">--- POSSUM POS ---</p>
                    </div>
                </body></html>`;
                // @ts-ignore
                await window.electronAPI.printBill(htmlContent, token, selectedPrinter, paperWidth);
                toast.success('Test print sent successfully');
            } else {
                await new Promise(resolve => setTimeout(resolve, 1000));
                console.log('Test print to:', selectedPrinter);
                toast.success('Test print sent successfully');
            }
        } catch (err) {
            console.error(err);
            toast.error('Print failed. Please check printer connection.');
        } finally {
            setTesting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-lg font-semibold">Printer Settings</h2>
                <p className="text-sm text-muted-foreground mt-1">Configure receipt printer for your POS system</p>
            </div>

            <Separator />

            <Card>
                <CardHeader>
                    <CardTitle>Printer Configuration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {printers.length === 0 && !loading ? (
                        <Alert>
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                                No printers detected. Click "Refresh Printers" to scan for available devices.
                            </AlertDescription>
                        </Alert>
                    ) : (
                        <div className="space-y-2">
                            <Label htmlFor="printer-select">Default Receipt Printer</Label>
                            <div className="flex gap-2">
                                <Select 
                                    value={selectedPrinter} 
                                    onValueChange={handlePrinterChange}
                                    disabled={loading || printers.length === 0}
                                >
                                    <SelectTrigger 
                                        id="printer-select" 
                                        className="flex-1"
                                        aria-label="Select default printer"
                                    >
                                        <SelectValue placeholder="Select a printer" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {printers.map((p) => (
                                            <SelectItem key={p.name} value={p.name}>
                                                {p.name} {p.isDefault ? '(System Default)' : ''}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Select the printer to use for printing receipts
                            </p>
                        </div>
                    )}

                    <div className="flex gap-2 pt-2">
                        <Button 
                            variant="outline"
                            onClick={handleRefreshPrinters} 
                            disabled={loading}
                            aria-label="Refresh printer list"
                        >
                            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
                            Refresh Printers
                        </Button>
                        <Button 
                            onClick={handleTestPrint} 
                            disabled={!selectedPrinter || testing || loading}
                            aria-label="Send test print"
                        >
                            {testing ? (
                                <>
                                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                                    Printing...
                                </>
                            ) : (
                                <>
                                    <Printer className="mr-2 h-4 w-4" aria-hidden="true" />
                                    Test Print
                                </>
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
