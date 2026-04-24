import { addDays, format, isValid, parseISO } from 'date-fns';
import { CalendarDays } from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { Calendar, DateRange } from 'react-date-range';
import { cn } from '@/lib/utils';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';

export type ProductDateRecommendation = {
    id: string | number;
    title: string;
    imageUrl?: string | null;
    price?: number | null;
};

type ProductDateRecommendationMap = Record<string, ProductDateRecommendation>;

type SingleDatePickerProps = {
    value?: string | null;
    onChange: (value: string) => void;
    recommendations?: ProductDateRecommendationMap;
    minDate?: Date;
    className?: string;
    align?: 'left' | 'right';
};

type RangeDatePickerProps = {
    startDate?: string | null;
    endDate?: string | null;
    onChange: (value: { startDate: string; endDate: string }) => void;
    recommendations?: ProductDateRecommendationMap;
    minDate?: Date;
    className?: string;
    align?: 'left' | 'right';
};

const priceFormatter = new Intl.NumberFormat('id-ID');

function parseDateValue(value?: string | null, fallback = new Date()): Date {
    if (!value) {
        return fallback;
    }

    const parsed = parseISO(value);
    return isValid(parsed) ? parsed : fallback;
}

function dateKey(date: Date): string {
    return format(date, 'yyyy-MM-dd');
}

function normalizeDateKey(value?: string | null): string | null {
    if (!value) {
        return null;
    }

    const parsed = parseISO(value);
    if (isValid(parsed)) {
        return dateKey(parsed);
    }

    return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;
}

function formatDateLabel(
    value?: string | null,
    fallbackLabel = 'Pilih tanggal',
): string {
    if (!value) {
        return fallbackLabel;
    }

    const parsed = parseISO(value);
    if (!isValid(parsed)) {
        return fallbackLabel;
    }

    return format(parsed, 'dd MMM yyyy');
}

function formatPriceLabel(price?: number | null): string {
    if (typeof price === 'number' && price > 0) {
        return `Harga mulai Rp${priceFormatter.format(price)}`;
    }

    return 'Lihat detail';
}

function DateCellContent({
    date,
    recommendation,
}: {
    date: Date;
    recommendation?: ProductDateRecommendation;
}) {
    return (
        <div
            className={cn(
                'product-date-calendar__content',
                recommendation && 'product-date-calendar__content--featured',
            )}
        >
            <span className="product-date-calendar__day">
                {format(date, 'd')}
            </span>
            {recommendation ? (
                <div className="product-date-calendar__preview">
                    <img
                        src={
                            recommendation.imageUrl ??
                            '/images/placeholder-card.jpg'
                        }
                        alt={recommendation.title}
                        className="product-date-calendar__thumb"
                    />
                    <span className="product-date-calendar__price">
                        {formatPriceLabel(recommendation.price)}
                    </span>
                </div>
            ) : null}
        </div>
    );
}

function useOutsideClose<T extends HTMLElement>(
    ref: RefObject<T | null>,
    isOpen: boolean,
    onClose: () => void,
) {
    useEffect(() => {
        if (!isOpen) {
            return undefined;
        }

        const handleClickOutside = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                onClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onClose, ref]);
}

function popoverPosition(align: 'left' | 'right') {
    return align === 'right' ? 'right-0' : 'left-0';
}

