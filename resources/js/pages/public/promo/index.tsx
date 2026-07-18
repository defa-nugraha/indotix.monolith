import { Link } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import {
    BadgePercent,
    CalendarDays,
    Check,
    ChevronRight,
    Copy,
    Gift,
    Search,
    ShieldCheck,
    TicketPercent,
} from 'lucide-react';
import { PublicSeo } from '@/components/public-seo';
import {
    PublicFooter,
    PublicPartnerSection,
    PublicTrustSection,
    type PublicContact,
    type PublicPartner,
    type PublicTrustContent,
} from '@/components/public-page-sections';
import PublicLayout from '@/layouts/public-layout';

type Voucher = {
    id: number;
    code: string;
    discount_type: 'percentage' | 'fixed';
    discount_value: number;
    min_transaction?: number | null;
    quota_total?: number;
    quota_used?: number;
    max_per_user_per_day?: number;
    starts_at?: string | null;
    ends_at?: string | null;
};

type PromoItem = {
    id: number;
    title?: string | null;
    slug?: string | null;
    category?: string | null;
    category_label?: string | null;
    excerpt?: string | null;
    image_url: string;
    link_url?: string | null;
    sort_order?: number;
    starts_at?: string | null;
    ends_at?: string | null;
};

type PromoTab = 'all' | 'voucher' | 'banner';

const tabs: { value: PromoTab; label: string }[] = [
    { value: 'all', label: 'Semua Promo' },
    { value: 'voucher', label: 'Voucher' },
    { value: 'banner', label: 'Promo Pilihan' },
];

const mobileVoucherRailClass =
    'flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 scroll-smooth [scrollbar-width:none] lg:grid lg:snap-none lg:grid-cols-3 lg:overflow-visible lg:pb-0 [&::-webkit-scrollbar]:hidden';
const mobileVoucherRailItemClass =
    'w-[78vw] min-w-[17.5rem] max-w-[22rem] shrink-0 snap-start lg:w-auto lg:min-w-0 lg:max-w-none';
const mobilePromoRailClass =
    'flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 scroll-smooth [scrollbar-width:none] md:grid md:snap-none md:grid-cols-3 md:gap-5 md:overflow-visible md:pb-0 [&::-webkit-scrollbar]:hidden';
const mobilePromoRailItemClass =
    'w-[72vw] min-w-[16rem] max-w-[20rem] shrink-0 snap-start md:w-auto md:min-w-0 md:max-w-none';

const formatRupiah = (value?: number | null) => {
    const amount = Number(value ?? 0);
    if (!Number.isFinite(amount) || amount <= 0) {
        return null;
    }

    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(amount);
};

const formatDate = (value?: string | null) => {
    if (!value) {
        return null;
    }

    return new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    }).format(new Date(value));
};

const voucherDiscount = (voucher: Voucher) => {
    if (voucher.discount_type === 'percentage') {
        return `${voucher.discount_value}%`;
    }

    return formatRupiah(voucher.discount_value) ?? 'Promo';
};

const voucherRequirement = (voucher: Voucher) => {
    const minimum = Number(voucher.min_transaction ?? 0);

    return minimum > 0
        ? `Min. transaksi ${formatRupiah(minimum)}`
        : 'Tanpa minimum transaksi';
};

const voucherPeriod = (voucher: Voucher) => {
    const start = formatDate(voucher.starts_at);
    const end = formatDate(voucher.ends_at);

    if (start && end) {
        return `${start} - ${end}`;
    }

    if (end) {
        return `Berlaku sampai ${end}`;
    }

    return 'Berlaku selama promo aktif';
};

const remainingQuota = (voucher: Voucher) => {
    const total = Number(voucher.quota_total ?? 0);
    if (total <= 0) {
        return null;
    }

    return Math.max(0, total - Number(voucher.quota_used ?? 0));
};

