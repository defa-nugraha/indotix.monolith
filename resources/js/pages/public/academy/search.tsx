import { Head, Link, router, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import {
    ActiveFilterChips,
    DiscoveryEmptyState,
    DiscoveryInsightStrip,
    DiscoverySearchField,
    DiscoverySortSelect,
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

export default function AcademySearch({
    classes = [],
    filters,
}: {
    classes: AcademyCard[];
    filters: { q?: string | null };
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
    const [sort, setSort] = useState('recommended');

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

    const submitSearch = (event: React.FormEvent) => {
        event.preventDefault();
        router.get(
            '/academy',
            { q: form.q },
            { preserveState: true, preserveScroll: true },
        );
    };

    const applySuggestion = (value: string) => {
        setForm((prev) => ({ ...prev, q: value }));
        router.get(
            '/academy',
            { q: value },
            { preserveState: true, preserveScroll: true },
        );
    };

    const resetDiscovery = () => {
        setForm((prev) => ({ ...prev, q: '' }));
        setSort('recommended');
        router.get(
            '/academy',
            {},
            { preserveState: true, preserveScroll: true },
        );
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
        ],
        [classes],
    );

    const activeFilters = useMemo(
        () => [
            ...(form.q.trim() ? [`Pencarian: ${form.q.trim()}`] : []),
            ...(sort !== 'recommended'
                ? [
                      sortOptions.find((item) => item.value === sort)?.label ??
                          'Urutan aktif',
                  ]
                : []),
        ],
        [form.q, sort],
    );

    const filtered = useMemo(() => sortClasses(classes, sort), [classes, sort]);
    const fallbackImage = classes.find((item) => item.image_url)?.image_url;

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
                        <section className="mb-6">
                            <div className="relative overflow-hidden rounded-[28px] shadow-lg">
                                <img
                                    src={
                                        fallbackImage ??
                                        '/images/placeholder-card.jpg'
                                    }
                                    alt="Academy"
                                    className="h-44 w-full object-cover sm:h-56 md:h-72"
                                />
                                <div className="pointer-events-none absolute inset-0 rounded-[28px] bg-gradient-to-r from-black/60 via-black/45 to-transparent" />
                                <div className="absolute top-1/2 right-4 left-4 -translate-y-1/2 text-center text-white sm:right-8 sm:left-8">
                                    <h1 className="text-lg font-semibold sm:text-xl md:text-3xl">
                                        Upgrade skill bareng Eljohn Academy di
                                        INDOTIX
                                    </h1>
                                    <p className="mt-2 text-xs text-white/85 sm:text-sm">
                                        Pilih kelas favorit, amankan seat, dan
                                        belajar langsung dari mentor terbaik.
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
                                                onSuggestionSelect={
                                                    applySuggestion
                                                }
                                                placeholder="Cari kelas academy"
                                                suggestions={suggestionGroups}
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
                                            Kelas rekomendasi untukmu
                                        </div>
                                        <DiscoverySortSelect
                                            className="md:w-64"
                                            value={sort}
                                            options={sortOptions}
                                            onChange={setSort}
                                        />
                                    </div>
                                    <ActiveFilterChips
                                        filters={activeFilters}
                                        onReset={resetDiscovery}
                                    />
                                    <DiscoveryInsightStrip
                                        tips={[
                                            {
                                                title: 'Pilih berdasarkan jadwal',
                                                body: 'Urutkan kelas yang akan segera dimulai agar mudah menentukan waktu belajar.',
                                                icon: (
                                                    <CalendarCheck className="h-5 w-5" />
                                                ),
                                            },
                                            {
                                                title: 'Gunakan kategori skill',
                                                body: 'Cari topik seperti marketing, leadership, hospitality, atau digital.',
                                                icon: (
                                                    <BookOpen className="h-5 w-5" />
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
                                        title="Kelas belum ditemukan"
                                        description="Coba cari kategori skill lain, gunakan kata kunci yang lebih umum, atau reset filter."
                                        suggestions={chips}
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
