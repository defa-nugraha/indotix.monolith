import { Head, Link, router, usePage } from '@inertiajs/react';
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
    ActiveFilterChips,
    DiscoveryEmptyState,
    DiscoveryInsightStrip,
    DiscoverySearchField,
    DiscoverySortSelect,
    formatAppliedDiscoveryFilters,
    type DiscoverySuggestionGroup,
} from '@/components/discovery/product-discovery';
import {
    Bell,
    CalendarCheck,
    History as HistoryIcon,
    MapPinned,
    MessageCircle,
    ShoppingBag,
    Star,
    Ticket,
    UserCircle,
    BookOpen,
    ShoppingCart,
    BadgePercent,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import PublicLayout from '@/layouts/public-layout';

type AcademyCard = {
    id: number;
    encrypted_id: string;
    slug?: string | null;
    title: string;
    category?: string | null;
    start_at?: string | null;
    location?: string | null;
    min_price?: number | null;
    image_url?: string | null;
};

const sortOptions = [
    { value: 'recommended', label: 'Rekomendasi' },
    { value: 'date_soon', label: 'Jadwal terdekat' },
    { value: 'price_low', label: 'Harga termurah' },
    { value: 'price_high', label: 'Harga termahal' },
    { value: 'title', label: 'Nama A-Z' },
];

const sortClasses = (items: AcademyCard[], sort: string) => {
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

const discoveryTheme: DiscoveryTheme = {
    badge: 'Academy Discovery',
    title: 'Masuk ke kelas dari intent belajar, bukan sekadar keyword',
    description:
        'Discovery academy dibuat seperti learning marketplace: ada spotlight, jalur pemula, topik populer, dan kelas yang waktunya paling dekat.',
    accent: 'bg-violet-600 hover:bg-violet-700',
    gradientClassName:
        'bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.12),_transparent_30%),linear-gradient(135deg,#4c1d95,#7c3aed,#2563eb)]',
    surfaceClassName: 'bg-violet-50 text-violet-700',
    icon: BookOpen,
};

export default function AcademySearch({
    classes = [],
    filters,
    discovery,
    meta,
}: {
    classes: AcademyCard[];
    filters: { q?: string | null; sort?: string | null };
    discovery?: DiscoveryExperiencePayload | null;
    meta?: { total?: number; applied_filters?: Record<string, unknown> } | null;
}) {
    const { auth, unread_notifications, souvenir_cart_count, affiliate_menu } =
        usePage().props as {
            auth?: { user?: { role?: string } };
            unread_notifications?: number;
            souvenir_cart_count?: number;
            affiliate_menu?: boolean;
        };
    const [isReady, setIsReady] = useState(false);
    const [form, setForm] = useState({
        q: filters.q ?? '',
        visit_date: new Date().toISOString().slice(0, 10),
        quantity: 1,
    });
    const [sort, setSort] = useState(filters.sort ?? 'recommended');

    useEffect(() => {
        const timer = setTimeout(() => setIsReady(true), 400);
        return () => clearTimeout(timer);
    }, []);

    const categories = [
        { label: 'Wisata', icon: MapPinned, href: '/wisata', active: false },
        { label: 'Event', icon: CalendarCheck, href: '/events', active: false },
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
        { label: 'Academy', icon: BookOpen, href: '/academy', active: true },
        { label: 'Hotel', icon: Ticket, href: '/stay', active: false },
    ];
    const chips = [
        'Hospitality',
        'Event',
        'Marketing',
        'Leadership',
        'Operasional',
        'Digital',
        'Public Speaking',
        'Branding',
        'Keuangan',
        'Customer Care',
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
        router.get('/academy', query, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const submitSearch = (event: React.FormEvent) => {
        event.preventDefault();
        applyRoute({ q: form.q, sort });
    };

    const applySuggestion = (value: string) => {
        setForm((prev) => ({ ...prev, q: value }));
        applyRoute({ q: value, sort });
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
            sort: nextSort,
            ...((chip.filters ?? {}) as Record<string, string>),
        });
    };

    const applySort = (value: string) => {
        setSort(value);
        applyRoute({ q: form.q, sort: value });
    };

    const resetDiscovery = () => {
        setForm((prev) => ({ ...prev, q: '' }));
        setSort('recommended');
        applyRoute({});
    };

    const suggestionGroups = useMemo<DiscoverySuggestionGroup[]>(
        () => [
            { label: 'Topik populer', items: chips },
            {
                label: 'Kelas',
                items: classes.map((item) => item.title).filter(Boolean),
            },
            {
                label: 'Kategori & lokasi',
                items: classes
                    .flatMap((item) => [item.category, item.location])
                    .filter((item): item is string => Boolean(item)),
            },
            {
                label: 'Discovery',
                items: discovery?.popular_keywords ?? [],
            },
        ],
        [classes, discovery?.popular_keywords],
    );

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

    const filtered = useMemo(() => sortClasses(classes, sort), [classes, sort]);
    const fallbackImage =
        discovery?.featured?.items?.[0]?.image_url ??
        classes.find((item) => item.image_url)?.image_url;
    const discoverySections = discovery?.sections ?? [];

    return (
        <PublicLayout categories={categories} chips={chips}>
            <Head title="Eljohn Academy">
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
                                    className="grid gap-4 md:grid-cols-[2fr_1.5fr_1fr_auto]"
                                    onSubmit={submitSearch}
                                >
                                    <div className="grid gap-2">
                                        <label className="text-xs font-semibold text-slate-500 uppercase">
                                            Nama kelas atau kategori
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
                                            placeholder="Cari kelas academy"
                                            suggestions={suggestionGroups}
                                            suggestionEndpoint="/api/discovery/academy/suggestions"
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <label className="text-xs font-semibold text-slate-500 uppercase">
                                            Tanggal kelas
                                        </label>
                                        <div className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm">
                                            <span className="text-slate-400">
                                                📅
                                            </span>
                                            <input
                                                type="date"
                                                value={form.visit_date}
                                                onChange={(event) =>
                                                    setForm((prev) => ({
                                                        ...prev,
                                                        visit_date:
                                                            event.target.value,
                                                    }))
                                                }
                                                className="w-full bg-transparent outline-none"
                                            />
                                        </div>
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
                                    <button className="h-12 rounded-full bg-sky-600 px-8 text-sm font-semibold text-white shadow-md">
                                        Cari
                                    </button>
                                </form>
                                <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                    <div className="text-sm font-semibold text-sky-700">
                                        Discovery kelas yang lebih terarah
                                    </div>
                                    <DiscoverySortSelect
                                        className="md:w-64"
                                        value={sort}
                                        options={sortOptions}
                                        onChange={applySort}
                                    />
                                </div>
                                <ActiveFilterChips
                                    filters={activeFilters}
                                    onReset={resetDiscovery}
                                />
                                <DiscoveryInsightStrip
                                    tips={[
                                        {
                                            title: 'Masuk dari jalur belajar',
                                            body: 'Koleksi pemula, topik populer, dan kelas dekat jadwal membantu user memilih tanpa harus tahu nama kelas.',
                                            icon: (
                                                <CalendarCheck className="h-5 w-5" />
                                            ),
                                        },
                                        {
                                            title: 'Topik dulu, detail belakangan',
                                            body: 'Gunakan entry point seperti marketing, hospitality, leadership, atau digital untuk mulai eksplorasi.',
                                            icon: (
                                                <BookOpen className="h-5 w-5" />
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

                            {discoverySections
                                .slice(0, 2)
                                .map((section) => (
                                    <DiscoveryCollectionRail
                                        key={section.key}
                                        section={section}
                                        theme={discoveryTheme}
                                    />
                                ))}


                        </section>

                        <div className="mt-8 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
                            {filtered.map((item) => {
                                const detailSlug =
                                    item.slug ?? item.encrypted_id;
                                return (
                                    <div
                                        key={item.id}
                                        className="group overflow-hidden rounded-xl bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg"
                                    >
                                        <Link
                                            href={`/academy/${detailSlug}`}
                                            className="relative block h-28 overflow-hidden"
                                        >
                                            <img
                                                src={
                                                    item.image_url ??
                                                    fallbackImage ??
                                                    '/images/placeholder-card.jpg'
                                                }
                                                alt={item.title}
                                                className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                                            <div className="absolute top-2 left-2 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-slate-700 shadow-sm">
                                                Academy
                                            </div>
                                        </Link>
                                        <div className="p-3">
                                            <div className="flex items-start justify-between gap-4">
                                                <div>
                                                    <h2 className="text-sm font-semibold text-slate-900">
                                                        {item.title}
                                                    </h2>
                                                    <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                                                        <BookOpen className="h-3 w-3 text-sky-500" />
                                                        {item.category ??
                                                            'Kelas Academy'}
                                                    </p>
                                                </div>
                                                <span className="text-xs font-semibold text-sky-600">
                                                    {item.start_at ?? '-'}
                                                </span>
                                            </div>
                                            <div className="mt-3 flex items-center justify-between">
                                                <span className="text-xs text-slate-500">
                                                    {item.location ??
                                                        'Lokasi kelas'}
                                                </span>
                                                <span className="text-sm font-semibold text-sky-600">
                                                    {item.min_price
                                                        ? `Rp ${item.min_price.toLocaleString('id-ID')}`
                                                        : '-'}
                                                </span>
                                            </div>
                                            <Link
                                                href={`/academy/${detailSlug}`}
                                                className="mt-3 inline-flex w-full items-center justify-center rounded-lg bg-sky-600 px-3 py-2 text-xs font-semibold text-white"
                                            >
                                                Lihat Detail
                                            </Link>
                                        </div>
                                    </div>
                                );
                            })}
                            {filtered.length === 0 && (
                                <div className="col-span-full">
                                    <DiscoveryEmptyState
                                        title={
                                            discovery?.empty_state?.title ??
                                            'Kelas belum ditemukan'
                                        }
                                        description={
                                            discovery?.empty_state?.message ??
                                            'Coba cari kategori skill lain, gunakan kata kunci yang lebih umum, atau reset filter.'
                                        }
                                        suggestions={
                                            discovery?.empty_state
                                                ?.recommended_keywords ?? chips
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
        </PublicLayout>
    );
}
