import { useCurrency } from "@/hooks/useCurrency";

interface CurrencyTextProps {
    value?: number | string;
    className?: string;
}

export default function CurrencyText({ value, className }: CurrencyTextProps) {
    const currency = useCurrency();
    const numericValue = Number(value);

    // If value is undefined or invalid number, render nothing or placeholder?
    // Let's render 0.00
    const displayValue = isNaN(numericValue) ? 0 : numericValue;

    return (
        <span className={className}>
            {currency}{displayValue.toFixed(2)}
        </span>
    );
}
