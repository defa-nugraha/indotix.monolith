export const parseCurrencyToDigits = (value: string | number | null | undefined): string => {
    if (value === null || value === undefined) return '';
    const raw = String(value).trim();
    if (!raw) return '';

    const cleaned = raw.replace(/\s+/g, '');
    const hasComma = cleaned.includes(',');
    const hasDot = cleaned.includes('.');
    let integerPart = cleaned;

    if (hasComma && hasDot) {
        integerPart = cleaned.split(',')[0] ?? '';
        integerPart = integerPart.replace(/\./g, '');
    } else if (hasComma) {
        const parts = cleaned.split(',');
        const last = parts[parts.length - 1] ?? '';
        if (last.length === 3) {
            integerPart = parts.join('');
        } else {
            integerPart = parts[0] ?? '';
        }
        integerPart = integerPart.replace(/\./g, '');
    } else if (hasDot) {
        const parts = cleaned.split('.');
        const last = parts[parts.length - 1] ?? '';
        if (last.length === 3) {
            integerPart = parts.join('');
        } else {
            integerPart = parts[0] ?? '';
        }
    }

    return integerPart.replace(/\D/g, '');
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
