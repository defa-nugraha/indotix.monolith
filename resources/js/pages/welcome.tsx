import { Head, Link } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import { FooterDownloadSocial } from '@/components/footer-download-social';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import PublicLayout from '@/layouts/public-layout';
import { PublicSeo } from '@/components/public-seo';
import {
    BadgePercent,
    Bell,
    BookOpen,
    Camera,
    Check,
    ChevronRight,
    Compass,
    Copy,
    Download,
    Droplets,
    GraduationCap,
    Gift,
    Home as HomeIcon,
    ImageOff,
    Landmark,
    Map as MapIcon,
    MapPin,
    Mountain,
    Navigation,
    RefreshCcw,
    Search,
    Send,
    ShieldCheck,
    Sparkles,
    Ticket,
    TicketPercent,
    Trees,
    Utensils,
    Waves,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

type Banner = { id: number; image_path: string; link_url?: string | null };
type PromoItem = {
    id: number;
    title?: string | null;
    slug?: string | null;
    category?: string | null;
    excerpt?: string | null;
    image_path: string;
    link_url?: string | null;
};
type PromoVoucher = {
    id: number;
    code: string;
    discount_type: 'percentage' | 'fixed';
    discount_value: number;
    min_transaction?: number | null;
    quota_total?: number;
    quota_used?: number;
    starts_at?: string | null;
    ends_at?: string | null;
};
type WisataCard = {
    id: number;
    encrypted_id?: string;
    slug?: string | null;
    name: string;
    description?: string | null;
    city_name?: string | null;
    min_price?: number | null;
    image_url?: string | null;
    type?: string | null;
    latitude?: number | null;
    longitude?: number | null;
};
type BlogPost = {
    id: number;
    title: string;
    slug: string;
    excerpt?: string | null;
    label?: string | null;
    cover_image_url?: string | null;
    published_at?: string | null;
};
type Contact = {
    company_name?: string | null;
    address?: string | null;
    phone?: string | null;
    email?: string | null;
    download_url?: string | null;
    instagram_url?: string | null;
    facebook_url?: string | null;
    twitter_url?: string | null;
    tiktok_url?: string | null;
    youtube_url?: string | null;
};
type HomeContent = {
    search: { placeholder: string; button_label: string };
    categories: { icon: string; label: string }[];
    coupon: { icon: string; title: string; description: string };
    promo: { icon: string; title: string; link_label: string };
    featured: { title: string; description: string; link_label: string };
    nearby: {
        icon: string;
        eyebrow: string;
        title: string;
        description: string;
        button_default: string;
        button_active: string;
        button_loading: string;
    };
    blog: {
        icon: string;
        eyebrow: string;
        title: string;
        description: string;
        link_label: string;
    };
    trust: {
        eyebrow: string;
        title: string;
        badges: { icon: string; text: string }[];
        cta_label: string;
        cards: { icon: string; title: string; description: string }[];
    };
};

const MOBILE_DOWNLOAD_PROMPT_KEY = 'indotix_mobile_download_prompt_dismissed';
const mobileRailClass =
    'flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 scroll-smooth [scrollbar-width:none] md:grid md:snap-none md:overflow-visible md:pb-0 [&::-webkit-scrollbar]:hidden';
const mobileRailItemClass =
    'w-[72vw] min-w-[16rem] max-w-[20rem] shrink-0 snap-start md:w-auto md:min-w-0 md:max-w-none';
const mobileVoucherRailItemClass =
    'w-[78vw] min-w-[17.5rem] max-w-[22rem] shrink-0 snap-start md:w-auto md:min-w-0 md:max-w-none';
const mobileWideRailItemClass =
    'w-[72vw] min-w-[16rem] max-w-[20rem] shrink-0 snap-start md:w-auto md:min-w-0 md:max-w-none';
const homeIconMap = {
    BadgePercent,
    Gift,
    Navigation,
    BookOpen,
    ShieldCheck,
    Ticket,
    Bell,
    RefreshCcw,
    MapPin,
    Sparkles,
    Mountain,
    Landmark,
    GraduationCap,
    Utensils,
    HomeIcon,
    Waves,
    Trees,
    Droplets,
    Compass,
} satisfies Record<string, LucideIcon>;

const resolveHomeIcon = (
    icon: string | null | undefined,
    fallback: LucideIcon,
) => homeIconMap[icon as keyof typeof homeIconMap] ?? fallback;

const isAndroidPhoneDevice = () => {
    if (typeof window === 'undefined') {
        return false;
    }

    const userAgent = window.navigator.userAgent || '';
    const isAndroid = /Android/i.test(userAgent);
    const isMobile = /Mobile/i.test(userAgent);
    const isTablet = /Tablet|iPad|Nexus 7|Nexus 10|KFAPWI/i.test(userAgent);
    const isCompactViewport = window.matchMedia('(max-width: 767px)').matches;

    return isAndroid && isMobile && !isTablet && isCompactViewport;
};

export default function Welcome({
    homeContent,
    banners = [],
    contact,
    wisataCards = [],
    blogPosts = [],
    promoItems = [],
    promoVouchers = [],
}: {
    homeContent: HomeContent;
    banners?: Banner[];
    promoItems?: PromoItem[];
    promoVouchers?: PromoVoucher[];
    contact?: Contact | null;
    wisataCards?: WisataCard[];
    blogPosts?: BlogPost[];
}) {
    const [showMobileDownloadPrompt, setShowMobileDownloadPrompt] =
        useState(false);
    const [userLocation, setUserLocation] = useState<{
        latitude: number;
        longitude: number;
    } | null>(null);
    const [isLocating, setIsLocating] = useState(false);
    const [locationNotice, setLocationNotice] = useState<string | null>(null);
    const [copiedVoucherCode, setCopiedVoucherCode] = useState<string | null>(
        null,
    );

    const categories = [
        {
            label: 'Wisata',
            icon: MapIcon,
            active: true,
            href: '/wisata',
        },
    ];

    const categoryStyles = [
        'bg-emerald-600 text-white shadow-emerald-500/20',
        'bg-amber-600 text-white shadow-amber-500/20',
        'bg-indigo-600 text-white shadow-indigo-500/20',
        'bg-rose-600 text-white shadow-rose-500/20',
        'bg-lime-600 text-white shadow-lime-500/20',
        'bg-violet-600 text-white shadow-violet-500/20',
        'bg-cyan-600 text-white shadow-cyan-500/20',
        'bg-teal-700 text-white shadow-teal-500/20',
        'bg-green-700 text-white shadow-green-500/20',
        'bg-sky-600 text-white shadow-sky-500/20',
    ];
    const chipItems = homeContent.categories.map((item, index) => ({
        label: item.label,
        icon: resolveHomeIcon(item.icon, Mountain),
        className:
            categoryStyles[index % categoryStyles.length] ??
            'bg-sky-600 text-white shadow-sky-500/20',
    }));
    const chips = chipItems.map((item) => item.label);
    const CouponIcon = resolveHomeIcon(homeContent.coupon.icon, BadgePercent);
    const PromoIcon = resolveHomeIcon(homeContent.promo.icon, Gift);
    const NearbyIcon = resolveHomeIcon(homeContent.nearby.icon, Navigation);
    const BlogIcon = resolveHomeIcon(homeContent.blog.icon, BookOpen);

    const formatRupiah = (value: number | string | null | undefined) => {
        const numeric = Number(value);
        if (!Number.isFinite(numeric) || numeric <= 0) return null;
        return `Rp ${numeric.toLocaleString('id-ID')}`;
    };

    const distanceInKm = (
        from: { latitude: number; longitude: number },
        to: { latitude: number; longitude: number },
    ) => {
        const earthRadiusKm = 6371;
        const toRadians = (value: number) => (value * Math.PI) / 180;
        const latitudeDistance = toRadians(to.latitude - from.latitude);
        const longitudeDistance = toRadians(to.longitude - from.longitude);
        const startLatitude = toRadians(from.latitude);
        const endLatitude = toRadians(to.latitude);

        const a =
            Math.sin(latitudeDistance / 2) * Math.sin(latitudeDistance / 2) +
            Math.cos(startLatitude) *
                Math.cos(endLatitude) *
                Math.sin(longitudeDistance / 2) *
                Math.sin(longitudeDistance / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return earthRadiusKm * c;
    };

    const wisataProducts = wisataCards;
    const featuredProducts = wisataProducts.slice(0, 6);
    const featuredProductIds = new Set(featuredProducts.map((item) => item.id));
    const nearbyProducts = useMemo(() => {
        const source = wisataProducts.filter(
            (item) => !featuredProductIds.has(item.id),
        );
        const fallbackSource = source.length > 0 ? source : wisataProducts;

        if (!userLocation) {
            return fallbackSource.slice(0, 6);
        }

        return [...fallbackSource]
            .sort((a, b) => {
                const distanceA =
                    typeof a.latitude === 'number' &&
                    typeof a.longitude === 'number'
                        ? distanceInKm(userLocation, {
                              latitude: a.latitude,
                              longitude: a.longitude,
                          })
                        : Number.POSITIVE_INFINITY;
                const distanceB =
                    typeof b.latitude === 'number' &&
                    typeof b.longitude === 'number'
                        ? distanceInKm(userLocation, {
                              latitude: b.latitude,
                              longitude: b.longitude,
                          })
                        : Number.POSITIVE_INFINITY;

                return distanceA - distanceB;
            })
            .slice(0, 6);
    }, [featuredProductIds, userLocation, wisataProducts]);
    const heroImage =
        (banners[0]?.image_path ? `/storage/${banners[0].image_path}` : null) ??
        wisataProducts.find((item) => item.image_url)?.image_url;
    const addressText =
        contact?.address ??
        'Neo Soho Capital 40th Floor\\nJl. Tanjung Duren Raya No 1\\nJakarta Barat, DKI Jakarta 11470';
    const addressLines = addressText.split('\\n');
    const downloadAppUrl = contact?.download_url?.trim() || '#';
    const downloadLinkAttributes =
        downloadAppUrl !== '#' ? { target: '_blank', rel: 'noreferrer' } : {};
    const activePromoItems = promoItems.slice(0, 3);

    useEffect(() => {
        const downloadUrl = contact?.download_url?.trim();
        if (!downloadUrl || downloadUrl === '#') {
            return;
        }

        if (!isAndroidPhoneDevice()) {
            return;
        }

        if (window.localStorage.getItem(MOBILE_DOWNLOAD_PROMPT_KEY) === '1') {
            return;
        }

        const timer = window.setTimeout(() => {
            setShowMobileDownloadPrompt(true);
        }, 600);

        return () => window.clearTimeout(timer);
    }, [contact?.download_url]);

    const dismissMobileDownloadPrompt = () => {
        setShowMobileDownloadPrompt(false);
        window.localStorage.setItem(MOBILE_DOWNLOAD_PROMPT_KEY, '1');
    };

    const requestUserLocation = () => {
        if (!navigator.geolocation) {
            setLocationNotice(
                'Browser belum mendukung akses lokasi. Rekomendasi ditampilkan berdasarkan destinasi terbaru.',
            );
            return;
        }

        setIsLocating(true);
        setLocationNotice(null);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setUserLocation({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                });
                setIsLocating(false);
                setLocationNotice(
                    'Rekomendasi diurutkan berdasarkan lokasi kamu saat ini.',
                );
            },
            () => {
                setIsLocating(false);
                setLocationNotice(
                    'Lokasi belum aktif. Rekomendasi ditampilkan berdasarkan destinasi terbaru.',
                );
            },
            {
                enableHighAccuracy: false,
                maximumAge: 1000 * 60 * 10,
                timeout: 8000,
            },
        );
    };

    const renderWisataCard = (item: WisataCard) => {
        const detailSlug = item.slug ?? item.encrypted_id;
        const priceLabel = formatRupiah(item.min_price) ?? 'Harga tersedia';
        const distanceLabel =
            userLocation &&
            typeof item.latitude === 'number' &&
            typeof item.longitude === 'number'
                ? `${distanceInKm(userLocation, {
                      latitude: item.latitude,
                      longitude: item.longitude,
                  }).toFixed(1)} km`
                : null;

        return (
            <article
                key={item.id}
                className="group overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl"
            >
                <div className="relative h-28 overflow-hidden bg-slate-100 sm:h-40">
                    {item.image_url ? (
                        <img
                            src={item.image_url}
                            alt={item.name}
                            loading="lazy"
                            decoding="async"
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center text-slate-400">
                            <ImageOff className="h-10 w-10" />
                        </div>
                    )}

                    <div className="absolute top-3 left-3 flex max-w-[70%] items-center gap-1 rounded-full bg-black/40 px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur-xs sm:top-4 sm:left-4">
                        <MapPin className="h-3.5 w-3.5 shrink-0 fill-current text-sky-300" />
                        <span className="truncate">
                            {distanceLabel ?? item.city_name ?? 'Indonesia'}
                        </span>
                    </div>

                    <div className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-black text-slate-900 shadow-sm backdrop-blur-xs sm:top-4 sm:right-4 sm:text-xs">
                        <Ticket className="h-3.5 w-3.5 text-sky-600" />
                        <span>Tiket</span>
                    </div>
                </div>

                <div className="space-y-2 p-3 sm:p-4">
                    <span className="inline-flex rounded-full bg-sky-50 px-2.5 py-1 text-[10px] font-bold text-sky-600">
                        {item.type ?? 'Wisata'}
                    </span>
                    <h2 className="line-clamp-2 text-sm leading-snug font-bold text-slate-950">
                        {item.name}
                    </h2>
                    <p className="line-clamp-2 text-xs leading-relaxed font-normal text-slate-500">
                        {item.description ||
                            [item.type, item.city_name]
                                .filter(Boolean)
                                .join(' · ') ||
                            'Destinasi wisata pilihan Indotix'}
                    </p>

                    <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
                        <div className="min-w-0">
                            <span className="block text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                                Harga mulai
                            </span>
                            <span className="block truncate text-xs font-extrabold tracking-tight text-sky-600 sm:text-base">
                                {priceLabel}
                            </span>
                        </div>

                        {detailSlug ? (
                            <Link
                                href={`/wisata/${detailSlug}`}
                                className="shrink-0 rounded-full bg-slate-900 px-3 py-2 text-[11px] font-bold text-white transition-all group-hover:bg-sky-600 group-hover:shadow-md sm:px-3.5 sm:text-xs"
                            >
                                Jelajah
                            </Link>
                        ) : (
                            <span className="shrink-0 rounded-full bg-slate-200 px-3 py-2 text-[11px] font-bold text-slate-500 sm:px-3.5 sm:text-xs">
                                Jelajah
                            </span>
                        )}
                    </div>
                </div>
            </article>
        );
    };

    const formatVoucherDiscount = (voucher: PromoVoucher) => {
        if (voucher.discount_type === 'percentage') {
            return `${voucher.discount_value}%`;
        }

        return formatRupiah(voucher.discount_value) ?? 'Promo';
    };

    const formatVoucherRequirement = (voucher: PromoVoucher) => {
        const minTransaction = Number(voucher.min_transaction ?? 0);
        if (!Number.isFinite(minTransaction) || minTransaction <= 0) {
            return 'Tanpa minimum transaksi';
        }

        return `Min. transaksi ${formatRupiah(minTransaction)}`;
    };

    const copyVoucherCode = async (code: string) => {
        try {
            await navigator.clipboard.writeText(code);
            setCopiedVoucherCode(code);
            window.setTimeout(() => setCopiedVoucherCode(null), 1500);
        } catch {
            setCopiedVoucherCode(null);
        }
    };

    return (
        <PublicLayout
            categories={categories}
            chips={chips}
            showCategories={false}
            showChips={false}
        >
            <PublicSeo
                title="Indotix - Pesan Tiket Wisata dan Destinasi Rekreasi"
                description="Pesan tiket wisata, taman hiburan, dan destinasi rekreasi pilihan dengan mudah melalui Indotix."
                canonicalPath="/"
                keywords={[
                    'tiket wisata',
                    'tiket taman hiburan',
                    'destinasi rekreasi',
                    'wisata Indonesia',
                    'Indotix',
                ]}
                structuredData={[
                    {
                        '@context': 'https://schema.org',
                        '@type': 'Organization',
                        name: 'Indotix',
                        url: '/',
                        logo: '/logo.png',
                    },
                    {
                        '@context': 'https://schema.org',
                        '@type': 'WebSite',
                        name: 'Indotix',
                        url: '/',
                        inLanguage: 'id-ID',
                        potentialAction: {
                            '@type': 'SearchAction',
                            target: '/wisata?q={search_term_string}',
                            'query-input': 'required name=search_term_string',
                        },
                    },
                ]}
            />
            <Head>
                <link
                    href="https://fonts.bunny.net/css?family=inter:400,500,600,700|space-grotesk:500,600,700|jetbrains-mono:400,500,600"
                    rel="stylesheet"
                />
            </Head>

            <Dialog
                open={showMobileDownloadPrompt}
                onOpenChange={(open) => {
                    if (!open) {
                        dismissMobileDownloadPrompt();
                    }
                }}
            >
                <DialogContent className="max-w-[calc(100%-1.5rem)] rounded-3xl border-slate-200 p-0 sm:max-w-sm">
                    <div className="overflow-hidden rounded-3xl">
                        <div className="bg-[linear-gradient(135deg,#0B3B8F,#1D73D6,#4CC9F0)] px-6 py-5 text-white">
                            <p className="text-xs font-semibold text-white/80 uppercase">
                                Download Aplikasi
                            </p>
                            <DialogHeader className="mt-2 text-left">
                                <DialogTitle className="text-xl leading-tight font-bold text-white">
                                    Buka pengalaman yang lebih praktis di
                                    aplikasi Indotix
                                </DialogTitle>
                                <DialogDescription className="text-sm leading-6 text-white/85">
                                    Booking tiket, cek pesanan, dan pantau
                                    update terbaru langsung dari ponselmu.
                                </DialogDescription>
                            </DialogHeader>
                        </div>
                        <div className="space-y-4 bg-white px-6 py-5">
                            <a
                                href={downloadAppUrl}
                                {...downloadLinkAttributes}
                                onClick={dismissMobileDownloadPrompt}
                                className="flex w-full items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 transition hover:border-sky-200 hover:bg-sky-50"
                            >
                                <img
                                    src="/images/playstore.png"
                                    alt="Download di Google Play"
                                    className="h-12 w-auto object-contain"
                                />
                            </a>
                            <button
                                type="button"
                                onClick={dismissMobileDownloadPrompt}
                                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
                            >
                                Nanti saja
                            </button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <main className="space-y-8 pb-0 font-sans text-slate-800">
                <section className="relative z-10 h-[clamp(200px,24vw,360px)] w-full border-b border-slate-200 text-slate-800 shadow-md">
                    <div className="absolute inset-0 -z-10 overflow-hidden bg-[linear-gradient(135deg,#dbeafe,#f8fafc_45%,#e0f2fe)]">
                        {heroImage ? (
                            <img
                                src={heroImage}
                                alt="Destinasi wisata Indotix"
                                className="absolute inset-0 h-full w-full object-fill"
                            />
                        ) : (
                            <div className="absolute inset-0 bg-[linear-gradient(135deg,#dbeafe,#f8fafc_45%,#e0f2fe)]" />
                        )}
                        <div className="absolute inset-0 bg-white/5" />
                        <div className="absolute top-6 right-20 h-8 w-16 animate-pulse rounded-full bg-white/30 blur-md" />
                        <div className="absolute bottom-8 left-12 h-10 w-24 rounded-full bg-white/20 blur-lg" />
                        <div className="absolute top-6 left-1/4 -rotate-12 animate-bounce opacity-40">
                            <Send className="h-8 w-8 fill-current text-sky-500" />
                        </div>
                    </div>

                    <div className="absolute right-0 bottom-0 left-0 z-20 px-4 sm:px-6 lg:px-8">
                        <div className="mx-auto max-w-6xl space-y-3">
                            <form
                                action="/wisata"
                                method="get"
                                className="relative mx-auto flex max-w-2xl translate-y-3 items-center rounded-full border border-slate-200 bg-white p-1.5 text-slate-800 shadow-lg transition-all focus-within:border-transparent focus-within:ring-4 focus-within:ring-sky-500/20 sm:-translate-y-2"
                            >
                                <Search className="ml-4 h-5 w-5 shrink-0 text-slate-400" />
                                <input
                                    type="search"
                                    name="q"
                                    placeholder={homeContent.search.placeholder}
                                    aria-label={homeContent.search.placeholder}
                                    className="flex-1 border-none bg-transparent px-3 py-2 text-xs font-medium placeholder:text-slate-400 focus:outline-none sm:text-sm"
                                />
                                <button
                                    type="submit"
                                    className="shrink-0 rounded-full bg-sky-600 px-6 py-2.5 text-xs font-bold tracking-wide text-white uppercase shadow-md transition-all hover:bg-sky-700 sm:text-sm"
                                >
                                    {homeContent.search.button_label}
                                </button>
                            </form>
                            <div className="flex translate-y-1/2 items-center gap-2 overflow-x-auto scroll-smooth rounded-2xl border border-slate-100 bg-white p-3 shadow-xl [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                                {chipItems.map((chip) => {
                                    const Icon = chip.icon;

                                    return (
                                        <Link
                                            key={chip.label}
                                            href={`/wisata?q=${encodeURIComponent(chip.label)}`}
                                            className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold shadow-md transition-all hover:-translate-y-0.5 sm:text-sm ${chip.className}`}
                                        >
                                            <Icon className="h-4 w-4 shrink-0 stroke-[2.7]" />
                                            <span>{chip.label}</span>
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </section>

                <div className="h-7 sm:h-9" />

                <section className="mx-auto max-w-7xl space-y-5 px-4 sm:px-6 lg:px-8">
                    <div className="flex items-start gap-3">
                        <CouponIcon className="mt-1 h-6 w-6 shrink-0 text-sky-600" />
                        <div>
                            <h2 className="font-['Space_Grotesk'] text-2xl font-black tracking-tight text-slate-950">
                                {homeContent.coupon.title}
                            </h2>
                            <p className="mt-1 text-sm font-medium text-slate-500">
                                {homeContent.coupon.description}
                            </p>
                        </div>
                    </div>

                    {promoVouchers.length > 0 ? (
                        <div
                            className={`${mobileRailClass} md:grid-cols-3 md:gap-4`}
                        >
                            {promoVouchers.slice(0, 3).map((voucher) => {
                                const remainingQuota =
                                    (voucher.quota_total ?? 0) > 0
                                        ? Math.max(
                                              0,
                                              (voucher.quota_total ?? 0) -
                                                  (voucher.quota_used ?? 0),
                                          )
                                        : null;
                                const copied =
                                    copiedVoucherCode === voucher.code;

                                return (
                                    <article
                                        key={voucher.id}
                                        className={`relative overflow-hidden rounded-[1.25rem] border border-sky-100 bg-white shadow-sm ${mobileVoucherRailItemClass}`}
                                    >
                                        <div className="absolute top-1/2 -left-3 h-6 w-6 -translate-y-1/2 rounded-full bg-slate-50 ring-1 ring-sky-100" />
                                        <div className="absolute top-1/2 -right-3 h-6 w-6 -translate-y-1/2 rounded-full bg-slate-50 ring-1 ring-sky-100" />
                                        <div className="grid grid-cols-[1fr_auto]">
                                            <div className="p-3.5 md:p-5">
                                                <p className="text-[10px] font-black tracking-widest text-sky-600 uppercase">
                                                    Voucher Indotix
                                                </p>
                                                <div className="mt-2 flex items-end gap-2 md:mt-3">
                                                    <span className="font-['Space_Grotesk'] text-2xl font-black tracking-tight text-slate-950 md:text-3xl">
                                                        {formatVoucherDiscount(
                                                            voucher,
                                                        )}
                                                    </span>
                                                    <span className="pb-1 text-xs font-bold text-slate-500">
                                                        OFF
                                                    </span>
                                                </div>
                                                <p className="mt-1 line-clamp-1 text-xs font-semibold text-slate-500 md:mt-2">
                                                    {formatVoucherRequirement(
                                                        voucher,
                                                    )}
                                                </p>
                                                <div className="mt-3 flex flex-wrap items-center gap-2 md:mt-4">
                                                    <span className="inline-flex rounded-full border border-dashed border-sky-200 bg-sky-50 px-3 py-1 text-xs font-black tracking-wider text-sky-700">
                                                        {voucher.code}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            copyVoucherCode(
                                                                voucher.code,
                                                            )
                                                        }
                                                        className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-xs font-black text-slate-700 transition hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700"
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
                                            </div>
                                            <div className="flex w-20 flex-col items-center justify-center border-l border-dashed border-sky-100 bg-sky-600 px-3 text-center text-white md:w-24">
                                                <TicketPercent className="h-6 w-6" />
                                                <span className="mt-2 text-[10px] leading-tight font-bold uppercase">
                                                    {remainingQuota === null
                                                        ? 'Kuota terbatas'
                                                        : `${remainingQuota} tersisa`}
                                                </span>
                                            </div>
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
                            Belum ada voucher promo yang aktif saat ini.
                        </div>
                    )}
                </section>

                <section className="mx-auto max-w-7xl space-y-5 px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center gap-3">
                        <PromoIcon className="h-6 w-6 shrink-0 text-sky-600" />
                        <h2 className="font-['Space_Grotesk'] text-2xl font-black tracking-tight text-slate-950">
                            {homeContent.promo.title}
                        </h2>
                    </div>

                    {activePromoItems.length > 0 ? (
                        <div
                            className={`${mobileRailClass} md:grid-cols-3 md:gap-4`}
                        >
                            {activePromoItems.map((promo, index) => {
                                const imageUrl = promo.image_path.startsWith(
                                    'http',
                                )
                                    ? promo.image_path
                                    : `/storage/${promo.image_path}`;
                                const detailHref = promo.slug
                                    ? `/promo/${promo.slug}`
                                    : '/promo';

                                const content = (
                                    <img
                                        src={imageUrl}
                                        alt={
                                            promo.title ??
                                            `Promo terbaik ${index + 1}`
                                        }
                                        className="h-full w-full object-cover"
                                        loading="lazy"
                                        decoding="async"
                                    />
                                );

                                return (
                                    <Link
                                        key={promo.id}
                                        href={detailHref}
                                        className={`block h-28 overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl sm:h-36 md:h-40 ${mobileRailItemClass}`}
                                    >
                                        {content}
                                    </Link>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
                            Belum ada promo terbaik yang aktif saat ini.
                        </div>
                    )}

                    <div className="text-center">
                        <Link
                            href="/promo"
                            className="inline-flex items-center gap-1 text-sm font-black text-sky-600 transition hover:text-sky-700"
                        >
                            {homeContent.promo.link_label}
                            <ChevronRight className="h-4 w-4" />
                        </Link>
                    </div>
                </section>

                <section
                    id="featured-destinations-section"
                    className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8"
                >
                    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                        <div>
                            <h1 className="font-['Space_Grotesk'] text-2xl font-black tracking-tight text-slate-950">
                                {homeContent.featured.title}
                            </h1>
                            <p className="mt-1 text-xs font-medium text-slate-500 sm:text-sm">
                                {homeContent.featured.description}
                            </p>
                        </div>

                        <Link
                            href="/wisata"
                            className="text-xs font-bold tracking-wider text-sky-600 uppercase hover:text-sky-700"
                        >
                            {homeContent.featured.link_label}
                        </Link>
                    </div>

                    {featuredProducts.length > 0 ? (
                        <div
                            className={`${mobileRailClass} md:grid-cols-4 md:gap-6`}
                        >
                            {featuredProducts.map((item) => (
                                <div
                                    key={item.id}
                                    className={mobileRailItemClass}
                                >
                                    {renderWisataCard(item)}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center text-slate-500">
                            <p className="text-lg font-semibold text-slate-900">
                                Belum ada produk wisata
                            </p>
                            <p className="mt-2 text-xs">
                                Produk wisata yang sudah aktif akan tampil di
                                bagian ini.
                            </p>
                        </div>
                    )}
                </section>

                <section className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
                    <div className="flex flex-col justify-between gap-4 rounded-3xl border border-sky-100 bg-sky-50/70 p-5 sm:flex-row sm:items-center">
                        <div>
                            <p className="flex items-center gap-2 text-xs font-bold tracking-wider text-sky-600 uppercase">
                                <NearbyIcon className="h-4 w-4" />
                                {homeContent.nearby.eyebrow}
                            </p>
                            <h2 className="mt-2 font-['Space_Grotesk'] text-2xl font-black tracking-tight text-slate-950">
                                {homeContent.nearby.title}
                            </h2>
                            <p className="mt-1 max-w-2xl text-xs leading-relaxed font-medium text-slate-500 sm:text-sm">
                                {homeContent.nearby.description}
                            </p>
                            {locationNotice && (
                                <p className="mt-2 text-xs font-semibold text-slate-500">
                                    {locationNotice}
                                </p>
                            )}
                        </div>
                        <button
                            type="button"
                            onClick={requestUserLocation}
                            disabled={isLocating}
                            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-sky-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-70"
                        >
                            <Navigation className="h-4 w-4" />
                            {isLocating
                                ? homeContent.nearby.button_loading
                                : userLocation
                                  ? homeContent.nearby.button_active
                                  : homeContent.nearby.button_default}
                        </button>
                    </div>

                    {nearbyProducts.length > 0 ? (
                        <div
                            className={`${mobileRailClass} md:grid-cols-4 md:gap-6`}
                        >
                            {nearbyProducts.map((item) => (
                                <div
                                    key={item.id}
                                    className={mobileRailItemClass}
                                >
                                    {renderWisataCard(item)}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
                            Belum ada rekomendasi wisata lainnya.
                        </div>
                    )}
                </section>

                <section className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                        <div>
                            <p className="flex items-center gap-2 text-xs font-bold tracking-wider text-sky-600 uppercase">
                                <BlogIcon className="h-4 w-4" />
                                {homeContent.blog.eyebrow}
                            </p>
                            <h2 className="mt-2 font-['Space_Grotesk'] text-2xl font-black tracking-tight text-slate-950">
                                {homeContent.blog.title}
                            </h2>
                            <p className="mt-1 text-xs font-medium text-slate-500 sm:text-sm">
                                {homeContent.blog.description}
                            </p>
                        </div>
                        <Link
                            href="/jelajah"
                            className="text-xs font-bold tracking-wider text-sky-600 uppercase hover:text-sky-700"
                        >
                            {homeContent.blog.link_label}
                        </Link>
                    </div>

                    {blogPosts.length > 0 ? (
                        <div
                            className={`${mobileRailClass} md:grid-cols-4 md:gap-6`}
                        >
                            {blogPosts.map((post) => (
                                <Link
                                    key={post.id}
                                    href={`/jelajah/${post.slug}`}
                                    className={`group overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl ${mobileRailItemClass}`}
                                >
                                    <div className="relative h-28 overflow-hidden bg-slate-100 sm:h-40">
                                        {post.cover_image_url ? (
                                            <img
                                                src={post.cover_image_url}
                                                alt={post.title}
                                                loading="lazy"
                                                decoding="async"
                                                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                            />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center bg-sky-50 text-sky-600">
                                                <Camera className="h-9 w-9" />
                                            </div>
                                        )}
                                        {post.label && (
                                            <span className="absolute top-3 left-3 rounded-full bg-white/95 px-3 py-1 text-[10px] font-bold text-sky-600 shadow-sm">
                                                {post.label}
                                            </span>
                                        )}
                                    </div>
                                    <div className="space-y-2 p-3 sm:p-4">
                                        <h3 className="line-clamp-2 text-sm leading-snug font-bold text-slate-950">
                                            {post.title}
                                        </h3>
                                        {post.excerpt && (
                                            <p className="line-clamp-2 text-xs leading-relaxed text-slate-500">
                                                {post.excerpt}
                                            </p>
                                        )}
                                        <span className="inline-flex text-xs font-bold text-sky-600 group-hover:text-sky-700">
                                            Baca artikel
                                        </span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
                            Belum ada artikel Jelajah Indotix.
                        </div>
                    )}
                </section>

                <section className="relative left-1/2 w-screen -translate-x-1/2 bg-[url('/images/backgroun-section.png')] bg-[length:calc(100%+96px)_calc(100%+48px)] bg-center bg-no-repeat py-8 sm:py-10">
                    <div className="mx-auto grid max-w-7xl gap-6 px-4 sm:px-6 lg:grid-cols-[0.85fr_2fr] lg:items-center lg:px-8">
                        <div>
                            <p className="text-base font-black text-slate-950 sm:text-lg">
                                {homeContent.trust.eyebrow}
                            </p>
                            <h2 className="mt-5 font-['Space_Grotesk'] text-2xl leading-tight font-black tracking-tight text-slate-950 sm:text-3xl">
                                {homeContent.trust.title}
                            </h2>
                            <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold text-slate-700">
                                {homeContent.trust.badges.map((badge) => {
                                    const BadgeIcon = resolveHomeIcon(
                                        badge.icon,
                                        ShieldCheck,
                                    );

                                    return (
                                        <span
                                            key={`${badge.icon}-${badge.text}`}
                                            className="inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 shadow-sm ring-1 ring-sky-100"
                                        >
                                            <BadgeIcon className="h-4 w-4 text-sky-600" />
                                            {badge.text}
                                        </span>
                                    );
                                })}
                            </div>
                            <a
                                href={downloadAppUrl}
                                {...downloadLinkAttributes}
                                className="mt-5 inline-flex items-center justify-center gap-2 rounded-full bg-sky-600 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-sky-700"
                            >
                                {homeContent.trust.cta_label}
                                <Download className="h-4 w-4" />
                            </a>
                        </div>

                        <div className={`${mobileRailClass} md:grid-cols-3`}>
                            {homeContent.trust.cards.map((item) => {
                                const Icon = resolveHomeIcon(
                                    item.icon,
                                    BadgePercent,
                                );

                                return (
                                    <article
                                        key={item.title}
                                        className={`flex gap-3 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-sm sm:p-5 ${mobileWideRailItemClass}`}
                                    >
                                        <Icon className="mt-1 h-9 w-9 shrink-0 text-sky-600" />
                                        <div>
                                            <h3 className="text-sm font-black text-slate-950">
                                                {item.title}
                                            </h3>
                                            <p className="mt-1 text-sm leading-relaxed text-slate-600">
                                                {item.description}
                                            </p>
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    </div>
                </section>
            </main>

            <footer className="mt-0 border-t border-slate-200 bg-white">
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
                            {addressLines.map((line, index) => (
                                <span key={line}>
                                    {line}
                                    {index < addressLines.length - 1 && <br />}
                                </span>
                            ))}
                        </p>
                        <p className="mt-4 text-sm text-slate-600">
                            {contact?.phone ?? '0812 9205 9888'}
                        </p>
                        <p className="text-sm text-slate-600">
                            {contact?.email ?? 'info@indotix.co.id'}
                        </p>
                    </div>
                    <div>
                        <h4 className="text-sm font-semibold text-slate-900">
                            Layanan
                        </h4>
                        <ul className="mt-3 space-y-2 text-sm text-slate-600">
                            <li>Wisata</li>
                            <li>Tiket destinasi</li>
                            <li>Taman hiburan</li>
                            <li>Wisata keluarga</li>
                            <li>Wisata edukasi</li>
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
                    <FooterDownloadSocial
                        downloadUrl={contact?.download_url}
                        facebookUrl={contact?.facebook_url}
                        instagramUrl={contact?.instagram_url}
                        twitterUrl={contact?.twitter_url}
                        tiktokUrl={contact?.tiktok_url}
                        youtubeUrl={contact?.youtube_url}
                    />
                </div>
                <div className="border-t border-slate-200 py-4 text-center text-xs text-slate-500">
                    © 2025 Indotix. All rights reserved.
                </div>
            </footer>
        </PublicLayout>
    );
}
