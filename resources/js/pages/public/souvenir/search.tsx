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
    DiscoveryEmptyState,
    DiscoveryInsightStrip,
    DiscoverySearchField,
    DiscoverySortSelect,
    type DiscoverySuggestionGroup,
} from '@/components/discovery/product-discovery';
import { Skeleton } from '@/components/ui/skeleton';
import PublicLayout from '@/layouts/public-layout';

type Product = {
    id: number;
    encrypted_id?: string;
    slug?: string | null;
    name: string;
    price: number;
    stock: number;
    category?: string | null;
    image_url?: string | null;
};

type Category = {
    id: number;
    name: string;
};

type Filters = {
    q?: string | null;
    category_id?: number | null;
};

const sortOptions = [
    { value: 'recommended', label: 'Rekomendasi' },
    { value: 'price_low', label: 'Harga termurah' },
    { value: 'price_high', label: 'Harga termahal' },
    { value: 'stock_high', label: 'Stok terbanyak' },
    { value: 'title', label: 'Nama A-Z' },
];

const sortProducts = (items: Product[], sort: string) => {
    const results = [...items];
    if (sort === 'price_low') {
        return results.sort(
            (a, b) => Number(a.price ?? 0) - Number(b.price ?? 0),
        );
    }
    if (sort === 'price_high') {
        return results.sort(
            (a, b) => Number(b.price ?? 0) - Number(a.price ?? 0),
        );
    }
    if (sort === 'stock_high') {
        return results.sort(
            (a, b) => Number(b.stock ?? 0) - Number(a.stock ?? 0),
        );
    }
    if (sort === 'title') {
        return results.sort((a, b) => a.name.localeCompare(b.name));
    }
    return results;
};

const discoveryTheme: DiscoveryTheme = {
    badge: 'Pilihan Produk',
    title: 'Temukan produk favorit untuk oleh-oleh dan hadiah',
    description:
        'Jelajahi produk best seller, stok siap kirim, dan kategori yang paling sering dicari.',
    accent: 'bg-sky-600 hover:bg-sky-700',
    gradientClassName:
        'bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.12),_transparent_30%),linear-gradient(135deg,#0B3B8F,#1D73D6,#4CC9F0)]',
    surfaceClassName: 'bg-sky-50 text-sky-700',
    icon: ShoppingBag,
};

