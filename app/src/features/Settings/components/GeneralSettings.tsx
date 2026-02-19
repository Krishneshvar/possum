import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { saveGeneralSettings, fetchGeneralSettings } from '../settingsSlice';
import { toast } from 'sonner';
import { Save, Loader2 } from 'lucide-react';

export default function GeneralSettings() {
    const dispatch = useDispatch();
    const { currency, status } = useSelector((state: any) => state.settings);
    const [localCurrency, setLocalCurrency] = useState(currency);
    const [hasChanges, setHasChanges] = useState(false);

    useEffect(() => {
        // @ts-ignore
        dispatch(fetchGeneralSettings());
    }, [dispatch]);

    useEffect(() => {
        setLocalCurrency(currency);
        setHasChanges(false);
    }, [currency]);

    useEffect(() => {
        setHasChanges(localCurrency !== currency);
    }, [localCurrency, currency]);

    const handleSave = async () => {
        try {
            // @ts-ignore
            await dispatch(saveGeneralSettings({ currency: localCurrency })).unwrap();
            toast.success('Settings saved successfully');
            setHasChanges(false);
        } catch (error) {
            toast.error('Failed to save settings');
        }
    };

    const isLoading = status === 'loading';

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-lg font-semibold">General Settings</h2>
                <p className="text-sm text-muted-foreground mt-1">Configure basic application preferences</p>
            </div>

            <Separator />

            <Card>
                <CardHeader>
                    <CardTitle>Currency Configuration</CardTitle>
                    <CardDescription>Set the default currency symbol for transactions and receipts</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="currency-select">Currency Symbol</Label>
                        <Select value={localCurrency} onValueChange={setLocalCurrency} disabled={isLoading}>
                            <SelectTrigger id="currency-select" aria-label="Select currency symbol">
                                <SelectValue placeholder="Select Currency" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="₹">Indian Rupee (₹)</SelectItem>
                                <SelectItem value="$">US Dollar ($)</SelectItem>
                                <SelectItem value="€">Euro (€)</SelectItem>
                                <SelectItem value="£">British Pound (£)</SelectItem>
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">Choose from common currencies or enter a custom symbol below</p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="custom-currency">Custom Symbol</Label>
                        <Input
                            id="custom-currency"
                            value={localCurrency}
                            onChange={(e) => setLocalCurrency(e.target.value)}
                            placeholder="e.g., ₹, $, €, £"
                            className="max-w-[200px]"
                            disabled={isLoading}
                            aria-label="Custom currency symbol"
                        />
                        <p className="text-xs text-muted-foreground">Enter any custom currency symbol or text</p>
                    </div>
                </CardContent>
            </Card>

            <div className="flex items-center justify-between pt-4">
                <div>
                    {hasChanges && (
                        <p className="text-sm text-amber-600 dark:text-amber-500" role="status" aria-live="polite">
                            You have unsaved changes
                        </p>
                    )}
                </div>
                <Button 
                    onClick={handleSave} 
                    disabled={isLoading || !hasChanges}
                    aria-label="Save general settings"
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <Save className="mr-2 h-4 w-4" aria-hidden="true" />
                            Save Changes
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}
