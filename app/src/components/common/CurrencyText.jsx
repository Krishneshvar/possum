import React from 'react';
import { useSelector } from 'react-redux';

export default function CurrencyText({ value, showSymbol = true }) {
    const currency = useSelector((state) => state.settings.currency) || '₹';

    const formattedValue = Number(value).toFixed(2);

    return (
        <span>
            {showSymbol && <span className="mr-0.5">{currency}</span>}
            {formattedValue}
        </span>
    );
}
