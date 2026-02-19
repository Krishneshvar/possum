import { useState, useEffect } from 'react';
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

export default function PrinterSettings() {
    const [printers, setPrinters] = useState<{ name: string; isDefault: boolean }[]>([]);
    const [selectedPrinter, setSelectedPrinter] = useState('');
    const [loading, setLoading] = useState(false);
    const [testing, setTesting] = useState(false);

    useEffect(() => {
        handleRefreshPrinters();
    }, []);

    const handleRefreshPrinters = async () => {
        setLoading(true);
        try {
            // @ts-ignore
            if (window.electronAPI) {
                // @ts-ignore
                const list = await window.electronAPI.getPrinters();
                setPrinters(list);
                // @ts-ignore
                const defaultPrinter = list.find((p: any) => p.isDefault);
                if (defaultPrinter) setSelectedPrinter(defaultPrinter.name);
                toast.success('Printers refreshed successfully');
            } else {
                setTimeout(() => {
                    setPrinters([
                        { name: 'EPSON TM-T82', isDefault: true },
                        { name: 'Microsoft Print to PDF', isDefault: false },
                    ]);
                    setSelectedPrinter('EPSON TM-T82');
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

    const handleTestPrint = async () => {
        setTesting(true);
        try {
            // @ts-ignore
            if (window.electronAPI) {
                // @ts-ignore
                await window.electronAPI.print({
                    content: '<h1>Test Print</h1><p>Success!</p>',
                    silent: true,
                    deviceName: selectedPrinter
                });
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
                                    onValueChange={setSelectedPrinter}
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
                                <Button 
                                    variant="outline" 
                                    size="icon" 
                                    onClick={handleRefreshPrinters} 
                                    disabled={loading}
                                    aria-label="Refresh printer list"
                                >
                                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
                                </Button>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Select the printer to use for printing receipts
                            </p>
                        </div>
                    )}

                    <div className="flex gap-2 pt-2">
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
                        {!selectedPrinter && printers.length > 0 && (
                            <p className="text-sm text-muted-foreground self-center">Select a printer to test</p>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
