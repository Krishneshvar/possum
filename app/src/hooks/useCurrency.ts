import { useSelector } from 'react-redux';

export const useCurrency = () => {
    const currency = useSelector((state: any) => state.settings.currency);
    return currency || '₹';
};
