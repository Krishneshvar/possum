import { useState } from 'react';
import { Calendar } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface DateRangeFilterProps {
    startDate: string | null;
    endDate: string | null;
    onApply: (startDate: string, endDate: string) => void;
}

export default function DateRangeFilter({ startDate, endDate, onApply }: DateRangeFilterProps) {
    const [localStart, setLocalStart] = useState(startDate || '');
    const [localEnd, setLocalEnd] = useState(endDate || '');
    const [error, setError] = useState('');

    const handleApply = () => {
        if (localStart && localEnd && localStart > localEnd) {
            setError('Start date must be before end date');
            return;
        }
        setError('');
        onApply(localStart, localEnd);
    };

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-8">
                    <Calendar className="mr-2 h-4 w-4" />
                    Date Range
                    {(startDate || endDate) && (
                        <span className="ml-2 bg-primary/10 text-primary px-1.5 py-0.5 rounded text-xs">Active</span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="start">
                <div className="space-y-3">
                    <div>
                        <label className="text-sm font-medium mb-1.5 block">From Date</label>
                        <Input
                            type="date"
                            value={localStart}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                setLocalStart(e.target.value);
                                setError('');
                            }}
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium mb-1.5 block">To Date</label>
                        <Input
                            type="date"
                            value={localEnd}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                setLocalEnd(e.target.value);
                                setError('');
                            }}
                        />
                    </div>
                    {error && <p className="text-xs text-destructive">{error}</p>}
                    <Button onClick={handleApply} className="w-full" size="sm">
                        Apply
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    );
}
