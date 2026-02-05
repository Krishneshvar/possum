import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { saveGeneralSettings } from '../settingsSlice';
import { toast } from 'sonner';
import { ChevronsUpDown, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

const CURRENCIES = [
    { symbol: '₹', name: 'Indian Rupee (INR)' },
    { symbol: '$', name: 'US Dollar (USD)' },
    { symbol: '€', name: 'Euro (EUR)' },
    { symbol: '£', name: 'British Pound (GBP)' },
    { symbol: '¥', name: 'Japanese Yen (JPY)' },
    { symbol: '₩', name: 'South Korean Won (KRW)' },
    { symbol: 'A$', name: 'Australian Dollar (AUD)' },
    { symbol: 'C$', name: 'Canadian Dollar (CAD)' },
    { symbol: 'Sf', name: 'Swiss Franc (CHF)' },
    { symbol: '元', name: 'Chinese Yuan (CNY)' },
    { symbol: 'S$', name: 'Singapore Dollar (SGD)' },
    { symbol: 'HK$', name: 'Hong Kong Dollar (HKD)' },
];

export default function GeneralSettings() {
    const dispatch = useDispatch();
    const currentCurrency = useSelector((state) => state.settings.currency);
    const [currency, setCurrency] = useState(currentCurrency);
    const [open, setOpen] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    useEffect(() => {
        setCurrency(currentCurrency);
    }, [currentCurrency]);

    const handleSave = async () => {
        try {
            await dispatch(saveGeneralSettings({ currency })).unwrap();
            toast.success('General settings saved successfully!');
            setHasUnsavedChanges(false);
        } catch (error) {
            console.error('Failed to save general settings:', error);
            toast.error('Failed to save settings');
        }
    };

    const handleCurrencyChange = (newCurrency) => {
        setCurrency(newCurrency);
        setHasUnsavedChanges(true);
        setOpen(false);
    };

    const selectedCurrency = CURRENCIES.find(curr => curr.symbol === currency);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold tracking-tight">General Settings</h2>
                <Button
                    onClick={handleSave}
                    disabled={!hasUnsavedChanges}
                >
                    Save Changes
                </Button>
            </div>

            <div className="max-w-md bg-white dark:bg-gray-800 p-6 rounded-xl border shadow-sm space-y-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Default Currency
                    </label>
                    <p className="text-xs text-muted-foreground">Select the default currency symbol to be used across the application.</p>
                </div>

                <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={open}
                            className="w-full justify-between"
                        >
                            <span className="flex items-center gap-2">
                                <span className="font-bold text-base min-w-[1.5rem]">{selectedCurrency?.symbol || currency}</span>
                                <span>{selectedCurrency ? selectedCurrency.name : 'Select Currency...'}</span>
                            </span>
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                        <Command>
                            <CommandInput placeholder="Search currency..." />
                            <CommandList>
                                <CommandEmpty>No currency found.</CommandEmpty>
                                <CommandGroup>
                                    {CURRENCIES.map((curr) => (
                                        <CommandItem
                                            key={curr.symbol}
                                            value={curr.name}
                                            onSelect={() => handleCurrencyChange(curr.symbol)}
                                            className="flex items-center justify-between"
                                        >
                                            <span className="flex items-center gap-3">
                                                <span className="font-bold text-base w-8">{curr.symbol}</span>
                                                <span>{curr.name}</span>
                                            </span>
                                            <Check
                                                className={cn(
                                                    "h-4 w-4",
                                                    currency === curr.symbol ? "opacity-100" : "opacity-0"
                                                )}
                                            />
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>
            </div>
        </div>
    );
}