export default function SouvenirSearch({
    filters,
    products,
    categories,
    discovery,
}: {
    filters: Filters;
    products: { data: Product[]; links: unknown[] };
    categories: Category[];
    discovery?: DiscoveryExperiencePayload | null;
    meta?: { total?: number; applied_filters?: Record<string, unknown> } | null;
}) {
    const [isReady, setIsReady] = useState(false);
    const [form, setForm] = useState({
        q: filters.q ?? '',
        category_id: filters.category_id ?? '',
    });
    const [sort, setSort] = useState('recommended');

    useEffect(() => {
        const timer = setTimeout(() => setIsReady(true), 350);
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
        router.get('/retail-shop', query, {
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
        if (chip.filters?.category) {
            setForm((prev) => ({
                ...prev,
                category_id: chip.filters?.category ?? '',
            }));
        }
        applyRoute({
            q: chip.query ?? form.q,
            category_id:
                (chip.filters?.category as string | undefined) ??
                String(form.category_id ?? ''),
            sort: nextSort,
            ...((chip.filters ?? {}) as Record<string, string>),
        });
    };

    const applySort = (value: string) => {
        setSort(value);
        applyRoute({ ...form, sort: value });
    };

    const resetDiscovery = () => {
        setForm({ q: '', category_id: '' });
        setSort('recommended');
        applyRoute({});
    };

    const formatIdr = (value: number | string | null | undefined) => {
        const numeric = Number(value);
        if (!Number.isFinite(numeric)) return 'Rp -';
        return `Rp ${numeric.toLocaleString('id-ID')}`;
    };

    const navItems = [
        { label: 'Wisata', icon: MapPinned, href: '/wisata' },
        { label: 'Event', icon: CalendarCheck, href: '/events' },
        {
            label: 'Retail Shop',
            icon: ShoppingBag,
            href: '/retail-shop',
            active: true,
        },
        { label: 'Spesial Program', icon: Star, href: '/special-programs' },
        { label: 'Hotel', icon: Ticket, href: '/stay' },
    ];

    const suggestionGroups = useMemo<DiscoverySuggestionGroup[]>(
        () => [
            {
                label: 'Kategori',
                items: categories.map((category) => category.name),
            },
            {
                label: 'Produk',
                items: products.data
                    .map((product) => product.name)
                    .filter(Boolean),
            },
            {
                label: 'Koleksi',
                items: products.data
                    .map((product) => product.category)
                    .filter((item): item is string => Boolean(item)),
            },
            {
                label: 'Sedang ramai',
                items: discovery?.popular_keywords ?? [],
            },
        ],
        [categories, discovery?.popular_keywords, products.data],
    );

    const filtered = useMemo(
        () => sortProducts(products.data, sort),
        [products.data, sort],
    );
    const discoverySections = discovery?.sections ?? [];

    return (
        <PublicLayout categories={navItems}>
            <Head title="Retail Shop - INDOTIX" />

            <main className="mx-auto w-full max-w-6xl px-4 py-8 md:px-8">
                {!isReady && (
                    <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3">
                        {Array.from({ length: 6 }).map((_, idx) => (
                            <Skeleton
                                key={idx}
                                className="h-64 w-full rounded-2xl"
                            />
                        ))}
                    </div>
                )}

                {isReady && (
                    <>
                        <section className="space-y-6">
                            <section className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-[0_24px_60px_-26px_rgba(15,23,42,0.28)] sm:p-6">
                                    <div className="flex flex-wrap items-center justify-between gap-4">
                                    <div>
                                        <h1 className="text-2xl font-semibold text-slate-900">
                                            Produk pilihan untuk dibawa pulang
                                        </h1>
                                        <p className="mt-2 text-sm text-slate-500">
                                            Temukan oleh-oleh dan hadiah favorit
                                            untuk melengkapi perjalananmu.
                                        </p>
                                    </div>
                                    <form
                                        onSubmit={submitSearch}
                                        className="flex w-full flex-wrap items-center gap-2 lg:w-auto"
                                    >
                                        <DiscoverySearchField
                                            className="min-w-[260px] flex-1"
                                            value={form.q}
                                            onChange={(value) =>
                                                setForm((prev) => ({
                                                    ...prev,
                                                    q: value,
                                                }))
                                            }
                                            onSuggestionSelect={applySuggestion}
                                            placeholder="Cari souvenir"
                                            suggestions={suggestionGroups}
                                            suggestionEndpoint="/api/discovery/souvenirs/suggestions"
                                        />
                                        <select
                                            className="h-12 rounded-xl border border-slate-200 px-3 text-sm"
                                            value={form.category_id}
                                            onChange={(event) =>
                                                setForm((prev) => ({
                                                    ...prev,
                                                    category_id: event.target.value,
                                                }))
                                            }
                                        >
                                            <option value="">Semua kategori</option>
                                            {categories.map((category) => (
                                                <option
                                                    key={category.id}
                                                    value={category.id}
                                                >
                                                    {category.name}
                                                </option>
                                            ))}
                                        </select>
                                        <DiscoverySortSelect
                                            className="min-w-[220px]"
                                            value={sort}
                                            options={sortOptions}
                                            onChange={applySort}
                                        />
                                        <button className="h-12 rounded-xl bg-sky-600 px-4 text-sm font-semibold text-white">
                                            Cari
                                        </button>
                                    </form>
                                </div>
                                <div className="mt-4 space-y-1">
                                    <div className="text-sm font-semibold text-sky-700">
                                        Produk populer yang siap dipilih
                                    </div>
                                    <p className="text-sm text-slate-500">
                                        Cari produk berdasarkan nama, kategori,
                                        atau urutan yang paling sesuai.
                                    </p>
                                </div>
                                <DiscoveryInsightStrip
                                    tips={[
                                        {
                                            title: 'Cek stok produk',
                                            body: 'Lihat produk yang stoknya siap agar kamu bisa belanja lebih cepat.',
                                            icon: (
                                                <ShoppingBag className="h-5 w-5" />
                                            ),
                                        },
                                        {
                                            title: 'Cari oleh kategori',
                                            body: 'Pilih kategori untuk menemukan souvenir yang paling cocok untuk dibawa pulang.',
                                            icon: <Star className="h-5 w-5" />,
                                        },
                                    ]}
                                />
                        </section>

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



                        <section className="mt-6 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3">
                            {filtered.map((product) => {
                                const detailSlug =
                                    product.slug ?? product.encrypted_id ?? '';
                                return (
                                    <Link
                                        key={product.id}
                                        href={
                                            detailSlug
                                                ? `/retail-shop/${detailSlug}`
                                                : '/retail-shop'
                                        }
                                        className="group overflow-hidden rounded-2xl bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                                    >
                                        <div className="h-48 w-full bg-slate-100">
                                            {product.image_url ? (
                                                <img
                                                    src={product.image_url}
                                                    alt={product.name}
                                                    className="h-full w-full object-cover"
                                                />
                                            ) : (
                                                <div className="flex h-full items-center justify-center text-sm text-slate-400">
                                                    Foto belum tersedia
                                                </div>
                                            )}
                                        </div>
                                        <div className="p-4">
                                            <div className="text-xs text-slate-500">
                                                {product.category ??
                                                    'Retail Shop'}
                                            </div>
                                            <h3 className="mt-1 text-base font-semibold text-slate-900">
                                                {product.name}
                                            </h3>
                                            <div className="mt-2 flex items-center justify-between text-sm">
                                                <span className="font-semibold text-sky-600">
                                                    {formatIdr(product.price)}
                                                </span>
                                                <span className="text-xs text-slate-500">
                                                    Stok {product.stock}
                                                </span>
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })}
                            {filtered.length === 0 && (
                                <div className="col-span-full">
                                    <DiscoveryEmptyState
                                        title={
                                            discovery?.empty_state?.title ??
                                            'Produk retail belum ditemukan'
                                        }
                                        description={
                                            discovery?.empty_state?.message ??
                                            'Coba cari nama produk lain, pilih kategori berbeda, atau reset filter.'
                                        }
                                        suggestions={
                                            discovery?.empty_state
                                                ?.recommended_keywords ??
                                            categories.map(
                                                (category) => category.name,
                                            )
                                        }
                                        onSuggestionSelect={applySuggestion}
                                        onReset={resetDiscovery}
                                    />
                                </div>
                            )}
                        </section>
                    </>
                )}
            </main>
        </PublicLayout>
    );
}
