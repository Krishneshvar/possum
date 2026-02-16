import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { RefreshCw, Printer } from 'lucide-react';
import { toast } from 'sonner';

export default function PrinterSettings() {
    const [printers, setPrinters] = useState<{ name: string; isDefault: boolean }[]>([]);
    const [selectedPrinter, setSelectedPrinter] = useState('');
    const [loading, setLoading] = useState(false);

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
            } else {
                // Mock for browser dev
                setTimeout(() => {
                    setPrinters([
                        { name: 'EPSON TM-T82', isDefault: true },
                        { name: 'Microsoft Print to PDF', isDefault: false },
                    ]);
                    setSelectedPrinter('EPSON TM-T82');
                }, 1000);
            }
            toast.success('Printers refreshed');
        } catch (err) {
            console.error(err);
            toast.error('Failed to fetch printers');
        } finally {
            setLoading(false);
        }
    };

    const handleTestPrint = async () => {
        try {
            // @ts-ignore
            if (window.electronAPI) {
                // @ts-ignore
                await window.electronAPI.print({
                    content: '<h1>Test Print</h1><p>Success!</p>',
                    silent: true,
                    deviceName: selectedPrinter
                });
                toast.success('Test print sent');
            } else {
                console.log('Test print to:', selectedPrinter);
                toast.success('Test print sent (Simulated)');
            }
        } catch (err) {
            console.error(err);
            toast.error('Print failed');
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Printer Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <Label>Select Default Printer</Label>
                    <div className="flex gap-2">
                        <Select value={selectedPrinter} onValueChange={setSelectedPrinter}>
                            <SelectTrigger className="flex-1">
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
                        <Button variant="outline" size="icon" onClick={handleRefreshPrinters} disabled={loading}>
                            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        </Button>
                    </div>
                </div>

                <div className="flex gap-2">
                    <Button onClick={handleTestPrint} disabled={!selectedPrinter}>
                        <Printer className="mr-2 h-4 w-4" />
                        Test Print
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
