import { useSelector } from 'react-redux';

export const useCurrency = () => {
    const currency = useSelector((state) => state.settings.currency);
    return currency || '₹';
};
