export const parseCurrencyToDigits = (
    value: string | number | null | undefined,
): string => {
    if (value === null || value === undefined) return '';
    const raw = String(value).trim();
    if (!raw) return '';
    const normalized = raw.match(/^\d+[.,]\d{1,2}$/)
        ? raw.split(/[.,]/)[0]
        : raw;
    return normalized.replace(/\D/g, '');
};

export const parseCurrencyToInteger = (
    value: string | number | null | undefined,
): string => {
    if (value === null || value === undefined) return '';
    const raw = String(value).trim();
    if (!raw) return '';
    const normalized = raw.match(/^\d+[.,]\d{1,2}$/)
        ? raw.split(/[.,]/)[0]
        : raw;
    return normalized.replace(/\D/g, '');
};

export const formatCurrencyInput = (
    value: string | number | null | undefined,
): string => {
    const digits = parseCurrencyToDigits(value);
    if (!digits) return '';
    return Number(digits).toLocaleString('id-ID');
};

export const formatRupiah = (
    value: string | number | null | undefined,
): string => {
    const amount = Number(value ?? 0);

    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(Number.isFinite(amount) ? amount : 0);
};