export function DiscoverySingleDatePicker({
    value,
    onChange,
    recommendations = {},
    minDate,
    className,
    align = 'left',
}: SingleDatePickerProps) {
    const [open, setOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement | null>(null);
    const selectedDate = useMemo(
        () => parseDateValue(value, minDate ?? new Date()),
        [minDate, value],
    );

    useOutsideClose(wrapperRef, open, () => setOpen(false));

    return (
        <div className={cn('relative', className)} ref={wrapperRef}>
            <button
                type="button"
                className={cn(
                    'flex w-full items-center gap-2 rounded-xl border px-4 py-3 text-sm transition',
                    open ? 'border-sky-500' : 'border-slate-200',
                )}
                onClick={() => setOpen((current) => !current)}
            >
                <CalendarDays className="h-4 w-4 text-slate-400" />
                <span className="text-left text-slate-700">
                    {formatDateLabel(value)}
                </span>
            </button>
            {open ? (
                <div
                    className={cn(
                        'product-date-picker-popover absolute z-50 mt-2 w-[min(92vw,27rem)] rounded-[28px] border border-slate-200 bg-white p-3 shadow-[0_24px_60px_-26px_rgba(15,23,42,0.28)]',
                        popoverPosition(align),
                    )}
                >
                    <Calendar
                        date={selectedDate}
                        minDate={minDate ?? new Date()}
                        color="#0284c7"
                        className="product-date-calendar"
                        onChange={(nextDate: Date) => {
                            onChange(dateKey(nextDate));
                            setOpen(false);
                        }}
                        dayContentRenderer={(date: Date) => (
                            <DateCellContent
                                date={date}
                                recommendation={recommendations[dateKey(date)]}
                            />
                        )}
                    />
                </div>
            ) : null}
        </div>
    );
}

export function DiscoveryRangeDatePicker({
    startDate,
    endDate,
    onChange,
    recommendations = {},
    minDate,
    className,
    align = 'right',
}: RangeDatePickerProps) {
    const [open, setOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement | null>(null);
    const range = useMemo(
        () => [
            {
                startDate: parseDateValue(startDate, minDate ?? new Date()),
                endDate: parseDateValue(
                    endDate,
                    addDays(
                        parseDateValue(startDate, minDate ?? new Date()),
                        1,
                    ),
                ),
                key: 'selection',
            },
        ],
        [endDate, minDate, startDate],
    );

    useOutsideClose(wrapperRef, open, () => setOpen(false));

    return (
        <div className={cn('relative', className)} ref={wrapperRef}>
            <button
                type="button"
                className={cn(
                    'flex w-full items-center gap-2 rounded-xl border px-4 py-3 text-sm transition',
                    open ? 'border-sky-500' : 'border-slate-200',
                )}
                onClick={() => setOpen((current) => !current)}
            >
                <CalendarDays className="h-4 w-4 text-slate-400" />
                <span className="text-left text-slate-700">
                    {`${formatDateLabel(startDate)} - ${formatDateLabel(endDate)}`}
                </span>
            </button>
            {open ? (
                <div
                    className={cn(
                        'product-date-picker-popover absolute z-50 mt-2 w-[min(94vw,32rem)] rounded-[28px] border border-slate-200 bg-white p-3 shadow-[0_24px_60px_-26px_rgba(15,23,42,0.28)]',
                        popoverPosition(align),
                    )}
                >
                    <DateRange
                        ranges={range}
                        months={1}
                        direction="horizontal"
                        minDate={minDate ?? new Date()}
                        moveRangeOnFirstSelection={false}
                        rangeColors={['#0284c7']}
                        showDateDisplay={false}
                        className="product-date-calendar product-date-calendar--range"
                        onChange={(item: {
                            selection?: { startDate?: Date; endDate?: Date };
                        }) => {
                            const selection = item.selection;
                            const nextStart =
                                selection?.startDate ?? new Date();
                            const nextEnd = selection?.endDate ?? nextStart;
                            onChange({
                                startDate: dateKey(nextStart),
                                endDate: dateKey(nextEnd),
                            });
                        }}
                        dayContentRenderer={(date: Date) => (
                            <DateCellContent
                                date={date}
                                recommendation={recommendations[dateKey(date)]}
                            />
                        )}
                    />
                </div>
            ) : null}
        </div>
    );
}

export function createDateRecommendationMap<T>(
    items: T[],
    options: {
        getDateKeys: (item: T) => Array<string | null | undefined>;
        mapItem: (item: T) => ProductDateRecommendation | null;
        limit?: number;
    },
): ProductDateRecommendationMap {
    const recommendations: ProductDateRecommendationMap = {};
    const limit = options.limit ?? 21;
    let total = 0;

    for (const item of items) {
        const recommendation = options.mapItem(item);
        if (!recommendation) {
            continue;
        }

        for (const rawDate of options.getDateKeys(item)) {
            const key = normalizeDateKey(rawDate);
            if (!key || recommendations[key]) {
                continue;
            }

            recommendations[key] = recommendation;
            total += 1;

            if (total >= limit) {
                return recommendations;
            }
        }
    }

    return recommendations;
}

export function createRollingRecommendationMap<T>(
    items: T[],
    options: {
        mapItem: (item: T) => ProductDateRecommendation | null;
        startDate?: Date;
        days?: number;
    },
): ProductDateRecommendationMap {
    const pool = items
        .map((item) => options.mapItem(item))
        .filter((item): item is ProductDateRecommendation => Boolean(item));

    if (pool.length === 0) {
        return {};
    }

    const startDate = options.startDate ?? new Date();
    const days = options.days ?? 21;
    const recommendations: ProductDateRecommendationMap = {};

    for (let index = 0; index < days; index += 1) {
        const key = dateKey(addDays(startDate, index));
        recommendations[key] = pool[index % pool.length];
    }

    return recommendations;
}
