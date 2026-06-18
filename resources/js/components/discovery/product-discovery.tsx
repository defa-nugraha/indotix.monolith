import { Search, SlidersHorizontal, Sparkles, X } from 'lucide-react';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type DiscoverySuggestionItem = {
    label: string;
    value?: string;
    query?: string;
    kind?: 'text' | 'product';
    image?: string | null;
};

export type DiscoverySuggestionGroup = {
    label: string;
    items: Array<string | DiscoverySuggestionItem>;
    icon?: ReactNode;
};

export type DiscoveryTip = {
    title: string;
    body: string;
    icon?: ReactNode;
};

export type DiscoverySortOption = {
    value: string;
    label: string;
};

const appliedFilterLabels: Record<string, string> = {
    category: 'Kategori',
    city: 'Kota',
    location: 'Lokasi',
    price_type: 'Harga',
    start_date: 'Mulai',
    end_date: 'Selesai',
    check_in: 'Check-in',
    check_out: 'Check-out',
    guests: 'Tamu',
    rooms: 'Kamar',
    rating: 'Rating',
    level: 'Level',
    mentor: 'Mentor',
    duration: 'Durasi',
    target_participant: 'Peserta',
    quota_available: 'Kuota',
    stock_status: 'Stok',
    category_id: 'Kategori',
};

const appliedFilterValueLabels: Record<string, Record<string, string>> = {
    price_type: {
        free: 'Gratis',
        paid: 'Berbayar',
    },
    quota_available: {
        true: 'Kuota tersedia',
        false: 'Kuota habis',
    },
    stock_status: {
        in_stock: 'Stok tersedia',
        out_of_stock: 'Stok habis',
        low_stock: 'Stok menipis',
    },
};

export function formatAppliedDiscoveryFilters(
    filters: Record<string, unknown> | null | undefined,
): string[] {
    if (!filters) return [];

    return Object.entries(filters)
        .flatMap(([key, value]) => {
            if (value == null || value === '' || key === 'sort') return [];
            if (key === 'q' && typeof value === 'string') {
                return [`Cari: ${value}`];
            }

            const label = appliedFilterLabels[key] ?? key;
            const renderValue = Array.isArray(value)
                ? value.join(', ')
                : appliedFilterValueLabels[key]?.[String(value)] ?? String(value);
            return [`${label}: ${renderValue}`];
        })
        .filter(Boolean);
}

function normalizeSuggestionItem(
    item: string | DiscoverySuggestionItem,
): DiscoverySuggestionItem {
    if (typeof item === 'string') {
        return {
            label: item,
            value: item,
            query: item,
            kind: 'text',
        };
    }

    return {
        label: item.label,
        value: item.value ?? item.label,
        query: item.query ?? item.value ?? item.label,
        kind: item.kind ?? 'text',
        image: item.image ?? null,
    };
}

function groupRemoteSuggestions(items: unknown[]): DiscoverySuggestionGroup[] {
    const labels: Record<string, string> = {
        keyword: 'Pencarian populer',
        product: 'Produk',
        location: 'Lokasi',
        category: 'Kategori',
        facility: 'Fasilitas',
        mentor: 'Mentor',
    };
    const priorities: Record<string, number> = {
        Produk: 0,
        'Pencarian populer': 1,
        Lokasi: 2,
        Kategori: 3,
        Fasilitas: 4,
        Mentor: 5,
    };
    const groups = new Map<string, DiscoverySuggestionItem[]>();

    items.forEach((item) => {
        if (!item || typeof item !== 'object') return;
        const row = item as {
            type?: unknown;
            label?: unknown;
            value?: unknown;
            metadata?: { query?: unknown; image?: unknown };
        };
        const type = typeof row.type === 'string' ? row.type : 'keyword';
        const label =
            typeof row.metadata?.query === 'string'
                ? row.metadata.query
                : typeof row.label === 'string'
                  ? row.label
                  : '';
        if (!label.trim()) return;
        const groupLabel = labels[type] ?? labels.keyword;
        const nextItem: DiscoverySuggestionItem = {
            label,
            value: typeof row.value === 'string' ? row.value : label,
            query: label,
            kind: type === 'product' ? 'product' : 'text',
            image:
                type === 'product' && typeof row.metadata?.image === 'string'
                    ? row.metadata.image
                    : null,
        };
        groups.set(groupLabel, [...(groups.get(groupLabel) ?? []), nextItem]);
    });

    return Array.from(groups.entries())
        .map(([label, values]) => ({
            label,
            items: values.filter(
                (value, index, self) =>
                    self.findIndex(
                        (item) =>
                            item.label.toLowerCase() ===
                                value.label.toLowerCase() &&
                            item.kind === value.kind,
                    ) === index,
            ),
        }))
        .sort(
            (a, b) =>
                (priorities[a.label] ?? 99) - (priorities[b.label] ?? 99),
        );
}

