import { Link, router } from '@inertiajs/react';
import {
    ImageOff,
    MapPin,
    MapPinned,
    RotateCcw,
    Search,
    SlidersHorizontal,
    Ticket,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { PublicSeo } from '@/components/public-seo';
import {
    PublicFooter,
    PublicTrustSection,
    type PublicContact,
    type PublicTrustContent,
} from '@/components/public-page-sections';
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

const navItems = [
    { label: 'Wisata', icon: MapPinned, href: '/wisata', active: true },
];

const mobileProductRailClass =
    'flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 scroll-smooth [scrollbar-width:none] lg:block lg:space-y-6 lg:overflow-visible lg:pb-0 [&::-webkit-scrollbar]:hidden';
const mobileProductRailItemClass =
    'w-[72vw] min-w-[16rem] max-w-[20rem] shrink-0 snap-start lg:w-auto lg:min-w-0 lg:max-w-none';

const minTicketPrice = (destination: Destination) => {
    const prices = destination.tickets
        .map((ticket) => Number(ticket.price ?? 0))
        .filter((price) => price > 0);
    return prices.length > 0 ? Math.min(...prices) : 0;
};

const maxTicketPrice = (destinations: Destination[]) => {
    const prices = destinations
        .flatMap((destination) =>
            destination.tickets.map((ticket) => Number(ticket.price ?? 0)),
        )
        .filter((price) => price > 0);
    return prices.length > 0 ? Math.max(...prices) : 0;
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

export default function WisataSearch({
    filters,
    destinations,
    homeContent,
    contact,
}: {
    filters: Filters;
    destinations: Destination[];
    discovery?: unknown;
    meta?: { total?: number; applied_filters?: Record<string, unknown> } | null;
    homeContent?: PublicTrustContent | null;
    contact?: PublicContact | null;
}) {
    const [isReady, setIsReady] = useState(false);
    const [form, setForm] = useState({
        q: filters.q ?? '',
        visit_date: filters.visit_date ?? new Date().toISOString().slice(0, 10),
        quantity: filters.quantity ?? 1,
    });
    const [sort, setSort] = useState(filters.sort ?? 'recommended');
    const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
    const [selectedCities, setSelectedCities] = useState<string[]>([]);
    const highestPrice = maxTicketPrice(destinations);
    const [maxPrice, setMaxPrice] = useState(highestPrice);

    useEffect(() => {
        const timer = setTimeout(() => setIsReady(true), 260);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        setMaxPrice(highestPrice);
    }, [highestPrice]);

    const fallbackImage = destinations.find(
        (item) => item.photo_url,
    )?.photo_url;

    const types = useMemo(
        () =>
            Array.from(
                new Set(
                    destinations
                        .map((item) => item.destination_type)
                        .filter((item): item is string => Boolean(item)),
                ),
            ),
        [destinations],
    );

    const cities = useMemo(
        () =>
            Array.from(
                new Set(
                    destinations
                        .map((item) => item.city_name)
                        .filter((item): item is string => Boolean(item)),
                ),
            ),
        [destinations],
    );

    const filtered = useMemo(() => {
        const query = form.q.trim().toLowerCase();
        const locallyFiltered = destinations.filter((item) => {
            const price = minTicketPrice(item);
            const matchesQuery =
                !query ||
                item.destination_name.toLowerCase().includes(query) ||
                item.city_name?.toLowerCase().includes(query) ||
                item.destination_type?.toLowerCase().includes(query);
            const matchesType =
                selectedTypes.length === 0 ||
                (item.destination_type
                    ? selectedTypes.includes(item.destination_type)
                    : false);
            const matchesCity =
                selectedCities.length === 0 ||
                (item.city_name
                    ? selectedCities.includes(item.city_name)
                    : false);
            const matchesPrice = maxPrice <= 0 || price <= maxPrice;

            return matchesQuery && matchesType && matchesCity && matchesPrice;
        });

        return sortDestinations(locallyFiltered, sort);
    }, [destinations, form.q, maxPrice, selectedCities, selectedTypes, sort]);

    const submitSearch = (event: React.FormEvent) => {
        event.preventDefault();
        router.get(
            '/wisata',
            {
                q: form.q || undefined,
                visit_date: form.visit_date,
                quantity: form.quantity,
                sort,
            },
            { preserveScroll: true, preserveState: true },
        );
    };

    const resetFilters = () => {
        const next = {
            q: '',
            visit_date: new Date().toISOString().slice(0, 10),
            quantity: 1,
        };
        setForm(next);
        setSort('recommended');
        setSelectedTypes([]);
        setSelectedCities([]);
        setMaxPrice(highestPrice);
        router.get('/wisata', next, { preserveScroll: true });
    };

    const toggleValue = (
        value: string,
        setter: React.Dispatch<React.SetStateAction<string[]>>,
    ) => {
        setter((prev) =>
            prev.includes(value)
                ? prev.filter((item) => item !== value)
                : [...prev, value],
        );
    };

    return (
        <PublicLayout
            categories={navItems}
            chips={chips}
            showCategories={false}
            showChips={false}
        >
            <PublicSeo
                title="Tiket Wisata di Indotix"
                description="Cari dan pesan tiket wisata pilihan dengan tanggal kunjungan, kuota tersedia, harga, dan destinasi populer di Indotix."
                canonicalPath="/wisata"
                image={fallbackImage}
                structuredData={{
                    '@context': 'https://schema.org',
                    '@type': 'ItemList',
                    name: 'Daftar tiket wisata Indotix',
                    itemListElement: filtered
                        .slice(0, 12)
                        .map((item, index) => ({
                            '@type': 'ListItem',
                            position: index + 1,
                            name: item.destination_name,
                            url: `/wisata/${item.slug ?? item.encrypted_id}`,
                        })),
                }}
            />
            <div
                className="mx-auto max-w-7xl px-4 py-8 font-sans text-slate-800 sm:px-6 lg:px-8"
                id="listing-view"
            >
                {!isReady ? (
                    <section className="space-y-8">
                        <Skeleton className="h-16 w-full rounded-2xl" />
                        <div className="grid gap-8 lg:grid-cols-12">
                            <Skeleton className="h-[28rem] rounded-3xl lg:col-span-4" />
                            <div className="space-y-6 lg:col-span-8">
                                <Skeleton className="h-48 rounded-3xl" />
                                <Skeleton className="h-48 rounded-3xl" />
                                <Skeleton className="h-48 rounded-3xl" />
                            </div>
                        </div>
                    </section>
                ) : (
                    <>
                        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                            <div>
                                <h1 className="font-['Space_Grotesk'] text-xl font-black tracking-tight text-slate-900 sm:text-2xl">
                                    Pencarian Destinasi
                                </h1>
                                <p className="mt-1 text-xs font-medium text-slate-500">
                                    Menampilkan {filtered.length} destinasi
                                    sesuai filter yang dipilih.
                                </p>
                            </div>

                            <form
                                onSubmit={submitSearch}
                                className="relative flex w-full items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-slate-800 shadow-xs focus-within:ring-2 focus-within:ring-sky-500/50 sm:w-80"
                            >
                                <Search className="mr-2 h-4 w-4 text-slate-400" />
                                <input
                                    type="search"
                                    placeholder="Cari kota, destinasi..."
                                    className="w-full border-none bg-transparent text-xs font-medium focus:outline-none"
                                    value={form.q}
                                    onChange={(event) =>
                                        setForm((prev) => ({
                                            ...prev,
                                            q: event.target.value,
                                        }))
                                    }
                                />
                            </form>
                        </div>

                        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
                            <aside
                                className="space-y-6 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm lg:col-span-4"
                                id="filters-sidebar"
                            >
                                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                                    <span className="flex items-center gap-2 text-base font-bold text-slate-900">
                                        <SlidersHorizontal className="h-4 w-4 text-sky-600" />
                                        Filter
                                    </span>
                                    <button
                                        type="button"
                                        onClick={resetFilters}
                                        className="inline-flex items-center gap-1 text-[10px] font-bold tracking-wider text-sky-600 uppercase hover:text-sky-700"
                                    >
                                        <RotateCcw className="h-3 w-3" />
                                        Reset
                                    </button>
                                </div>

                                <form
                                    onSubmit={submitSearch}
                                    className="space-y-6"
                                >
                                    <div className="space-y-3">
                                        <label className="block text-xs font-bold text-slate-800 sm:text-sm">
                                            Tanggal Kunjungan
                                        </label>
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
                                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-sky-500/50 focus:outline-none sm:text-sm"
                                        />
                                    </div>

                                    <div className="space-y-3">
                                        <label className="block text-xs font-bold text-slate-800 sm:text-sm">
                                            Jumlah Tiket
                                        </label>
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
                                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-sky-500/50 focus:outline-none sm:text-sm"
                                        />
                                    </div>

                                    <div className="space-y-3">
                                        <label className="block text-xs font-bold text-slate-800 sm:text-sm">
                                            Urutkan
                                        </label>
                                        <select
                                            value={sort}
                                            onChange={(event) =>
                                                setSort(event.target.value)
                                            }
                                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-sky-500/50 focus:outline-none sm:text-sm"
                                        >
                                            {sortOptions.map((option) => (
                                                <option
                                                    key={option.value}
                                                    value={option.value}
                                                >
                                                    {option.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {highestPrice > 0 && (
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <label className="text-xs font-bold text-slate-800 sm:text-sm">
                                                    Rentang Harga
                                                </label>
                                                <span className="text-[10px] font-bold text-slate-400">
                                                    Maksimal
                                                </span>
                                            </div>
                                            <input
                                                type="range"
                                                min={0}
                                                max={highestPrice}
                                                step={1000}
                                                value={maxPrice}
                                                onChange={(event) =>
                                                    setMaxPrice(
                                                        Number(
                                                            event.target.value,
                                                        ),
                                                    )
                                                }
                                                className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-slate-100 accent-sky-600"
                                            />
                                            <div className="flex justify-between text-xs font-bold text-slate-500">
                                                <span>Rp 0</span>
                                                <span className="rounded-md border border-sky-100 bg-sky-50 px-2 py-0.5 font-extrabold text-sky-600">
                                                    Rp{' '}
                                                    {maxPrice.toLocaleString(
                                                        'id-ID',
                                                    )}
                                                </span>
                                            </div>
                                        </div>
                                    )}

                                    {types.length > 0 && (
                                        <>
                                            <hr className="border-slate-100" />
                                            <div className="space-y-3">
                                                <label className="block text-xs font-bold text-slate-800 sm:text-sm">
                                                    Tipe Wisata
                                                </label>
                                                <div className="grid grid-cols-2 gap-2">
                                                    {types.map((type) => (
                                                        <label
                                                            key={type}
                                                            className="group flex cursor-pointer items-center gap-2 text-xs font-medium text-slate-600 sm:text-sm"
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedTypes.includes(
                                                                    type,
                                                                )}
                                                                onChange={() =>
                                                                    toggleValue(
                                                                        type,
                                                                        setSelectedTypes,
                                                                    )
                                                                }
                                                                className="h-4 w-4 cursor-pointer rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                                                            />
                                                            <span className="group-hover:text-slate-900">
                                                                {type}
                                                            </span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                        </>
                                    )}

                                    {cities.length > 0 && (
                                        <>
                                            <hr className="border-slate-100" />
                                            <div className="space-y-3">
                                                <label className="block text-xs font-bold text-slate-800 sm:text-sm">
                                                    Kota
                                                </label>
                                                <div className="grid grid-cols-2 gap-2">
                                                    {cities.map((city) => (
                                                        <label
                                                            key={city}
                                                            className="group flex cursor-pointer items-center gap-2 text-xs font-medium text-slate-600 sm:text-sm"
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedCities.includes(
                                                                    city,
                                                                )}
                                                                onChange={() =>
                                                                    toggleValue(
                                                                        city,
                                                                        setSelectedCities,
                                                                    )
                                                                }
                                                                className="h-4 w-4 cursor-pointer rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                                                            />
                                                            <span className="group-hover:text-slate-900">
                                                                {city}
                                                            </span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                        </>
                                    )}

                                    <button
                                        type="submit"
                                        className="w-full rounded-2xl bg-sky-600 py-3.5 text-xs font-extrabold tracking-wider text-white uppercase shadow-md transition hover:bg-sky-700"
                                    >
                                        Terapkan Filter
                                    </button>
                                </form>
                            </aside>

                            <section
                                className="lg:col-span-8"
                                id="listings-container"
                            >
                                {filtered.length === 0 ? (
                                    <div className="rounded-3xl border border-slate-100 bg-white p-12 text-center text-slate-500">
                                        <p className="text-lg font-semibold text-slate-900">
                                            Destinasi belum ditemukan
                                        </p>
                                        <p className="mt-2 text-xs">
                                            Coba ubah kata kunci, tanggal,
                                            jumlah tiket, atau filter lainnya.
                                        </p>
                                    </div>
                                ) : (
                                    <div className={mobileProductRailClass}>
                                        {filtered.map((item) => {
                                            const detailSlug =
                                                item.slug ?? item.encrypted_id;
                                            const price = minTicketPrice(item);
                                            return (
                                                <article
                                                    key={item.id}
                                                    className={`border-slate-150/80 flex flex-col gap-5 overflow-hidden rounded-3xl border bg-white p-4 shadow-xs transition-all duration-300 hover:shadow-md sm:flex-row sm:p-5 ${mobileProductRailItemClass}`}
                                                >
                                                    <Link
                                                        href={`/wisata/${detailSlug}`}
                                                        className="relative h-40 w-full shrink-0 overflow-hidden rounded-2xl bg-slate-100 sm:w-56"
                                                    >
                                                        {item.photo_url ? (
                                                            <img
                                                                src={
                                                                    item.photo_url
                                                                }
                                                                alt={
                                                                    item.destination_name
                                                                }
                                                                loading="lazy"
                                                                decoding="async"
                                                                className="h-full w-full object-cover"
                                                            />
                                                        ) : (
                                                            <div className="flex h-full w-full items-center justify-center text-slate-400">
                                                                <ImageOff className="h-8 w-8" />
                                                            </div>
                                                        )}
                                                        <div className="absolute top-3 left-3 flex items-center gap-1 rounded-full bg-black/45 px-2 py-0.5 text-[9px] font-bold text-white backdrop-blur-xs">
                                                            <MapPin className="h-3 w-3 text-sky-400" />
                                                            <span>
                                                                {item.city_name ??
                                                                    'Indonesia'}
                                                            </span>
                                                        </div>
                                                    </Link>

                                                    <div className="flex flex-1 flex-col justify-between">
                                                        <div>
                                                            <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400">
                                                                <Ticket className="h-3.5 w-3.5 text-sky-600" />
                                                                {
                                                                    item.tickets
                                                                        .length
                                                                }{' '}
                                                                pilihan tiket
                                                            </div>
                                                            <h2 className="mt-1.5 line-clamp-2 text-lg font-bold tracking-tight text-slate-900">
                                                                {
                                                                    item.destination_name
                                                                }
                                                            </h2>
                                                            <p className="mt-2 line-clamp-2 text-xs leading-relaxed font-normal text-slate-500">
                                                                {[
                                                                    item.destination_type,
                                                                    item.city_name,
                                                                ]
                                                                    .filter(
                                                                        Boolean,
                                                                    )
                                                                    .join(
                                                                        ' · ',
                                                                    ) ||
                                                                    'Destinasi wisata'}
                                                            </p>
                                                        </div>

                                                        <div className="mt-4 flex items-center justify-between border-t border-dashed border-slate-100 pt-4">
                                                            <div>
                                                                <span className="text-base font-black tracking-tight text-sky-600">
                                                                    {price > 0
                                                                        ? `Rp ${price.toLocaleString('id-ID')}`
                                                                        : 'Harga tersedia'}
                                                                    <span className="text-[10px] font-normal text-slate-400">
                                                                        {' '}
                                                                        / orang
                                                                    </span>
                                                                </span>
                                                            </div>

                                                            <Link
                                                                href={`/wisata/${detailSlug}`}
                                                                className="rounded-full bg-sky-600 px-5 py-2.5 text-xs font-bold text-white uppercase shadow-sm transition-all hover:bg-sky-700 hover:shadow-md"
                                                            >
                                                                Lihat Detail
                                                            </Link>
                                                        </div>
                                                    </div>
                                                </article>
                                            );
                                        })}
                                    </div>
                                )}
                            </section>
                        </div>
                    </>
                )}
            </div>
            <PublicTrustSection homeContent={homeContent} contact={contact} />
            <PublicFooter contact={contact} />
        </PublicLayout>
    );
}
