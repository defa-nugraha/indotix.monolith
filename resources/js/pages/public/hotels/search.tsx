import { Head, Link, router } from '@inertiajs/react';
import { addDays, format } from 'date-fns';
import {
    CalendarCheck,
    Coffee,
    Cigarette,
    CigaretteOff,
    MapPinned,
    ShoppingBag,
    Star,
    Ticket,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
    DiscoveryCollectionRail,
    DiscoveryFeaturedShowcase,
    DiscoveryIntentRow,
    type DiscoveryExperiencePayload,
    type DiscoveryIntentChip,
    type DiscoveryTheme,
} from '@/components/discovery/discovery-experience';
import {
    DiscoveryRangeDatePicker,
    createRollingRecommendationMap,
} from '@/components/discovery/product-date-picker';
import {
    ActiveFilterChips,
    DiscoveryEmptyState,
    DiscoveryInsightStrip,
    DiscoverySearchField,
    DiscoverySortSelect,
    formatAppliedDiscoveryFilters,
    type DiscoverySuggestionGroup,
} from '@/components/discovery/product-discovery';
import { FooterDownloadSocial } from '@/components/footer-download-social';
import { Skeleton } from '@/components/ui/skeleton';
import PublicLayout from '@/layouts/public-layout';

type Hotel = {
    id: number;
    encrypted_id?: string;
    slug?: string | null;
    name: string;
    address?: string | null;
    city_name?: string | null;
    star_rating?: number | null;
    min_price?: number | null;
    image_url?: string | null;
    breakfast_included?: boolean;
    smoking_allowed?: boolean;
};

type Filters = {
    city?: string | null;
    check_in?: string | null;
    check_out?: string | null;
    rooms?: number;
    guests?: number;
    children?: number;
    q?: string | null;
    sort?: string | null;
};

type Recommendation = {
    id: number;
    encrypted_id: string;
    slug?: string | null;
    name: string;
    city_name?: string | null;
    star_rating?: number | null;
    min_price?: number | null;
    image_url?: string | null;
};

const sortOptions = [
    { value: 'recommended', label: 'Rekomendasi' },
    { value: 'price_low', label: 'Harga termurah' },
    { value: 'price_high', label: 'Harga termahal' },
    { value: 'rating_high', label: 'Bintang tertinggi' },
    { value: 'title', label: 'Nama A-Z' },
];

const sortHotels = (items: Hotel[], sort: string) => {
    const results = [...items];
    if (sort === 'price_low') {
        return results.sort(
            (a, b) => Number(a.min_price ?? 0) - Number(b.min_price ?? 0),
        );
    }
    if (sort === 'price_high') {
        return results.sort(
            (a, b) => Number(b.min_price ?? 0) - Number(a.min_price ?? 0),
        );
    }
    if (sort === 'rating_high') {
        return results.sort(
            (a, b) => Number(b.star_rating ?? 0) - Number(a.star_rating ?? 0),
        );
    }
    if (sort === 'title') {
        return results.sort((a, b) => a.name.localeCompare(b.name));
    }
    return results;
};

const discoveryTheme: DiscoveryTheme = {
    badge: 'Pilihan Hotel',
    title: 'Bandingkan hotel lewat tujuan, kebutuhan, dan gaya perjalanan',
    description:
        'Temukan hotel favorit untuk staycation, perjalanan keluarga, atau budget terbaik di kota tujuan.',
    accent: 'bg-sky-600 hover:bg-sky-700',
    gradientClassName:
        'bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.12),_transparent_30%),linear-gradient(135deg,#0B3B8F,#1D73D6,#4CC9F0)]',
    surfaceClassName: 'bg-sky-50 text-sky-700',
    icon: Ticket,
};

