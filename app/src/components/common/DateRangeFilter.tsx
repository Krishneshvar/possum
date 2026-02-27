import { useState } from 'react';
import { format, parseISO, isValid } from 'date-fns';
import { Calendar as CalendarIcon, ArrowRight } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";

interface DateRangeFilterProps {
    startDate: string | null;
    endDate: string | null;
    onApply: (startDate: string, endDate: string) => void;
}

export default function DateRangeFilter({ startDate, endDate, onApply }: DateRangeFilterProps) {
    const [isPopoverOpen, setIsPopoverOpen] = useState(false);

    // Manual Range states
    const [tempStart, setTempStart] = useState<Date | undefined>(
        startDate ? parseISO(startDate) : undefined
    );
    const [tempEnd, setTempEnd] = useState<Date | undefined>(
        endDate ? parseISO(endDate) : undefined
    );

    const [error, setError] = useState('');

    const handleApply = () => {
        if (!tempStart || !tempEnd) {
            setError('Please select both start and end dates');
            return;
        }
        if (tempStart > tempEnd) {
            setError('Start date must be before end date');
            return;
        }

        setError('');
        onApply(format(tempStart, 'yyyy-MM-dd'), format(tempEnd, 'yyyy-MM-dd'));
        setIsPopoverOpen(false);
    };

    const handleClear = () => {
        setTempStart(undefined);
        setTempEnd(undefined);
        setError('');
    };

    const displayRange = () => {
        if (!startDate || !endDate) return "Select Date Range";
        const start = parseISO(startDate);
        const end = parseISO(endDate);
        if (!isValid(start) || !isValid(end)) return "Select Date Range";

        if (startDate === endDate) return format(start, 'MMM dd, yyyy');
        return `${format(start, 'MMM dd')} - ${format(end, 'MMM dd, yyyy')}`;
    };

    return (
        <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
            <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 border-dashed hover:border-primary/50 transition-colors">
                    <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span className="text-xs font-medium">{displayRange()}</span>
                    {(startDate || endDate) && (
                        <span className="ml-2 bg-primary text-primary-foreground px-1.5 py-0.5 rounded-[4px] text-[10px] font-bold">Active</span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start" side="bottom" sideOffset={8}>
                <div className="flex flex-col md:flex-row bg-background border rounded-lg shadow-xl overflow-hidden">
                    {/* Left Panel: From Date */}
                    <div className="p-4 border-r border-border bg-muted/5">
                        <div className="mb-3 px-1 text-center font-bold text-xs uppercase tracking-widest text-muted-foreground flex items-center justify-center gap-2">
                            <span className="w-8 h-[1px] bg-border"></span>
                            From Date
                            <span className="w-8 h-[1px] bg-border"></span>
                        </div>
                        <Calendar
                            mode="single"
                            selected={tempStart}
                            onSelect={setTempStart}
                            initialFocus
                            className="p-0 pointer-events-auto"
                        />
                    </div>

                    {/* Right Panel: To Date */}
                    <div className="p-4 bg-background">
                        <div className="mb-3 px-1 text-center font-bold text-xs uppercase tracking-widest text-muted-foreground flex items-center justify-center gap-2">
                            <span className="w-8 h-[1px] bg-border"></span>
                            To Date
                            <span className="w-8 h-[1px] bg-border"></span>
                        </div>
                        <Calendar
                            mode="single"
                            selected={tempEnd}
                            onSelect={setTempEnd}
                            className="p-0 pointer-events-auto"
                        />
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-3 bg-muted/30 border-t flex items-center justify-between gap-4">
                    <div className="flex-1">
                        {error ? (
                            <p className="text-[10px] text-destructive font-bold animate-pulse">{error}</p>
                        ) : (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground italic">
                                {tempStart ? format(tempStart, "MMM dd") : "..."}
                                <ArrowRight className="h-3 w-3" />
                                {tempEnd ? format(tempEnd, "MMM dd") : "..."}
                            </div>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <Button variant="ghost" size="sm" className="h-8 text-xs px-3" onClick={handleClear}>
                            Reset
                        </Button>
                        <Button size="sm" className="h-8 text-xs px-4 font-bold shadow-sm" onClick={handleApply}>
                            Apply Range
                        </Button>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}
