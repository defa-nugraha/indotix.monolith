import { Head, Link, router } from '@inertiajs/react';
import {
    CalendarCheck,
    MapPinned,
    ShoppingBag,
    Star,
    Ticket,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import {
    DiscoveryCollectionRail,
    DiscoveryFeaturedShowcase,
    DiscoveryIntentRow,
    type DiscoveryExperiencePayload,
    type DiscoveryIntentChip,
    type DiscoveryTheme,
} from '@/components/discovery/discovery-experience';
import {
    DiscoverySingleDatePicker,
    createDateRecommendationMap,
} from '@/components/discovery/product-date-picker';
import {
    DiscoveryEmptyState,
    DiscoveryInsightStrip,
    DiscoverySearchField,
    DiscoverySortSelect,
    type DiscoverySuggestionGroup,
} from '@/components/discovery/product-discovery';
import { FooterDownloadSocial } from '@/components/footer-download-social';
import { PublicSeo } from '@/components/public-seo';
import { Skeleton } from '@/components/ui/skeleton';
import PublicLayout from '@/layouts/public-layout';

type EventCard = {
    id: number;
    encrypted_id: string;
    slug?: string | null;
    title: string;
    city_name?: string | null;
    location?: string | null;
    start_at?: string | null;
    min_price?: number | null;
    image_url?: string | null;
};

const sortOptions = [
    { value: 'recommended', label: 'Rekomendasi' },
    { value: 'date_soon', label: 'Segera berlangsung' },
    { value: 'price_low', label: 'Harga termurah' },
    { value: 'price_high', label: 'Harga termahal' },
    { value: 'title', label: 'Nama A-Z' },
];

const sortEvents = (items: EventCard[], sort: string) => {
    const results = [...items];
    if (sort === 'date_soon') {
        return results.sort((a, b) => {
            const aTime = a.start_at
                ? new Date(a.start_at).getTime()
                : Number.MAX_SAFE_INTEGER;
            const bTime = b.start_at
                ? new Date(b.start_at).getTime()
                : Number.MAX_SAFE_INTEGER;
            return aTime - bTime;
        });
    }
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
    if (sort === 'title') {
        return results.sort((a, b) => a.title.localeCompare(b.title));
    }
    return results;
};

const eventChips = [
    'Konser',
    'Festival',
    'Komunitas',
    'Workshop',
    'Olahraga',
    'Keluarga',
    'Kuliner',
    'Seni',
    'Budaya',
    'Edukasi',
    'Pameran',
];

const discoveryTheme: DiscoveryTheme = {
    badge: 'Pilihan Event',
    title: 'Jelajahi event lewat momentum, kota, dan tema favorit',
    description:
        'Temukan event seru dari kota populer, jadwal terdekat, dan tema yang sedang ramai.',
    accent: 'bg-sky-600 hover:bg-sky-700',
    gradientClassName:
        'bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.12),_transparent_30%),linear-gradient(135deg,#0B3B8F,#1D73D6,#4CC9F0)]',
    surfaceClassName: 'bg-sky-50 text-sky-700',
    icon: CalendarCheck,
};

export default function EventSearch({
    events = [],
    filters,
    discovery,
}: {
    events: EventCard[];
    filters: {
        q?: string | null;
        sort?: string | null;
        start_date?: string | null;
        quantity?: number | null;
    };
    discovery?: DiscoveryExperiencePayload | null;
    meta?: { total?: number; applied_filters?: Record<string, unknown> } | null;
}) {
    const [isReady, setIsReady] = useState(false);
    const [form, setForm] = useState({
        q: filters.q ?? '',
        start_date: filters.start_date ?? new Date().toISOString().slice(0, 10),
        quantity: filters.quantity ?? 1,
    });
    const [sort, setSort] = useState(filters.sort ?? 'recommended');

    useEffect(() => {
        const timer = setTimeout(() => setIsReady(true), 400);
        return () => clearTimeout(timer);
    }, []);

    const categories = [
        { label: 'Wisata', icon: MapPinned, href: '/wisata', active: false },
        { label: 'Event', icon: CalendarCheck, href: '/events', active: true },
        {
            label: 'Retail Shop',
            icon: ShoppingBag,
            href: '/retail-shop',
            active: false,
        },
        {
            label: 'Spesial Program',
            icon: Star,
            href: '/special-programs',
            active: false,
        },
        { label: 'Hotel', icon: Ticket, href: '/stay', active: false },
    ];
    const applyRoute = (
        params: Record<string, string | number | null | undefined>,
    ) => {
        const query = Object.fromEntries(
            Object.entries(params).filter(
                ([, value]) =>
                    value !== null && value !== undefined && value !== '',
            ),
        );
        router.get('/events', query, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const submitSearch = (event: React.FormEvent) => {
        event.preventDefault();
        applyRoute({
            q: form.q,
            start_date: form.start_date,
            quantity: form.quantity,
            sort,
        });
    };

    const applySuggestion = (value: string) => {
        setForm((prev) => ({ ...prev, q: value }));
        applyRoute({
            q: value,
            start_date: form.start_date,
            quantity: form.quantity,
            sort,
        });
    };

    const applyIntent = (chip: DiscoveryIntentChip) => {
        const nextSort =
            typeof chip.filters?.sort === 'string' ? chip.filters.sort : sort;
        setSort(nextSort);
        if (chip.query) {
            setForm((prev) => ({ ...prev, q: chip.query ?? '' }));
        }
        applyRoute({
            q: chip.query ?? form.q,
            start_date: form.start_date,
            quantity: form.quantity,
            sort: nextSort,
            ...((chip.filters ?? {}) as Record<string, string>),
        });
    };

    const applySort = (value: string) => {
        setSort(value);
        applyRoute({
            q: form.q,
            start_date: form.start_date,
            quantity: form.quantity,
            sort: value,
        });
    };

    const resetDiscovery = () => {
        const next = {
            q: '',
            start_date: new Date().toISOString().slice(0, 10),
            quantity: 1,
        };
        setForm(next);
        setSort('recommended');
        applyRoute(next);
    };

    const suggestionGroups = useMemo<DiscoverySuggestionGroup[]>(
        () => [
            { label: 'Pencarian populer', items: eventChips },
            {
                label: 'Event',
                items: events.map((event) => event.title).filter(Boolean),
            },
            {
                label: 'Lokasi',
                items: events
                    .flatMap((event) => [event.city_name, event.location])
                    .filter((item): item is string => Boolean(item)),
            },
            {
                label: 'Sedang ramai',
                items: discovery?.popular_keywords ?? [],
            },
        ],
        [discovery?.popular_keywords, events],
    );

    const filtered = useMemo(() => sortEvents(events, sort), [events, sort]);
    const dateRecommendations = useMemo(
        () =>
            createDateRecommendationMap(filtered, {
                getDateKeys: (item) => [item.start_at],
                mapItem: (item) => ({
                    id: item.id,
                    title: item.title,
                    imageUrl: item.image_url,
                    price: item.min_price ?? null,
                }),
                limit: 18,
            }),
        [filtered],
    );

    const discoverySections = discovery?.sections ?? [];
    const fallbackImage =
        discovery?.featured?.items?.[0]?.image_url ??
        events.find((item) => item.image_url)?.image_url;

    return (
        <PublicLayout categories={categories} chips={eventChips}>
            <PublicSeo
                title="Event di Indotix"
                description="Temukan event seru, jadwal terbaru, lokasi, tiket tersedia, dan harga event pilihan di Indotix."
                canonicalPath="/events"
                image={fallbackImage}
                type="event"
                structuredData={{
                    '@context': 'https://schema.org',
                    '@type': 'ItemList',
                    name: 'Daftar event Indotix',
                    itemListElement: filtered
                        .slice(0, 12)
                        .map((event, index) => ({
                            '@type': 'ListItem',
                            position: index + 1,
                            name: event.title,
                            url: `/events/${event.slug ?? event.encrypted_id}`,
                        })),
                }}
            />
            <Head>
                <link
                    href="https://fonts.bunny.net/css?family=plus-jakarta-sans:400,500,600,700|space-grotesk:500,600,700"
                    rel="stylesheet"
                />
            </Head>
            <main className="mx-auto w-full max-w-7xl px-4 py-8 md:px-8">
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
                        <section className="space-y-6">
                            <div className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-[0_24px_60px_-26px_rgba(15,23,42,0.28)] sm:p-6">
                                <form
                                    className="grid gap-4 md:grid-cols-[2fr_1.5fr_1fr_1fr_auto]"
                                    onSubmit={submitSearch}
                                >
                                    <div className="grid gap-2">
                                        <label className="text-xs font-semibold text-slate-500 uppercase">
                                            Nama event atau kota
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
                                            placeholder="Cari nama event atau lokasi"
                                            suggestions={suggestionGroups}
                                            suggestionEndpoint="/api/discovery/events/suggestions"
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <label className="text-xs font-semibold text-slate-500 uppercase">
                                            Tanggal event
                                        </label>
                                        <DiscoverySingleDatePicker
                                            value={form.start_date}
                                            onChange={(value) =>
                                                setForm((prev) => ({
                                                    ...prev,
                                                    start_date: value,
                                                }))
                                            }
                                            recommendations={
                                                dateRecommendations
                                            }
                                            minDate={new Date()}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <label className="text-xs font-semibold text-slate-500 uppercase">
                                            Jumlah tiket
                                        </label>
                                        <div className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm">
                                            <span className="text-slate-400">
                                                🎟️
                                            </span>
                                            <input
                                                type="number"
                                                min={1}
                                                value={form.quantity}
                                                onChange={(event) =>
                                                    setForm((prev) => ({
                                                        ...prev,
                                                        quantity: Number(
                                                            event.target.value,
                                                        ),
                                                    }))
                                                }
                                                className="w-20 bg-transparent outline-none"
                                            />
                                        </div>
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
                                        Pilihan event untukmu
                                    </div>
                                    <p className="text-sm text-slate-500">
                                        Cari berdasarkan nama event, kota, atau
                                        urutan terbaik untuk mulai menjelajah.
                                    </p>
                                </div>
                                <DiscoveryInsightStrip
                                    tips={[
                                        {
                                            title: 'Prioritaskan momentum',
                                            body: 'Lihat jadwal terdekat kalau kamu ingin cepat menemukan acara yang pas.',
                                            icon: (
                                                <CalendarCheck className="h-5 w-5" />
                                            ),
                                        },
                                        {
                                            title: 'Jelajah lewat kota',
                                            body: 'Pilih kota yang ramai untuk melihat event menarik yang sedang tersedia.',
                                            icon: (
                                                <MapPinned className="h-5 w-5" />
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

                        <div className="mt-8 grid grid-cols-2 gap-4 max-md:-mx-4 max-md:flex max-md:snap-x max-md:overflow-x-auto max-md:px-4 max-md:pb-3 max-md:[scrollbar-width:none] sm:gap-6 lg:grid-cols-3 xl:grid-cols-4 max-md:[&::-webkit-scrollbar]:hidden">
                            {filtered.map((event) => {
                                const detailSlug =
                                    event.slug ?? event.encrypted_id;
                                return (
                                    <div
                                        key={event.id}
                                        className="group overflow-hidden rounded-xl bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg max-md:w-[46vw] max-md:min-w-[10.5rem] max-md:snap-start"
                                    >
                                        <Link
                                            href={`/events/${detailSlug}`}
                                            className="relative block h-28 overflow-hidden max-md:h-24"
                                        >
                                            <img
                                                src={
                                                    event.image_url ??
                                                    fallbackImage ??
                                                    '/images/placeholder-card.jpg'
                                                }
                                                alt={event.title}
                                                loading="lazy"
                                                decoding="async"
                                                className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                                            <div className="absolute top-2 left-2 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-slate-700 shadow-sm">
                                                Event
                                            </div>
                                        </Link>
                                        <div className="p-3">
                                            <div className="flex items-start justify-between gap-4">
                                                <div>
                                                    <h2 className="line-clamp-2 text-sm leading-snug font-semibold text-slate-900">
                                                        {event.title}
                                                    </h2>
                                                    <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                                                        <MapPinned className="h-3 w-3 text-sky-500" />
                                                        {event.city_name ??
                                                            'Indonesia'}
                                                    </p>
                                                    <p className="mt-1 text-xs text-slate-500">
                                                        {event.start_at ??
                                                            'Segera'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="mt-3 flex items-center justify-between">
                                                <div>
                                                    <div className="text-[11px] text-slate-500">
                                                        Mulai
                                                    </div>
                                                    <div className="text-sm font-semibold text-sky-600">
                                                        {event.min_price
                                                            ? `Rp ${event.min_price.toLocaleString('id-ID')}`
                                                            : '-'}
                                                    </div>
                                                </div>
                                                <Link
                                                    href={`/events/${detailSlug}`}
                                                    className="rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-sky-700"
                                                >
                                                    Lihat Detail
                                                </Link>
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
                                            'Event belum ditemukan'
                                        }
                                        description={
                                            discovery?.empty_state?.message ??
                                            'Coba gunakan kata kunci yang lebih umum, pilih kota lain, atau reset filter agar hasil lebih luas.'
                                        }
                                        suggestions={
                                            discovery?.empty_state
                                                ?.recommended_keywords ??
                                            eventChips
                                        }
                                        onSuggestionSelect={applySuggestion}
                                        onReset={resetDiscovery}
                                    />
                                </div>
                            )}
                        </div>
                    </>
                )}
            </main>
            <footer className="mt-10 border-t border-slate-200 bg-white">
                <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-10 md:grid-cols-4 md:px-8">
                    <div>
                        <Link href="/">
                            <img
                                src="/logo.png"
                                alt="Indotix"
                                loading="lazy"
                                decoding="async"
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
                        <h4 className="line-clamp-2 text-sm leading-snug font-semibold text-slate-900">
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
                        <h4 className="line-clamp-2 text-sm leading-snug font-semibold text-slate-900">
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