export default function HotelSearch({
    filters,
    hotels,
    recommendations,
    discovery,
    meta,
}: {
    filters: Filters;
    hotels: Hotel[];
    recommendations: Recommendation[];
    discovery?: DiscoveryExperiencePayload | null;
    meta?: { total?: number; applied_filters?: Record<string, unknown> } | null;
}) {
    const [isReady, setIsReady] = useState(false);
    const today = new Date();
    const tomorrow = addDays(today, 1);
    const defaultCheckIn = format(today, 'yyyy-MM-dd');
    const defaultCheckOut = format(tomorrow, 'yyyy-MM-dd');
    const [form, setForm] = useState({
        q: filters.q ?? '',
        city: filters.city ?? '',
        check_in: filters.check_in ?? defaultCheckIn,
        check_out: filters.check_out ?? defaultCheckOut,
        rooms: filters.rooms ?? 1,
        guests: filters.guests ?? 2,
        children: filters.children ?? 0,
    });
    const [guestOpen, setGuestOpen] = useState(false);
    const [sort, setSort] = useState(filters.sort ?? 'recommended');
    const [children, setChildren] = useState(
        Math.max(0, filters.children ?? 0),
    );
    const [adults, setAdults] = useState(
        Math.max(1, (filters.guests ?? 2) - (filters.children ?? 0)),
    );
    const [rooms, setRooms] = useState(filters.rooms ?? 1);
    const guestRef = useRef<HTMLDivElement | null>(null);

    const applyRoute = (
        params: Record<string, string | number | null | undefined>,
    ) => {
        const query = Object.fromEntries(
            Object.entries(params).filter(
                ([, value]) =>
                    value !== null && value !== undefined && value !== '',
            ),
        );
        router.get('/stay', query, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const submitSearch = (event: React.FormEvent) => {
        event.preventDefault();
        const totalGuests = adults + children;
        applyRoute({ ...form, guests: totalGuests, rooms, children, sort });
    };

    const applySuggestion = (value: string) => {
        const next = { ...form, q: value };
        setForm(next);
        const totalGuests = adults + children;
        applyRoute({ ...next, guests: totalGuests, rooms, children, sort });
    };

    const applyIntent = (chip: DiscoveryIntentChip) => {
        const totalGuests = adults + children;
        const nextSort =
            typeof chip.filters?.sort === 'string' ? chip.filters.sort : sort;
        setSort(nextSort);
        if (chip.query) {
            setForm((prev) => ({ ...prev, q: chip.query ?? '' }));
        }
        if (chip.filters?.city) {
            setForm((prev) => ({ ...prev, city: chip.filters?.city ?? '' }));
        }
        applyRoute({
            ...form,
            q: chip.query ?? form.q,
            city: (chip.filters?.city as string | undefined) ?? form.city,
            guests: totalGuests,
            rooms,
            children,
            sort: nextSort,
            ...((chip.filters ?? {}) as Record<string, string>),
        });
    };

    const applySort = (value: string) => {
        setSort(value);
        const totalGuests = adults + children;
        applyRoute({
            ...form,
            guests: totalGuests,
            rooms,
            children,
            sort: value,
        });
    };

    const resetDiscovery = () => {
        const next = {
            q: '',
            city: '',
            check_in: defaultCheckIn,
            check_out: defaultCheckOut,
            rooms: 1,
            guests: 2,
            children: 0,
        };
        setForm(next);
        setAdults(2);
        setChildren(0);
        setRooms(1);
        setSort('recommended');
        applyRoute(next);
    };

    useEffect(() => {
        const timer = window.setTimeout(() => setIsReady(true), 350);
        return () => window.clearTimeout(timer);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                guestRef.current &&
                !guestRef.current.contains(event.target as Node)
            ) {
                setGuestOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () =>
            document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const nightCount = (() => {
        if (!form.check_in || !form.check_out) return null;
        const start = new Date(form.check_in);
        const end = new Date(form.check_out);
        const diff = Math.max(
            0,
            Math.round(
                (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
            ),
        );
        return diff > 0 ? diff : null;
    })();

    const categories = [
        { label: 'Wisata', icon: MapPinned, href: '/wisata' },
        { label: 'Event', icon: CalendarCheck, href: '/events' },
        { label: 'Retail Shop', icon: ShoppingBag, href: '/retail-shop' },
        { label: 'Spesial Program', icon: Star, href: '/special-programs' },
        { label: 'Hotel', icon: Ticket, href: '/stay', active: true },
    ];

    const chips = [
        'Alam',
        'Budaya',
        'Edukasi',
        'Kuliner',
        'Desa Wisata',
        'Religi',
        'Pantai',
        'Gunung',
        'Taman Nasional',
        'Air Terjun',
        'Danau',
    ];

    const suggestionGroups = useMemo<DiscoverySuggestionGroup[]>(
        () => [
            {
                label: 'Destinasi populer',
                items: ['Jakarta', 'Bandung', 'Yogyakarta', 'Bali', 'Surabaya'],
            },
            {
                label: 'Hotel',
                items: hotels.map((hotel) => hotel.name).filter(Boolean),
            },
            {
                label: 'Kota & area',
                items: hotels
                    .flatMap((hotel) => [hotel.city_name, hotel.address])
                    .filter((item): item is string => Boolean(item)),
            },
            {
                label: 'Sedang ramai',
                items: discovery?.popular_keywords ?? [],
            },
        ],
        [discovery?.popular_keywords, hotels],
    );

    const filtered = useMemo(() => sortHotels(hotels, sort), [hotels, sort]);
    const dateRecommendations = useMemo(() => {
        const pool =
            recommendations.length > 0 ? recommendations : filtered.slice(0, 6);

        return createRollingRecommendationMap(pool, {
            startDate: new Date(form.check_in),
            days: 24,
            mapItem: (item) => ({
                id: item.id,
                title: item.name,
                imageUrl: item.image_url,
                price: item.min_price ?? null,
            }),
        });
    }, [filtered, form.check_in, recommendations]);

    const activeFilters = useMemo(
        () => [
            ...formatAppliedDiscoveryFilters(meta?.applied_filters),
            ...(sort !== 'recommended'
                ? [
                      sortOptions.find((item) => item.value === sort)?.label ??
                          'Urutan aktif',
                  ]
                : []),
        ],
        [meta?.applied_filters, sort],
    );

    const discoverySections = discovery?.sections ?? [];

    return (
        <PublicLayout categories={categories} chips={chips}>
            <Head title="Cari Hotel">
                <link
                    href="https://fonts.bunny.net/css?family=plus-jakarta-sans:400,500,600,700|space-grotesk:500,600,700"
                    rel="stylesheet"
                />
            </Head>
            <div className="mx-auto w-full max-w-7xl px-4 py-8 md:px-8">
                {!isReady && (
                    <section className="space-y-8">
                        <Skeleton className="h-44 w-full rounded-[28px] sm:h-56 md:h-72" />
                        <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-2">
                            {[0, 1].map((idx) => (
                                <Skeleton
                                    key={idx}
                                    className="h-32 w-full rounded-2xl"
                                />
                            ))}
                        </div>
                    </section>
                )}

                {isReady && (
                    <>
                        <section className="mb-6 space-y-6">
                            <div className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-[0_24px_60px_-26px_rgba(15,23,42,0.28)] sm:p-6">
                                <form
                                    className="grid gap-4 md:grid-cols-[2fr_2fr_1.5fr_1fr_auto]"
                                    onSubmit={submitSearch}
                                >
                                    <div className="grid gap-2">
                                        <label className="text-xs font-semibold text-slate-500 uppercase">
                                            Kota, destinasi, atau nama hotel
                                        </label>
                                        <DiscoverySearchField
                                            value={form.q}
                                            onChange={(value) =>
                                                setForm((prev) => ({
                                                    ...prev,
                                                    q: value,
                                                }))
                                            }
                                            onSuggestionSelect={applySuggestion}
                                            placeholder="Kota, hotel, atau tempat tujuan"
                                            suggestions={suggestionGroups}
                                            suggestionEndpoint="/api/discovery/hotels/suggestions"
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <label className="text-xs font-semibold text-slate-500 uppercase">
                                            Tanggal Check-in & Check-out
                                        </label>
                                        <DiscoveryRangeDatePicker
                                            startDate={form.check_in}
                                            endDate={form.check_out}
                                            onChange={({
                                                startDate,
                                                endDate,
                                            }) =>
                                                setForm((prev) => ({
                                                    ...prev,
                                                    check_in: startDate,
                                                    check_out: endDate,
                                                }))
                                            }
                                            recommendations={
                                                dateRecommendations
                                            }
                                            minDate={new Date()}
                                        />
                                        <div className="text-[11px] text-slate-400">
                                            Durasi:{' '}
                                            {nightCount
                                                ? `${nightCount} malam`
                                                : '-'}
                                        </div>
                                    </div>
                                    <div
                                        className="relative grid gap-2"
                                        ref={guestRef}
                                    >
                                        <label className="text-xs font-semibold text-slate-500 uppercase">
                                            Tamu dan Kamar
                                        </label>
                                        <button
                                            type="button"
                                            className="flex w-full items-center justify-between rounded-xl border border-slate-200 px-4 py-3 text-sm"
                                            onClick={() =>
                                                setGuestOpen((prev) => !prev)
                                            }
                                        >
                                            <span className="text-slate-400">
                                                👥
                                            </span>
                                            <span className="flex-1 pl-2 text-left">
                                                {adults} Dewasa, {children}{' '}
                                                Anak, {rooms} Kamar
                                            </span>
                                            <span className="h-8 w-8 rounded-full bg-sky-100 text-sky-700">
                                                ▾
                                            </span>
                                        </button>
                                        {guestOpen && (
                                            <div className="absolute right-0 z-10 mt-2 w-[320px] rounded-2xl border border-slate-200 bg-white p-4 shadow-lg">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm font-semibold text-slate-700">
                                                        Dewasa
                                                    </span>
                                                    <div className="flex items-center gap-3">
                                                        <button
                                                            type="button"
                                                            className="h-8 w-8 rounded-full bg-slate-100"
                                                            onClick={() =>
                                                                setAdults(
                                                                    (prev) =>
                                                                        Math.max(
                                                                            1,
                                                                            prev -
                                                                                1,
                                                                        ),
                                                                )
                                                            }
                                                        >
                                                            −
                                                        </button>
                                                        <span className="w-6 text-center text-sm font-semibold">
                                                            {adults}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            className="h-8 w-8 rounded-full bg-sky-100 text-sky-700"
                                                            onClick={() =>
                                                                setAdults(
                                                                    (prev) =>
                                                                        prev +
                                                                        1,
                                                                )
                                                            }
                                                        >
                                                            +
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="mt-3 flex items-center justify-between">
                                                    <span className="text-sm font-semibold text-slate-700">
                                                        Anak
                                                    </span>
                                                    <div className="flex items-center gap-3">
                                                        <button
                                                            type="button"
                                                            className="h-8 w-8 rounded-full bg-slate-100"
                                                            onClick={() =>
                                                                setChildren(
                                                                    (prev) =>
                                                                        Math.max(
                                                                            0,
                                                                            prev -
                                                                                1,
                                                                        ),
                                                                )
                                                            }
                                                        >
                                                            −
                                                        </button>
                                                        <span className="w-6 text-center text-sm font-semibold">
                                                            {children}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            className="h-8 w-8 rounded-full bg-sky-100 text-sky-700"
                                                            onClick={() =>
                                                                setChildren(
                                                                    (prev) =>
                                                                        prev +
                                                                        1,
                                                                )
                                                            }
                                                        >
                                                            +
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="mt-3 flex items-center justify-between">
                                                    <span className="text-sm font-semibold text-slate-700">
                                                        Kamar
                                                    </span>
                                                    <div className="flex items-center gap-3">
                                                        <button
                                                            type="button"
                                                            className="h-8 w-8 rounded-full bg-slate-100"
                                                            onClick={() =>
                                                                setRooms(
                                                                    (prev) =>
                                                                        Math.max(
                                                                            1,
                                                                            prev -
                                                                                1,
                                                                        ),
                                                                )
                                                            }
                                                        >
                                                            −
                                                        </button>
                                                        <span className="w-6 text-center text-sm font-semibold">
                                                            {rooms}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            className="h-8 w-8 rounded-full bg-sky-100 text-sky-700"
                                                            onClick={() =>
                                                                setRooms(
                                                                    (prev) =>
                                                                        prev +
                                                                        1,
                                                                )
                                                            }
                                                        >
                                                            +
                                                        </button>
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    className="mt-4 w-full rounded-lg bg-sky-600 py-2 text-sm font-semibold text-white"
                                                    onClick={() =>
                                                        setGuestOpen(false)
                                                    }
                                                >
                                                    Selesai
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    <div className="grid gap-2">
                                        <label className="text-xs font-semibold text-slate-500 uppercase">
                                            Rekomendasi
                                        </label>
                                        <DiscoverySortSelect
                                            value={sort}
                                            options={sortOptions}
                                            onChange={applySort}
                                        />
                                    </div>
                                    <button className="h-12 rounded-full bg-sky-600 px-8 text-sm font-semibold text-white shadow-md">
                                        Cari
                                    </button>
                                </form>
                                <div className="mt-4 space-y-1">
                                    <div className="text-sm font-semibold text-sky-700">
                                        Pilihan hotel untuk perjalananmu
                                    </div>
                                    <p className="text-sm text-slate-500">
                                        Cari hotel berdasarkan kota, tanggal
                                        menginap, jumlah tamu, atau urutan yang
                                        paling sesuai.
                                    </p>
                                </div>
                                <ActiveFilterChips
                                    filters={activeFilters}
                                    onReset={resetDiscovery}
                                />
                                <DiscoveryInsightStrip
                                    tips={[
                                        {
                                            title: 'Bandingkan harga per malam',
                                            body: 'Urutkan harga untuk menemukan pilihan yang paling pas dengan budgetmu.',
                                            icon: (
                                                <Ticket className="h-5 w-5" />
                                            ),
                                        },
                                        {
                                            title: 'Cek fasilitas penting',
                                            body: 'Sarapan, area merokok, dan detail kamar membantu kamu membandingkan hotel dengan cepat.',
                                            icon: (
                                                <Coffee className="h-5 w-5" />
                                            ),
                                        },
                                    ]}
                                />
                            </div>

                            <DiscoveryIntentRow
                                chips={discovery?.intent_chips ?? []}
                                onSelect={applyIntent}
                            />

                            <DiscoveryFeaturedShowcase
                                section={discovery?.featured}
                                theme={discoveryTheme}
                            />

                            {discoverySections.slice(0, 2).map((section) => (
                                <DiscoveryCollectionRail
                                    key={section.key}
                                    section={section}
                                    theme={discoveryTheme}
                                />
                            ))}
                        </section>

                        <div className="mt-8 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
                            {filtered.map((hotel) => {
                                const detailSlug =
                                    hotel.slug ?? hotel.encrypted_id;
                                return (
                                    <div
                                        key={hotel.id}
                                        className="group overflow-hidden rounded-xl bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg"
                                    >
                                        <Link
                                            href={
                                                detailSlug
                                                    ? `/stay/hotels/${detailSlug}?check_in=${form.check_in}&check_out=${form.check_out}&rooms=${form.rooms}&guests=${form.guests}&children=${children}`
                                                    : '/stay'
                                            }
                                            className="relative block h-28 overflow-hidden"
                                        >
                                            <img
                                                src={
                                                    hotel.image_url ??
                                                    '/images/placeholder-card.jpg'
                                                }
                                                alt={hotel.name}
                                                className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                                            <div className="absolute top-2 left-2 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-slate-700 shadow-sm">
                                                {hotel.star_rating
                                                    ? `${hotel.star_rating}★`
                                                    : 'Hotel'}
                                            </div>
                                        </Link>
                                        <div className="p-3">
                                            <div className="flex items-start justify-between gap-4">
                                                <div>
                                                    <h2 className="text-sm font-semibold text-slate-900">
                                                        {hotel.name}
                                                    </h2>
                                                    <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                                                        <MapPinned className="h-3 w-3 text-sky-500" />
                                                        {hotel.city_name ??
                                                            hotel.address ??
                                                            'Indonesia'}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-0.5">
                                                    {Array.from({
                                                        length: Math.max(
                                                            0,
                                                            Math.round(
                                                                hotel.star_rating ??
                                                                    0,
                                                            ),
                                                        ),
                                                    }).map((_, idx) => (
                                                        <Star
                                                            key={`${hotel.id}-star-${idx}`}
                                                            className="h-3 w-3 fill-yellow-400 text-yellow-400"
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="mt-3 flex items-center justify-between">
                                                <div>
                                                    <div className="text-[11px] text-slate-500">
                                                        Mulai
                                                    </div>
                                                    <div className="text-sm font-semibold text-sky-600">
                                                        {hotel.min_price
                                                            ? `Rp ${hotel.min_price.toLocaleString('id-ID')}`
                                                            : '-'}
                                                    </div>
                                                </div>
                                                <Link
                                                    href={
                                                        detailSlug
                                                            ? `/stay/hotels/${detailSlug}?check_in=${form.check_in}&check_out=${form.check_out}&rooms=${form.rooms}&guests=${form.guests}&children=${children}`
                                                            : '/stay'
                                                    }
                                                    className="rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-sky-700"
                                                >
                                                    Lihat Detail
                                                </Link>
                                            </div>
                                            <div className="mt-3 flex flex-wrap gap-2">
                                                <span
                                                    className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold ${
                                                        hotel.breakfast_included
                                                            ? 'bg-emerald-50 text-emerald-700'
                                                            : 'bg-slate-100 text-slate-500'
                                                    }`}
                                                >
                                                    <Coffee className="h-3 w-3" />
                                                    {hotel.breakfast_included
                                                        ? 'Termasuk sarapan'
                                                        : 'Tanpa sarapan'}
                                                </span>
                                                <span
                                                    className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold ${
                                                        hotel.smoking_allowed
                                                            ? 'bg-amber-50 text-amber-700'
                                                            : 'bg-slate-100 text-slate-500'
                                                    }`}
                                                >
                                                    {hotel.smoking_allowed ? (
                                                        <Cigarette className="h-3 w-3" />
                                                    ) : (
                                                        <CigaretteOff className="h-3 w-3" />
                                                    )}
                                                    {hotel.smoking_allowed
                                                        ? 'Boleh merokok'
                                                        : 'No smoking'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}

                            {filtered.length === 0 && (
                                <div className="col-span-full">
                                    <DiscoveryEmptyState
                                        title={
                                            discovery?.empty_state?.title ??
                                            'Hotel belum ditemukan'
                                        }
                                        description={
                                            discovery?.empty_state?.message ??
                                            'Coba ubah tanggal, kota, jumlah tamu, atau reset filter agar hasil lebih luas.'
                                        }
                                        suggestions={
                                            discovery?.empty_state
                                                ?.recommended_keywords ?? [
                                                'Jakarta',
                                                'Bandung',
                                                'Yogyakarta',
                                                'Bali',
                                                'Surabaya',
                                            ]
                                        }
                                        onSuggestionSelect={applySuggestion}
                                        onReset={resetDiscovery}
                                    />
                                </div>
                            )}
                        </div>

                        {filtered.length === 0 && (
                            <section className="mt-10">
                                <h2 className="text-xl font-semibold text-slate-900">
                                    Rekomendasi untuk kamu
                                </h2>
                                <p className="mt-2 text-sm text-slate-500">
                                    Pilihan hotel favorit dengan lokasi
                                    strategis dan fasilitas lengkap.
                                </p>
                                <div className="mt-6 grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3">
                                    {recommendations.map((item) => {
                                        const detailSlug =
                                            item.slug ?? item.encrypted_id;
                                        return (
                                            <div
                                                key={item.id}
                                                className="overflow-hidden rounded-2xl bg-white shadow-sm"
                                            >
                                                <img
                                                    src={
                                                        item.image_url ??
                                                        '/images/placeholder-card.jpg'
                                                    }
                                                    alt={item.name}
                                                    className="h-44 w-full object-cover"
                                                />
                                                <div className="p-4">
                                                    <h3 className="text-sm font-semibold text-slate-900">
                                                        {item.name}
                                                    </h3>
                                                    <p className="text-xs text-slate-500">
                                                        {item.city_name ??
                                                            'Indonesia'}
                                                    </p>
                                                    <div className="mt-3 text-sm font-semibold text-sky-600">
                                                        {item.min_price
                                                            ? `Mulai Rp ${item.min_price.toLocaleString('id-ID')}`
                                                            : 'Harga tersedia'}
                                                    </div>
                                                    <Link
                                                        href={
                                                            detailSlug
                                                                ? `/stay/hotels/${detailSlug}?check_in=${form.check_in || ''}&check_out=${form.check_out || ''}&rooms=${rooms}&guests=${adults + children}&children=${children}`
                                                                : '/stay'
                                                        }
                                                        className="mt-4 block w-full rounded-lg bg-sky-600 px-4 py-2 text-center text-xs font-semibold text-white"
                                                    >
                                                        Lihat Detail
                                                    </Link>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </section>
                        )}
                    </>
                )}
            </div>
            <footer className="mt-10 border-t border-slate-200 bg-white">
                <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-10 md:grid-cols-4 md:px-8">
                    <div>
                        <Link href="/">
                            <img
                                src="/logo.png"
                                alt="Indotix"
                                className="h-11 w-36 object-contain"
                            />
                        </Link>
                        <p className="mt-3 text-sm text-slate-600">
                            Neo Soho Capital 40th Floor
                            <br />
                            Jl. Tanjung Duren Raya No 1<br />
                            Jakarta Barat, DKI Jakarta 11470
                        </p>
                        <p className="mt-4 text-sm text-slate-600">
                            0812 9205 9888
                        </p>
                        <p className="text-sm text-slate-600">
                            info@indotix.co.id
                        </p>
                    </div>
                    <div>
                        <h4 className="text-sm font-semibold text-slate-900">
                            Layanan
                        </h4>
                        <ul className="mt-3 space-y-2 text-sm text-slate-600">
                            <li>Wisata</li>
                            <li>Special Program</li>
                            <li>Event</li>
                            <li>Hotel</li>
                            <li>Retail Shop</li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-sm font-semibold text-slate-900">
                            Perusahaan
                        </h4>
                        <ul className="mt-3 space-y-2 text-sm text-slate-600">
                            <li>
                                <Link
                                    href="/about"
                                    className="transition hover:text-sky-600"
                                >
                                    Tentang Kami
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/jelajah"
                                    className="transition hover:text-sky-600"
                                >
                                    Blog
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/faq"
                                    className="transition hover:text-sky-600"
                                >
                                    FAQ
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/privacy-policy"
                                    className="transition hover:text-sky-600"
                                >
                                    Kebijakan Privasi
                                </Link>
                            </li>
                        </ul>
                    </div>
                    <FooterDownloadSocial />
                </div>
                <div className="border-t border-slate-200 py-4 text-center text-xs text-slate-500">
                    © 2025 Indotix. All rights reserved.
                </div>
            </footer>
        </PublicLayout>
    );
}
