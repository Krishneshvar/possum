import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { saveGeneralSettings, fetchGeneralSettings } from '../settingsSlice';
import { toast } from 'sonner';

export default function GeneralSettings() {
    const dispatch = useDispatch();
    const { currency, status } = useSelector((state: any) => state.settings);
    const [localCurrency, setLocalCurrency] = useState(currency);

    useEffect(() => {
        // @ts-ignore
        dispatch(fetchGeneralSettings());
    }, [dispatch]);

    useEffect(() => {
        setLocalCurrency(currency);
    }, [currency]);

    const handleSave = async () => {
        try {
            // @ts-ignore
            await dispatch(saveGeneralSettings({ currency: localCurrency })).unwrap();
            toast.success('Settings saved successfully');
        } catch (error) {
            toast.error('Failed to save settings');
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>General Application Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Currency Symbol</Label>
                        <Select value={localCurrency} onValueChange={setLocalCurrency}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select Currency" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="₹">Indian Rupee (₹)</SelectItem>
                                <SelectItem value="$">US Dollar ($)</SelectItem>
                                <SelectItem value="€">Euro (€)</SelectItem>
                                <SelectItem value="£">British Pound (£)</SelectItem>
                            </SelectContent>
                        </Select>
                        <div className="flex gap-2 mt-2">
                            <Input
                                value={localCurrency}
                                onChange={(e) => setLocalCurrency(e.target.value)}
                                placeholder="Custom Symbol"
                                className="max-w-[100px]"
                            />
                            <span className="text-xs text-muted-foreground self-center">
                                Or type a custom symbol
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end">
                    <Button onClick={handleSave} disabled={status === 'loading'}>
                        Save General Settings
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