export default function PromoIndex({
    vouchers,
    promoItems,
    categoryOptions = {},
    homeContent,
    contact,
    partners = [],
}: {
    vouchers: Voucher[];
    promoItems: PromoItem[];
    categoryOptions?: Record<string, string>;
    homeContent?: PublicTrustContent | null;
    contact?: PublicContact | null;
    partners?: PublicPartner[];
}) {
    const [activeTab, setActiveTab] = useState<PromoTab>('all');
    const [activeCategory, setActiveCategory] = useState('all');
    const [query, setQuery] = useState('');
    const [copiedCode, setCopiedCode] = useState<string | null>(null);
    const normalizedQuery = query.trim().toLowerCase();
    const categoryFilters = useMemo(
        () => [
            { value: 'all', label: 'Semua Kategori' },
            ...Object.entries(categoryOptions).map(([value, label]) => ({
                value,
                label,
            })),
        ],
        [categoryOptions],
    );

    const filteredVouchers = useMemo(() => {
        if (activeTab === 'banner') {
            return [];
        }

        return vouchers.filter((voucher) => {
            if (!normalizedQuery) {
                return true;
            }

            return (
                voucher.code.toLowerCase().includes(normalizedQuery) ||
                voucherRequirement(voucher)
                    .toLowerCase()
                    .includes(normalizedQuery)
            );
        });
    }, [activeTab, normalizedQuery, vouchers]);

    const filteredPromoItems = useMemo(() => {
        if (activeTab === 'voucher') {
            return [];
        }

        return promoItems.filter((promo) => {
            const matchesCategory =
                activeCategory === 'all' || promo.category === activeCategory;

            if (!matchesCategory) {
                return false;
            }

            if (!normalizedQuery) {
                return true;
            }

            return (
                (promo.title ?? 'Promo Indotix')
                    .toLowerCase()
                    .includes(normalizedQuery) ||
                (promo.excerpt ?? '').toLowerCase().includes(normalizedQuery) ||
                (promo.category_label ?? '')
                    .toLowerCase()
                    .includes(normalizedQuery)
            );
        });
    }, [activeCategory, activeTab, normalizedQuery, promoItems]);

    const copyCode = async (code: string) => {
        try {
            await navigator.clipboard.writeText(code);
            setCopiedCode(code);
            window.setTimeout(() => setCopiedCode(null), 1600);
        } catch {
            setCopiedCode(null);
        }
    };

    const promoContentCount = vouchers.length + promoItems.length;

    return (
        <PublicLayout>
            <PublicSeo
                title="Promo Indotix - Voucher dan Diskon Tiket Wisata"
                description="Temukan voucher, kode promo, dan penawaran tiket wisata aktif di Indotix. Salin kode promo lalu gunakan saat pemesanan."
                canonicalPath="/promo"
                keywords={[
                    'promo Indotix',
                    'voucher wisata',
                    'kode promo tiket wisata',
                    'diskon tiket wisata',
                ]}
                structuredData={{
                    '@context': 'https://schema.org',
                    '@type': 'ItemList',
                    name: 'Promo Indotix',
                    itemListElement: vouchers.map((voucher, index) => ({
                        '@type': 'Offer',
                        position: index + 1,
                        name: `Voucher ${voucher.code}`,
                        priceCurrency: 'IDR',
                        availability: 'https://schema.org/InStock',
                        validFrom: voucher.starts_at ?? undefined,
                        validThrough: voucher.ends_at ?? undefined,
                    })),
                }}
            />

            <main className="bg-white pb-16">
                <section className="px-4 pt-8 sm:px-6 lg:px-8">
                    <div className="relative mx-auto max-w-7xl">
                        <div className="relative min-h-[25rem] overflow-hidden rounded-[1.5rem] bg-[linear-gradient(135deg,#0b87d1_0%,#0aaec3_48%,#0cc5ac_100%)] shadow-[0_24px_80px_-52px_rgba(14,116,144,0.8)] sm:min-h-[31rem] lg:rounded-[1.75rem]">
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_15%,rgba(255,255,255,0.22)_0,transparent_25%),radial-gradient(circle_at_82%_20%,rgba(255,255,255,0.2)_0,transparent_22%)]" />
                            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(2,132,199,0.55),transparent_58%)]" />
                            <div className="relative grid min-h-[25rem] items-center gap-8 px-7 py-10 text-white sm:min-h-[31rem] sm:px-12 lg:grid-cols-[1fr_0.95fr] lg:px-36 lg:py-16">
                                <div>
                                    <h1 className="max-w-xl font-['Space_Grotesk'] text-3xl leading-tight font-black tracking-tight sm:text-5xl lg:text-[3.25rem]">
                                        Hemat Lebih Banyak untuk Liburan
                                        Berikutnya
                                    </h1>
                                    <p className="mt-4 max-w-lg text-sm leading-7 font-medium text-white/85 sm:text-lg">
                                        Pilih voucher yang sesuai, salin kode
                                        promo, lalu gunakan saat memesan.
                                    </p>
                                    <div className="mt-8 flex flex-wrap gap-3">
                                        <Link
                                            href="/wisata"
                                            className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-black text-slate-950 shadow-sm transition hover:-translate-y-0.5 hover:bg-sky-50"
                                        >
                                            Cari Tiket Wisata
                                            <ChevronRight className="h-4 w-4" />
                                        </Link>
                                        <a
                                            href="#daftar-promo"
                                            className="inline-flex items-center gap-2 rounded-xl bg-white/20 px-5 py-3 text-sm font-black text-white shadow-sm ring-1 ring-white/30 transition hover:bg-white/25"
                                        >
                                            Lihat Voucher
                                        </a>
                                    </div>
                                </div>

                                <div className="relative h-[15rem] sm:h-[19rem]">
                                    {[
                                        {
                                            icon: Copy,
                                            title: 'Salin kode',
                                            description:
                                                'Ambil kode voucher yang masih aktif.',
                                            className:
                                                'top-0 left-1 rotate-3 sm:top-2 sm:left-8',
                                        },
                                        {
                                            icon: TicketPercent,
                                            title: 'Pesan tiket',
                                            description:
                                                'Pilih destinasi dan lanjut ke pemesanan.',
                                            className:
                                                'top-[5.5rem] right-0 -rotate-1 sm:top-28 sm:right-auto sm:left-28',
                                        },
                                        {
                                            icon: ShieldCheck,
                                            title: 'Harga terpotong',
                                            description:
                                                'Masukkan kode pada kolom voucher.',
                                            className:
                                                'bottom-0 left-8 -rotate-6 sm:right-20 sm:bottom-3 sm:left-auto',
                                        },
                                    ].map((item) => {
                                        const Icon = item.icon;

                                        return (
                                            <div
                                                key={item.title}
                                                className={`absolute flex w-[13rem] items-center gap-3 rounded-2xl bg-white p-3 text-slate-900 shadow-[0_18px_34px_-18px_rgba(15,23,42,0.7)] sm:w-72 sm:gap-4 sm:p-4 ${item.className}`}
                                            >
                                                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sky-50 text-sky-700 sm:h-12 sm:w-12">
                                                    <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
                                                </span>
                                                <span className="min-w-0">
                                                    <span className="block text-sm leading-tight font-black sm:text-base">
                                                        {item.title}
                                                    </span>
                                                    <span className="mt-1 line-clamp-2 block text-xs leading-snug font-medium text-slate-600 sm:text-sm">
                                                        {item.description}
                                                    </span>
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section
                    id="daftar-promo"
                    className="relative z-10 mx-auto -mt-16 max-w-5xl px-4 sm:px-6 lg:px-8"
                >
                    <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-[0_20px_45px_-28px_rgba(15,23,42,0.45)] sm:rounded-[1.35rem]">
                        <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-center">
                            <div className="flex h-12 items-center rounded-2xl border border-slate-200 bg-slate-50 px-4 focus-within:border-sky-300 focus-within:ring-4 focus-within:ring-sky-100">
                                <Search className="mr-3 h-4 w-4 shrink-0 text-slate-400" />
                                <input
                                    type="search"
                                    value={query}
                                    onChange={(event) =>
                                        setQuery(event.target.value)
                                    }
                                    placeholder="Cari kode voucher atau promo"
                                    className="min-w-0 flex-1 border-none bg-transparent text-sm font-semibold text-slate-800 outline-none placeholder:text-slate-400"
                                />
                            </div>
                            <div className="flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                                {tabs.map((tab) => (
                                    <button
                                        key={tab.value}
                                        type="button"
                                        onClick={() => setActiveTab(tab.value)}
                                        className={`shrink-0 rounded-2xl px-4 py-3 text-sm font-black transition ${
                                            activeTab === tab.value
                                                ? 'bg-sky-600 text-white shadow-sm'
                                                : 'bg-slate-100 text-slate-600 hover:bg-sky-50 hover:text-sky-700'
                                        }`}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                        {activeTab !== 'voucher' &&
                            categoryFilters.length > 1 && (
                                <div className="mt-3 flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                                    {categoryFilters.map((category) => (
                                        <button
                                            key={category.value}
                                            type="button"
                                            onClick={() =>
                                                setActiveCategory(
                                                    category.value,
                                                )
                                            }
                                            className={`shrink-0 rounded-full px-4 py-2 text-xs font-black transition ${
                                                activeCategory ===
                                                category.value
                                                    ? 'bg-slate-900 text-white'
                                                    : 'bg-slate-100 text-slate-600 hover:bg-sky-50 hover:text-sky-700'
                                            }`}
                                        >
                                            {category.label}
                                        </button>
                                    ))}
                                </div>
                            )}
                    </div>
                </section>

                <section className="mx-auto max-w-7xl space-y-8 px-4 pt-10 sm:px-6 lg:px-8">
                    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                        <div>
                            <p className="flex items-center gap-2 text-xs font-black tracking-wider text-sky-600 uppercase">
                                <TicketPercent className="h-4 w-4" />
                                Voucher aktif
                            </p>
                            <h2 className="mt-2 font-['Space_Grotesk'] text-2xl font-black tracking-tight text-slate-950">
                                Pilih kode promo yang bisa kamu gunakan
                            </h2>
                            <p className="mt-1 text-sm font-medium text-slate-500">
                                Menampilkan {promoContentCount} promo aktif dari
                                sistem Indotix.
                            </p>
                        </div>
                        <Link
                            href="/wisata"
                            className="inline-flex items-center gap-1 text-sm font-black text-sky-600 transition hover:text-sky-700"
                        >
                            Cari produk wisata
                            <ChevronRight className="h-4 w-4" />
                        </Link>
                    </div>

                    {filteredVouchers.length > 0 ? (
                        <div className={mobileVoucherRailClass}>
                            {filteredVouchers.map((voucher) => {
                                const quota = remainingQuota(voucher);
                                const copied = copiedCode === voucher.code;

                                return (
                                    <article
                                        key={voucher.id}
                                        className={`relative overflow-hidden rounded-[1.25rem] border border-sky-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl lg:rounded-[1.5rem] ${mobileVoucherRailItemClass}`}
                                    >
                                        <div className="absolute top-1/2 -left-3 h-6 w-6 -translate-y-1/2 rounded-full bg-slate-50 ring-1 ring-sky-100 lg:h-7 lg:w-7 lg:bg-[#f4f6f8]" />
                                        <div className="absolute top-1/2 -right-3 h-6 w-6 -translate-y-1/2 rounded-full bg-slate-50 ring-1 ring-sky-100 lg:h-7 lg:w-7 lg:bg-[#f4f6f8]" />
                                        <div className="grid grid-cols-[1fr_auto]">
                                            <div className="p-3.5 lg:p-5">
                                                <p className="text-[10px] font-black tracking-widest text-sky-600 uppercase lg:hidden">
                                                    Voucher Indotix
                                                </p>
                                                <div className="hidden items-center gap-2 rounded-full bg-sky-50 px-3 py-1 text-[10px] font-black tracking-widest text-sky-700 uppercase lg:inline-flex">
                                                    <BadgePercent className="h-3.5 w-3.5" />
                                                    Voucher Indotix
                                                </div>
                                                <div className="mt-2 flex items-end gap-2 lg:mt-4">
                                                    <span className="font-['Space_Grotesk'] text-2xl font-black tracking-tight text-slate-950 lg:text-4xl">
                                                        {voucherDiscount(
                                                            voucher,
                                                        )}
                                                    </span>
                                                    <span className="pb-1 text-xs font-bold text-slate-500 lg:font-black">
                                                        OFF
                                                    </span>
                                                </div>
                                                <p className="mt-1 line-clamp-1 text-xs font-bold text-slate-600 lg:mt-2 lg:text-sm">
                                                    {voucherRequirement(
                                                        voucher,
                                                    )}
                                                </p>
                                                <div className="mt-3 flex flex-wrap items-center gap-2 lg:mt-4">
                                                    <span className="inline-flex rounded-full border border-dashed border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-black tracking-wider text-sky-700">
                                                        {voucher.code}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            copyCode(
                                                                voucher.code,
                                                            )
                                                        }
                                                        className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-xs font-black text-slate-700 transition hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700 lg:gap-1.5 lg:py-1.5"
                                                    >
                                                        {copied ? (
                                                            <Check className="h-3.5 w-3.5" />
                                                        ) : (
                                                            <Copy className="h-3.5 w-3.5" />
                                                        )}
                                                        {copied
                                                            ? 'Tersalin'
                                                            : 'Salin'}
                                                    </button>
                                                </div>
                                                <ul className="mt-3 hidden space-y-1 text-xs font-medium text-slate-500 lg:mt-4 lg:block lg:space-y-1.5">
                                                    <li className="flex items-center gap-2">
                                                        <CalendarDays className="h-3.5 w-3.5 text-sky-600" />
                                                        {voucherPeriod(voucher)}
                                                    </li>
                                                    <li>
                                                        {quota === null
                                                            ? 'Kuota promo terbatas'
                                                            : `${quota} kuota tersisa`}
                                                    </li>
                                                    <li>
                                                        {Number(
                                                            voucher.max_per_user_per_day ??
                                                                0,
                                                        ) > 0
                                                            ? `Maks. ${voucher.max_per_user_per_day} kali per pengguna`
                                                            : 'Dapat digunakan selama syarat terpenuhi'}
                                                    </li>
                                                </ul>
                                                <Link
                                                    href={`/wisata?promo=${encodeURIComponent(voucher.code)}`}
                                                    className="mt-4 hidden items-center gap-1.5 rounded-full bg-sky-600 px-4 py-2.5 text-xs font-black text-white transition hover:bg-sky-700 lg:mt-5 lg:inline-flex"
                                                >
                                                    Gunakan sekarang
                                                    <ChevronRight className="h-4 w-4" />
                                                </Link>
                                            </div>
                                            <div className="flex w-20 flex-col items-center justify-center border-l border-dashed border-sky-100 bg-sky-600 px-3 text-center text-white lg:w-24">
                                                <Gift className="h-6 w-6" />
                                                <span className="mt-2 text-[10px] leading-tight font-black uppercase">
                                                    Hemat
                                                </span>
                                            </div>
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    ) : (
                        activeTab !== 'banner' && (
                            <div className="rounded-[1.5rem] border border-dashed border-slate-200 bg-white p-8 text-center text-sm font-medium text-slate-500">
                                Belum ada voucher yang cocok dengan pencarian.
                            </div>
                        )
                    )}
                </section>

                {activeTab !== 'voucher' && (
                    <section className="mx-auto max-w-7xl space-y-6 px-4 pt-12 sm:px-6 lg:px-8">
                        <div className="flex items-center gap-3">
                            <Gift className="h-6 w-6 shrink-0 text-sky-600" />
                            <h2 className="font-['Space_Grotesk'] text-2xl font-black tracking-tight text-slate-950">
                                Promo pilihan untuk liburanmu
                            </h2>
                        </div>

                        {filteredPromoItems.length > 0 ? (
                            <div className={mobilePromoRailClass}>
                                {filteredPromoItems.map((promo) => {
                                    const content = (
                                        <article className="group overflow-hidden rounded-[1.5rem] border border-slate-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
                                            <div className="h-36 bg-slate-100 sm:h-40">
                                                <img
                                                    src={promo.image_url}
                                                    alt={
                                                        promo.title ??
                                                        'Promo Indotix'
                                                    }
                                                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                                    loading="lazy"
                                                    decoding="async"
                                                />
                                            </div>
                                            <div className="flex items-center justify-between gap-3 p-4">
                                                <div>
                                                    <p className="text-[10px] font-black tracking-wider text-sky-600 uppercase">
                                                        {promo.category_label ??
                                                            'Promo pilihan'}
                                                    </p>
                                                    <h3 className="mt-1 line-clamp-1 text-sm font-black text-slate-950">
                                                        {promo.title ??
                                                            'Promo Indotix'}
                                                    </h3>
                                                    {promo.excerpt && (
                                                        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-500">
                                                            {promo.excerpt}
                                                        </p>
                                                    )}
                                                </div>
                                                <ChevronRight className="h-5 w-5 shrink-0 text-slate-400 transition group-hover:text-sky-600" />
                                            </div>
                                        </article>
                                    );

                                    if (!promo.slug) {
                                        return (
                                            <div
                                                key={promo.id}
                                                className={
                                                    mobilePromoRailItemClass
                                                }
                                            >
                                                {content}
                                            </div>
                                        );
                                    }

                                    return (
                                        <Link
                                            key={promo.id}
                                            href={`/promo/${promo.slug}`}
                                            className={mobilePromoRailItemClass}
                                        >
                                            {content}
                                        </Link>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="rounded-[1.5rem] border border-dashed border-slate-200 bg-white p-8 text-center text-sm font-medium text-slate-500">
                                Belum ada promo pilihan yang cocok.
                            </div>
                        )}
                    </section>
                )}

                <section className="mx-auto max-w-7xl px-4 pt-12 sm:px-6 lg:px-8">
                    <div className="grid gap-5 rounded-[2rem] border border-sky-100 bg-sky-50/70 p-5 md:grid-cols-3">
                        {[
                            'Pilih voucher aktif yang paling sesuai dengan rencana liburan.',
                            'Salin kode voucher, lalu pilih destinasi wisata yang ingin dipesan.',
                            'Masukkan kode pada kolom voucher saat checkout agar total harga otomatis terpotong.',
                        ].map((step, index) => (
                            <div
                                key={step}
                                className="rounded-2xl bg-white p-5 shadow-sm"
                            >
                                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-600 text-sm font-black text-white">
                                    {index + 1}
                                </div>
                                <p className="mt-4 text-sm leading-relaxed font-semibold text-slate-700">
                                    {step}
                                </p>
                            </div>
                        ))}
                    </div>
                </section>
            </main>
            <PublicPartnerSection partners={partners} />
            <PublicTrustSection homeContent={homeContent} contact={contact} />
            <PublicFooter contact={contact} />
        </PublicLayout>
    );
}
