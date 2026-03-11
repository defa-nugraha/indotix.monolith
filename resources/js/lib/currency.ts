export const parseCurrencyToDigits = (value: string | number | null | undefined): string => {
    if (value === null || value === undefined) return '';
    const raw = String(value).trim();
    if (!raw) return '';
    return raw.replace(/\D/g, '');
};

export const parseCurrencyToInteger = (value: string | number | null | undefined): string => {
    if (value === null || value === undefined) return '';
    const raw = String(value).trim();
    if (!raw) return '';
    return raw.replace(/\D/g, '');
};

export const formatCurrencyInput = (value: string | number | null | undefined): string => {
    const digits = parseCurrencyToDigits(value);
    if (!digits) return '';
    return Number(digits).toLocaleString('id-ID');
};
