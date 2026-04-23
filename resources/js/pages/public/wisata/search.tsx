import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
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
import {
    Bell,
    CalendarCheck,
    MapPinned,
    MessageCircle,
    ShoppingBag,
    Star,
    Ticket,
    UserCircle,
    History,
    ShoppingCart,
    BadgePercent,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import PublicLayout from '@/layouts/public-layout';

type Destination = {
    id: number;
    encrypted_id: string;
    slug?: string | null;
    destination_name: string;
    destination_type?: string | null;
    city_name?: string | null;
    photo_url?: string | null;
    tickets: { id: number; name: string; price: number; available: number }[];
};

type Filters = {
    q?: string | null;
    visit_date?: string | null;
    quantity?: number;
    sort?: string | null;
};

const sortOptions = [
    { value: 'recommended', label: 'Rekomendasi' },
    { value: 'price_low', label: 'Harga termurah' },
    { value: 'price_high', label: 'Harga termahal' },
    { value: 'title', label: 'Nama A-Z' },
];

const minTicketPrice = (destination: Destination) => {
    const prices = destination.tickets
        .map((ticket) => Number(ticket.price ?? 0))
        .filter((price) => price > 0);
    return prices.length > 0 ? Math.min(...prices) : 0;
};

const sortDestinations = (items: Destination[], sort: string) => {
    const results = [...items];
    if (sort === 'price_low') {
        return results.sort((a, b) => minTicketPrice(a) - minTicketPrice(b));
    }
    if (sort === 'price_high') {
        return results.sort((a, b) => minTicketPrice(b) - minTicketPrice(a));
    }
    if (sort === 'title') {
        return results.sort((a, b) =>
            a.destination_name.localeCompare(b.destination_name),
        );
    }
    return results;
};

const navItems = [
    { label: 'Wisata', icon: MapPinned, href: '/wisata', active: true },
    { label: 'Event', icon: CalendarCheck, href: '/events' },
    { label: 'Retail Shop', icon: ShoppingBag, href: '/retail-shop' },
    { label: 'Spesial Program', icon: Star, href: '/special-programs' },
    { label: 'Hotel', icon: Ticket, href: '/stay' },
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

const discoveryTheme: DiscoveryTheme = {
    badge: 'Wisata Discovery',
    title: 'Temukan destinasi dari tema perjalanan, bukan hanya nama tempat',
    description:
        'Discovery wisata diarahkan lewat inspirasi keluarga, alam, adventure, dan tiket yang ringan untuk dicoba terlebih dulu.',
    accent: 'bg-emerald-600 hover:bg-emerald-700',
    gradientClassName:
        'bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.12),_transparent_30%),linear-gradient(135deg,#166534,#0f766e,#14b8a6)]',
    surfaceClassName: 'bg-emerald-50 text-emerald-700',
    icon: MapPinned,
};

export default function WisataSearch({
    filters,
    destinations,
    discovery,
    meta,
}: {
    filters: Filters;
    destinations: Destination[];
    discovery?: DiscoveryExperiencePayload | null;
    meta?: { total?: number; applied_filters?: Record<string, unknown> } | null;
}) {
    const {
        auth,
        unread_notifications,
        souvenir_cart_count,
        affiliate_menu,
        affiliate_referral,
    } = usePage().props as {
        auth?: { user?: { role?: string } };
        unread_notifications?: number;
        souvenir_cart_count?: number;
        affiliate_menu?: boolean;
        affiliate_referral?: {
            code: string;
            destination_name?: string | null;
        } | null;
    };
    const [isReady, setIsReady] = useState(false);
    const [form, setForm] = useState({
        q: filters.q ?? '',
        visit_date: filters.visit_date ?? new Date().toISOString().slice(0, 10),
        quantity: filters.quantity ?? 1,
    });
    const [sort, setSort] = useState(filters.sort ?? 'recommended');
    const affiliateForm = useForm({ code: '' });

    useEffect(() => {
        const timer = setTimeout(() => setIsReady(true), 400);
        return () => clearTimeout(timer);
    }, []);

    const applyRoute = (
        params: Record<string, string | number | null | undefined>,
    ) => {
        const query = Object.fromEntries(
            Object.entries(params).filter(
                ([, value]) =>
                    value !== null && value !== undefined && value !== '',
            ),
        );
        router.get('/wisata', query, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const submitSearch = (event: React.FormEvent) => {
        event.preventDefault();
        applyRoute({ ...form, sort });
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
        applyRoute({
            q: chip.query ?? form.q,
            visit_date: form.visit_date,
            quantity: form.quantity,
            sort: nextSort,
            ...((chip.filters ?? {}) as Record<string, string>),
        });
    };

    const applySort = (value: string) => {
        setSort(value);
        applyRoute({ ...form, sort: value });
    };

    const resetDiscovery = () => {
        const next = {
            q: '',
            visit_date: new Date().toISOString().slice(0, 10),
            quantity: 1,
        };
        setForm(next);
        setSort('recommended');
        applyRoute(next);
    };

    const suggestionGroups = useMemo<DiscoverySuggestionGroup[]>(
        () => [
            { label: 'Kategori populer', items: chips },
            {
                label: 'Destinasi',
                items: destinations
                    .map((item) => item.destination_name)
                    .filter(Boolean),
            },
            {
                label: 'Lokasi & tipe',
                items: destinations
                    .flatMap((item) => [item.city_name, item.destination_type])
                    .filter((item): item is string => Boolean(item)),
            },
            {
                label: 'Discovery',
                items: discovery?.popular_keywords ?? [],
            },
        ],
        [destinations, discovery?.popular_keywords],
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
        () => sortDestinations(destinations, sort),
        [destinations, sort],
    );
    const fallbackImage = destinations.find(
        (item) => item.photo_url,
    )?.photo_url;
    const discoverySections = discovery?.sections ?? [];

    return (
        <PublicLayout categories={navItems} chips={chips}>
            <Head title="Wisata - INDOTIX" />

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
                            <DiscoveryStoryHero
                                theme={discoveryTheme}
                                editorial={discovery?.editorial}
                                quickCategories={discovery?.quick_categories}
                                totalLabel={
                                    meta?.total
                                        ? `${meta.total} destinasi siap dieksplor`
                                        : 'Discovery wisata aktif'
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
                        </section>

                        <section className="mb-6 rounded-2xl border border-slate-200 bg-white px-6 py-4 shadow-sm">
                            {affiliate_referral ? (
                                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                    <div>
                                        <p className="text-sm font-semibold text-slate-900">
                                            Kamu datang dari rekomendasi partner
                                            kami{' '}
                                            {affiliate_referral.destination_name
                                                ? `untuk ${affiliate_referral.destination_name}`
                                                : ''}
                                            .
                                        </p>
                                        <p className="mt-1 text-xs text-slate-500">
                                            Kode afiliasi aktif:{' '}
                                            {affiliate_referral.code}
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            router.post(
                                                '/affiliate/referral/clear',
                                                {},
                                                { preserveScroll: true },
                                            )
                                        }
                                        className="h-10 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                                    >
                                        Hapus kode
                                    </button>
                                </div>
                            ) : (
                                <form
                                    onSubmit={(event) => {
                                        event.preventDefault();
                                        affiliateForm.post(
                                            '/affiliate/referral/apply',
                                            { preserveScroll: true },
                                        );
                                    }}
                                    className="flex flex-col gap-3 md:flex-row md:items-end"
                                >
                                    <div className="flex-1 space-y-2">
                                        <label className="text-sm font-semibold text-slate-700">
                                            Punya kode afiliasi?
                                        </label>
                                        <input
                                            value={affiliateForm.data.code}
                                            onChange={(event) =>
                                                affiliateForm.setData(
                                                    'code',
                                                    event.target.value,
                                                )
                                            }
                                            className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm focus:border-sky-400 focus:outline-none"
                                            placeholder="Masukkan kode afiliasi"
                                        />
                                        {affiliateForm.errors.code && (
                                            <p className="text-xs text-rose-500">
                                                {affiliateForm.errors.code}
                                            </p>
                                        )}
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={affiliateForm.processing}
                                        className="h-11 rounded-xl bg-sky-600 px-5 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-60"
                                    >
                                        Terapkan
                                    </button>
                                </form>
                            )}
                        </section>

                        <section className="mb-6">
                            <div className="relative overflow-hidden rounded-[28px] shadow-lg">
                                <img
                                    src={
                                        fallbackImage ??
                                        '/images/placeholder-card.jpg'
                                    }
                                    alt="Wisata"
                                    className="h-44 w-full object-cover sm:h-56 md:h-72"
                                />
                                <div className="pointer-events-none absolute inset-0 rounded-[28px] bg-gradient-to-r from-black/60 via-black/45 to-transparent" />
                                <div className="absolute top-1/2 right-4 left-4 -translate-y-1/2 text-center text-white sm:right-8 sm:left-8">
                                    <h1 className="text-lg font-semibold sm:text-xl md:text-3xl">
                                        Mau ke mana dulu? Pesan tiket wisata
                                        favoritmu di INDOTIX
                                    </h1>
                                    <p className="mt-2 text-xs text-white/85 sm:text-sm">
                                        Pilih destinasi, tentukan tanggal, lalu
                                        nikmati liburan tanpa ribet.
                                    </p>
                                </div>
                            </div>

                            <div className="-mt-14 px-4 sm:-mt-20 sm:px-6 md:-mt-24">
                                <div className="relative z-20 rounded-[24px] bg-white p-5 shadow-[0_18px_40px_-18px_rgba(15,23,42,0.35)]">
                                    <form
                                        className="grid gap-4 md:grid-cols-[2fr_1.5fr_1fr_auto]"
                                        onSubmit={submitSearch}
                                    >
                                        <div className="grid gap-2">
                                            <label className="text-xs font-semibold text-slate-500 uppercase">
                                                Kota atau destinasi wisata
                                            </label>
                                            <DiscoverySearchField
                                                value={form.q}
                                                onChange={(value) =>
                                                    setForm((prev) => ({
                                                        ...prev,
                                                        q: value,
                                                    }))
                                                }
                                                onSuggestionSelect={
                                                    applySuggestion
                                                }
                                                placeholder="Cari kota atau nama destinasi"
                                                suggestions={suggestionGroups}
                                                suggestionEndpoint="/api/discovery/wisata/suggestions"
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <label className="text-xs font-semibold text-slate-500 uppercase">
                                                Tanggal kunjungan
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
                                                                event.target
                                                                    .value,
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
                                                                event.target
                                                                    .value,
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
                                            Destinasi rekomendasi untukmu
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
                                                title: 'Kuota sesuai tanggal',
                                                body: 'Hasil wisata mengikuti tanggal kunjungan dan jumlah tiket yang dipilih.',
                                                icon: (
                                                    <Ticket className="h-5 w-5" />
                                                ),
                                            },
                                            {
                                                title: 'Eksplor berdasarkan tipe',
                                                body: 'Gunakan kategori seperti alam, budaya, edukasi, atau keluarga.',
                                                icon: (
                                                    <MapPinned className="h-5 w-5" />
                                                ),
                                            },
                                        ]}
                                    />
                                </div>
                            </div>
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
                                            href={`/wisata/${detailSlug}`}
                                            className="relative block h-28 overflow-hidden"
                                        >
                                            <img
                                                src={
                                                    item.photo_url ??
                                                    fallbackImage ??
                                                    '/images/placeholder-card.jpg'
                                                }
                                                alt={item.destination_name}
                                                className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                                            <div className="absolute top-2 left-2 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-slate-700 shadow-sm">
                                                {item.destination_type ??
                                                    'Wisata'}
                                            </div>
                                        </Link>
                                        <div className="p-3">
                                            <div className="flex items-start justify-between gap-4">
                                                <div>
                                                    <h2 className="text-sm font-semibold text-slate-900">
                                                        {item.destination_name}
                                                    </h2>
                                                    <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                                                        <MapPinned className="h-3 w-3 text-sky-500" />
                                                        {item.city_name ??
                                                            'Indonesia'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="mt-3 flex items-center justify-between">
                                                <div>
                                                    <div className="text-[11px] text-slate-500">
                                                        Mulai
                                                    </div>
                                                    <div className="text-sm font-semibold text-sky-600">
                                                        {item.tickets[0]?.price
                                                            ? `Rp ${item.tickets[0].price.toLocaleString('id-ID')}`
                                                            : '-'}
                                                    </div>
                                                </div>
                                                <Link
                                                    href={`/wisata/${detailSlug}`}
                                                    className="rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-sky-700"
                                                >
                                                    Lihat Detail
                                                </Link>
                                            </div>
                                            <div className="mt-3 flex flex-col gap-2">
                                                {item.tickets
                                                    .slice(0, 2)
                                                    .map((ticket) => (
                                                        <div
                                                            key={ticket.id}
                                                            className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-xs"
                                                        >
                                                            <span className="text-slate-600">
                                                                {ticket.name}
                                                            </span>
                                                            <span className="font-semibold text-sky-600">
                                                                Rp{' '}
                                                                {ticket.price.toLocaleString(
                                                                    'id-ID',
                                                                )}
                                                            </span>
                                                        </div>
                                                    ))}
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
                                            'Destinasi belum ditemukan'
                                        }
                                        description={
                                            discovery?.empty_state?.message ??
                                            'Coba tanggal lain, jumlah tiket lebih kecil, atau keyword destinasi yang lebih umum.'
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
            </div>
        </PublicLayout>
    );
}