export function DiscoverySearchField({
    value,
    onChange,
    onSuggestionSelect,
    placeholder,
    suggestions,
    suggestionEndpoint,
    className,
}: {
    value: string;
    onChange: (value: string) => void;
    onSuggestionSelect: (value: string) => void;
    placeholder: string;
    suggestions: DiscoverySuggestionGroup[];
    suggestionEndpoint?: string;
    className?: string;
}) {
    const [focused, setFocused] = useState(false);
    const [remoteGroups, setRemoteGroups] = useState<
        DiscoverySuggestionGroup[]
    >([]);
    const query = value.trim().toLowerCase();
    const normalizedSuggestions = useMemo(
        () =>
            suggestions.map((group) => ({
                ...group,
                items: group.items.map(normalizeSuggestionItem),
            })),
        [suggestions],
    );
    const mergedSuggestions = useMemo(
        () => [...remoteGroups, ...normalizedSuggestions],
        [normalizedSuggestions, remoteGroups],
    );
    const filteredGroups = useMemo(() => {
        return mergedSuggestions
            .map((group) => ({
                ...group,
                items: group.items
                    .map(normalizeSuggestionItem)
                    .filter(
                        (item, index, self) =>
                            self.findIndex(
                                (candidate) =>
                                    candidate.label.toLowerCase() ===
                                        item.label.toLowerCase() &&
                                    candidate.kind === item.kind,
                            ) === index,
                    )
                    .filter((item) =>
                        query
                            ? item.label.toLowerCase().includes(query) ||
                              (item.query ?? '')
                                  .toLowerCase()
                                  .includes(query)
                            : true,
                    )
                    .slice(
                        0,
                        group.label === 'Produk'
                            ? query
                                ? 4
                                : 3
                            : query
                              ? 6
                              : 4,
                    ),
            }))
            .filter((group) => group.items.length > 0);
    }, [mergedSuggestions, query]);

    useEffect(() => {
        if (!suggestionEndpoint || !focused) return;

        const controller = new AbortController();
        const timer = window.setTimeout(async () => {
            try {
                const url = new URL(suggestionEndpoint, window.location.origin);
                const keyword = value.trim();
                url.searchParams.set('limit', '10');
                if (keyword) {
                    url.searchParams.set('q', keyword);
                }
                const response = await fetch(url.toString(), {
                    headers: { Accept: 'application/json' },
                    signal: controller.signal,
                });
                if (!response.ok) return;
                const payload = await response.json();
                setRemoteGroups(groupRemoteSuggestions(payload.data ?? []));
            } catch (error) {
                if ((error as Error).name !== 'AbortError') {
                    setRemoteGroups([]);
                }
            }
        }, 250);

        return () => {
            window.clearTimeout(timer);
            controller.abort();
        };
    }, [focused, suggestionEndpoint, value]);

    const showSuggestions = focused && filteredGroups.length > 0;

    return (
        <div className={cn('relative', className)}>
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm transition focus-within:border-sky-400 focus-within:ring-4 focus-within:ring-sky-100">
                <Search className="h-4 w-4 text-slate-400" />
                <input
                    className="w-full bg-transparent outline-none"
                    placeholder={placeholder}
                    value={value}
                    onBlur={() =>
                        window.setTimeout(() => setFocused(false), 120)
                    }
                    onChange={(event) => onChange(event.target.value)}
                    onFocus={() => setFocused(true)}
                />
                {value.trim() && (
                    <button
                        type="button"
                        className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                        onClick={() => onChange('')}
                        aria-label="Hapus pencarian"
                    >
                        <X className="h-4 w-4" />
                    </button>
                )}
            </div>
            {showSuggestions && (
                <div className="absolute top-full right-0 left-0 z-40 mt-2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10">
                    {filteredGroups.map((group) => (
                        <div
                            key={group.label}
                            className="border-b border-slate-100 p-2 last:border-b-0"
                        >
                            <div className="flex items-center gap-2 px-2 py-1 text-[11px] font-bold text-slate-400 uppercase">
                                {group.icon}
                                <span>{group.label}</span>
                            </div>
                            {group.items.map((item) => (
                                <button
                                    key={`${group.label}-${item.kind}-${item.label}`}
                                    type="button"
                                    className={cn(
                                        'flex w-full rounded-xl text-left hover:bg-sky-50 hover:text-sky-700',
                                        item.kind === 'product'
                                            ? 'items-center gap-3 px-3 py-2.5'
                                            : 'items-center justify-between px-3 py-2',
                                    )}
                                    onMouseDown={(event) =>
                                        event.preventDefault()
                                    }
                                    onClick={() => {
                                        setFocused(false);
                                        onSuggestionSelect(
                                            item.query ?? item.label,
                                        );
                                    }}
                                >
                                    {item.kind === 'product' ? (
                                        <>
                                            <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                                                <img
                                                    src={
                                                        item.image ??
                                                        '/images/placeholder-card.jpg'
                                                    }
                                                    alt={item.label}
                                                    className="h-full w-full object-cover"
                                                />
                                            </div>
                                            <div className="min-w-0">
                                                <div className="truncate text-sm font-semibold text-slate-800">
                                                    {item.label}
                                                </div>
                                                <div className="text-xs text-slate-400">
                                                    Rekomendasi produk
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <span>{item.label}</span>
                                            <Search className="h-3.5 w-3.5 text-slate-300" />
                                        </>
                                    )}
                                </button>
                            ))}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export function DiscoverySortSelect({
    value,
    options,
    onChange,
    className,
}: {
    value: string;
    options: DiscoverySortOption[];
    onChange: (value: string) => void;
    className?: string;
}) {
    return (
        <label
            className={cn(
                'flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm',
                className,
            )}
        >
            <SlidersHorizontal className="h-4 w-4 text-slate-400" />
            <select
                className="w-full bg-transparent font-semibold text-slate-700 outline-none"
                value={value}
                onChange={(event) => onChange(event.target.value)}
            >
                {options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
        </label>
    );
}

export function ActiveFilterChips({
    filters,
    onReset,
}: {
    filters: string[];
    onReset: () => void;
}) {
    if (filters.length === 0) return null;

    return (
        <div className="mt-4 flex flex-wrap items-center gap-2">
            {filters.map((filter) => (
                <span
                    key={filter}
                    className="rounded-full border border-sky-100 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700"
                >
                    {filter}
                </span>
            ))}
            <button
                type="button"
                className="text-xs font-semibold text-slate-500 hover:text-sky-700"
                onClick={onReset}
            >
                Reset filter
            </button>
        </div>
    );
}

export function DiscoveryInsightStrip({ tips }: { tips: DiscoveryTip[] }) {
    if (tips.length === 0) return null;

    return (
        <div className="mt-5 grid gap-3 md:grid-cols-2">
            {tips.map((tip) => (
                <div
                    key={tip.title}
                    className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50/80 p-4"
                >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-sky-600 shadow-sm">
                        {tip.icon ?? <Sparkles className="h-5 w-5" />}
                    </div>
                    <div>
                        <p className="text-sm font-bold text-slate-900">
                            {tip.title}
                        </p>
                        <p className="mt-1 text-xs leading-5 text-slate-500">
                            {tip.body}
                        </p>
                    </div>
                </div>
            ))}
        </div>
    );
}

export function DiscoveryEmptyState({
    title,
    description,
    suggestions,
    onSuggestionSelect,
    onReset,
}: {
    title: string;
    description: string;
    suggestions: string[];
    onSuggestionSelect: (value: string) => void;
    onReset: () => void;
}) {
    return (
        <section className="rounded-3xl border border-dashed border-slate-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
                <Sparkles className="h-7 w-7" />
            </div>
            <h2 className="mt-4 text-lg font-bold text-slate-900">{title}</h2>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
                {description}
            </p>
            {suggestions.length > 0 && (
                <div className="mt-5 flex flex-wrap justify-center gap-2">
                    {suggestions.slice(0, 5).map((suggestion) => (
                        <button
                            key={suggestion}
                            type="button"
                            className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700"
                            onClick={() => onSuggestionSelect(suggestion)}
                        >
                            {suggestion}
                        </button>
                    ))}
                </div>
            )}
            <button
                type="button"
                className="mt-5 rounded-full bg-sky-600 px-5 py-2 text-sm font-semibold text-white hover:bg-sky-700"
                onClick={onReset}
            >
                Reset pencarian
            </button>
        </section>
    );
}
