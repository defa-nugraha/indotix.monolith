import { Head, Link, router, usePage } from '@inertiajs/react';
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
    ShoppingCart,
    BadgePercent,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import {
    DiscoveryCollectionRail,
    DiscoveryFeaturedShowcase,
    DiscoveryIntentRow,
    DiscoveryStoryHero,
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
import { FooterDownloadSocial } from '@/components/footer-download-social';
import { Skeleton } from '@/components/ui/skeleton';
import PublicLayout from '@/layouts/public-layout';

type ProgramCard = {
    id: number;
    encrypted_id: string;
    slug?: string | null;
    name: string;
    category?: string | null;
    min_price?: number | null;
    image_url?: string | null;
};

const sortOptions = [
    { value: 'recommended', label: 'Rekomendasi' },
    { value: 'price_low', label: 'Harga termurah' },
    { value: 'price_high', label: 'Harga termahal' },
    { value: 'title', label: 'Nama A-Z' },
];

const sortPrograms = (items: ProgramCard[], sort: string) => {
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
    if (sort === 'title') {
        return results.sort((a, b) => a.name.localeCompare(b.name));
    }
    return results;
};

const discoveryTheme: DiscoveryTheme = {
    badge: 'Program Discovery',
    title: 'Temukan program dari value, urgency, dan kategori yang terasa relevan',
    description:
        'Discovery special program diarahkan lewat spotlight, intent, kuota terbatas, dan koleksi tematik supaya terasa lebih eksklusif.',
    accent: 'bg-rose-600 hover:bg-rose-700',
    gradientClassName:
        'bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.12),_transparent_30%),linear-gradient(135deg,#9f1239,#db2777,#7c3aed)]',
    surfaceClassName: 'bg-rose-50 text-rose-700',
    icon: Star,
};

export default function SpecialProgramSearch({
    programs = [],
    filters,
    discovery,
    meta,
}: {
    programs: ProgramCard[];
    filters: { q?: string | null; category?: string | null; sort?: string | null };
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
        category: filters.category ?? '',
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
            active: true,
        },
        { label: 'Hotel', icon: Ticket, href: '/stay', active: false },
    ];
    const chips = [
        'Promo',
        'Diskon',
        'Flash Sale',
        'Liburan',
        'Eksklusif',
        'Hemat',
        'Highlight',
        'Early Access',
        'Bundling',
        'Best Deal',
        'Limited',
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
        router.get('/special-programs', query, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const submitSearch = (event: React.FormEvent) => {
        event.preventDefault();
        applyRoute({ q: form.q, category: form.category, sort });
    };

    const applySuggestion = (value: string) => {
        const next = { ...form, q: value };
        setForm(next);
        applyRoute({ ...next, sort });
    };

    const applyIntent = (chip: DiscoveryIntentChip) => {
        const nextSort =
            typeof chip.filters?.sort === 'string' ? chip.filters.sort : sort;
        setSort(nextSort);
        if (chip.query) {
            setForm((prev) => ({ ...prev, q: chip.query ?? '' }));
        }
        if (chip.filters?.category) {
            setForm((prev) => ({
                ...prev,
                category: chip.filters?.category ?? '',
            }));
        }
        applyRoute({
            q: chip.query ?? form.q,
            category:
                (chip.filters?.category as string | undefined) ?? form.category,
            sort: nextSort,
            ...((chip.filters ?? {}) as Record<string, string>),
        });
    };

    const applySort = (value: string) => {
        setSort(value);
        applyRoute({ q: form.q, category: form.category, sort: value });
    };

    const resetDiscovery = () => {
        setForm({ q: '', category: '' });
        setSort('recommended');
        applyRoute({});
    };

    const suggestionGroups = useMemo<DiscoverySuggestionGroup[]>(
        () => [
            { label: 'Keyword populer', items: chips },
            {
                label: 'Program',
                items: programs.map((program) => program.name).filter(Boolean),
            },
            {
                label: 'Kategori',
                items: programs
                    .map((program) => program.category)
                    .filter((item): item is string => Boolean(item)),
            },
            {
                label: 'Discovery',
                items: discovery?.popular_keywords ?? [],
            },
        ],
        [discovery?.popular_keywords, programs],
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

    const filtered = useMemo(
        () => sortPrograms(programs, sort),
        [programs, sort],
    );
    const fallbackImage =
        discovery?.featured?.items?.[0]?.image_url ??
        programs.find((item) => item.image_url)?.image_url;
    const discoverySections = discovery?.sections ?? [];

    return (
        <PublicLayout categories={categories} chips={chips}>
            <Head title="Special Program">
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
                            <DiscoveryStoryHero
                                theme={discoveryTheme}
                                editorial={discovery?.editorial}
                                quickCategories={discovery?.quick_categories}
                                totalLabel={
                                    meta?.total
                                        ? `${meta.total} program siap dipertimbangkan`
                                        : 'Discovery program aktif'
                                }
                            />

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

                            <div className="sticky top-20 z-20 rounded-[28px] border border-slate-200 bg-white/95 p-5 shadow-[0_18px_40px_-18px_rgba(15,23,42,0.35)] backdrop-blur">
                                <form
                                    className="grid gap-4 md:grid-cols-[2fr_1fr_auto]"
                                    onSubmit={submitSearch}
                                >
                                    <div className="grid gap-2">
                                        <label className="text-xs font-semibold text-slate-500 uppercase">
                                            Nama program
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
                                            placeholder="Cari nama program"
                                            suggestions={suggestionGroups}
                                            suggestionEndpoint="/api/discovery/special-programs/suggestions"
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <label className="text-xs font-semibold text-slate-500 uppercase">
                                            Kategori
                                        </label>
                                        <div className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm">
                                            <span className="text-slate-400">
                                                🏷️
                                            </span>
                                            <select
                                                value={form.category}
                                                onChange={(event) =>
                                                    setForm((prev) => ({
                                                        ...prev,
                                                        category:
                                                            event.target.value,
                                                    }))
                                                }
                                                className="w-full bg-transparent outline-none"
                                            >
                                                <option value="">
                                                    Semua kategori
                                                </option>
                                                <option value="meeting">
                                                    Meeting
                                                </option>
                                                <option value="wedding">
                                                    Wedding
                                                </option>
                                                <option value="travel">
                                                    Travel
                                                </option>
                                            </select>
                                        </div>
                                    </div>
                                    <button className="h-12 rounded-full bg-sky-600 px-8 text-sm font-semibold text-white shadow-md">
                                        Cari
                                    </button>
                                </form>
                                <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                    <div className="text-sm font-semibold text-sky-700">
                                        Discovery program yang lebih bernilai
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
                                            title: 'Masuk dari value',
                                            body: 'Spotlight dan curated block membantu user menilai benefit sebelum membaca detail panjang.',
                                            icon: (
                                                <Star className="h-5 w-5" />
                                            ),
                                        },
                                        {
                                            title: 'Gunakan kategori sebagai pintu masuk',
                                            body: 'Meeting, wedding, dan travel punya pola eksplorasi berbeda; intent chip membantu membedakannya dari awal.',
                                            icon: (
                                                <BadgePercent className="h-5 w-5" />
                                            ),
                                        },
                                    ]}
                                />
                            </div>
                        </section>

                        <div className="mt-8 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
                            {filtered.map((program) => {
                                const detailSlug =
                                    program.slug ?? program.encrypted_id;
                                return (
                                    <div
                                        key={program.id}
                                        className="group overflow-hidden rounded-xl bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg"
                                    >
                                        <Link
                                            href={`/special-programs/${detailSlug}`}
                                            className="relative block h-28 overflow-hidden"
                                        >
                                            <img
                                                src={
                                                    program.image_url ??
                                                    fallbackImage ??
                                                    '/images/placeholder-card.jpg'
                                                }
                                                alt={program.name}
                                                className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                                            <div className="absolute top-2 left-2 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-slate-700 shadow-sm">
                                                {program.category ??
                                                    'Special Program'}
                                            </div>
                                        </Link>
                                        <div className="p-3">
                                            <div className="flex items-start justify-between gap-4">
                                                <div>
                                                    <h2 className="text-sm font-semibold text-slate-900">
                                                        {program.name}
                                                    </h2>
                                                    <p className="mt-1 text-xs text-slate-500 capitalize">
                                                        {program.category ??
                                                            '-'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="mt-3 flex items-center justify-between">
                                                <div>
                                                    <div className="text-[11px] text-slate-500">
                                                        Mulai
                                                    </div>
                                                    <div className="text-sm font-semibold text-sky-600">
                                                        {program.min_price
                                                            ? `Rp ${program.min_price.toLocaleString('id-ID')}`
                                                            : '-'}
                                                    </div>
                                                </div>
                                                <Link
                                                    href={`/special-programs/${detailSlug}`}
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
                                            'Program belum ditemukan'
                                        }
                                        description={
                                            discovery?.empty_state?.message ??
                                            'Coba ubah kategori program, cari benefit lain, atau reset filter agar hasil lebih luas.'
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
