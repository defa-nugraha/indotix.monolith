import { Head, Link } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import { FooterDownloadSocial } from '@/components/footer-download-social';
import { PublicPartnerSection } from '@/components/public-page-sections';
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
    Backpack,
    BaggageClaim,
    Bell,
    Bike,
    Binoculars,
    BookOpen,
    Bus,
    CableCar,
    Camera,
    Car,
    ChevronRight,
    Compass,
    Download,
    Droplets,
    FerrisWheel,
    GraduationCap,
    Gift,
    Home as HomeIcon,
    ImageOff,
    Landmark,
    Map as MapIcon,
    MapPin,
    Mountain,
    Navigation,
    Plane,
    Play,
    RefreshCcw,
    Sailboat,
    ShieldCheck,
    Ship,
    ShipWheel,
    Sparkles,
    Sprout,
    Sun,
    Sunrise,
    Sunset,
    Tent,
    TentTree,
    Ticket,
    Train,
    TreePalm,
    TreePine,
    Trees,
    Umbrella,
    Utensils,
    Volleyball,
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
    voucher_code?: string | null;
    voucher_remaining_count?: number | null;
};
type Partner = {
    id: number | string;
    name?: string | null;
    image_url?: string | null;
    link_url?: string | null;
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
type CategoryProductSection = {
    key: string;
    title: string;
    description?: string | null;
    href?: string | null;
    products: WisataCard[];
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
    special_promo: {
        title: string;
        video: {
            title: string;
            subtitle: string;
            url?: string | null;
            poster_url?: string | null;
        };
        cards: {
            title?: string | null;
            subtitle?: string | null;
            image_url?: string | null;
            link_url?: string | null;
        }[];
    };
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
    Backpack,
    BaggageClaim,
    Bike,
    Binoculars,
    Bus,
    CableCar,
    Camera,
    Car,
    FerrisWheel,
    Plane,
    Sailboat,
    Ship,
    ShipWheel,
    Sprout,
    Sun,
    Sunrise,
    Sunset,
    Tent,
    TentTree,
    Train,
    TreePalm,
    TreePine,
    Umbrella,
    Volleyball,
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
    categorySections = [],
    blogPosts = [],
    promoItems = [],
    partners = [],
}: {
    homeContent: HomeContent;
    banners?: Banner[];
    promoItems?: PromoItem[];
    contact?: Contact | null;
    partners?: Partner[];
    wisataCards?: WisataCard[];
    categorySections?: CategoryProductSection[];
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
    const [shouldLoadSpecialPromoVideo, setShouldLoadSpecialPromoVideo] =
        useState(false);
    const [
        shouldLoadCompactSpecialPromoVideo,
        setShouldLoadCompactSpecialPromoVideo,
    ] = useState(false);
    const [activeBannerIndex, setActiveBannerIndex] = useState(0);

    const categories = [
        {
            label: 'Wisata',
            icon: MapIcon,
            active: true,
            href: '/wisata',
        },
    ];
    const bannerCategoryLabels = useMemo(() => {
        const fallbackLabels = [
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
        const configuredLabels = homeContent.categories
            .map((item) => item.label?.trim())
            .filter((label): label is string => Boolean(label));
        const seen = new Set<string>();

        return [...configuredLabels, ...fallbackLabels].filter((label) => {
            const key = label.toLowerCase();
            if (seen.has(key)) {
                return false;
            }

            seen.add(key);
            return true;
        });
    }, [homeContent.categories]);

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
    const featuredProducts = wisataProducts.slice(0, 3);
    const featuredProductIds = new Set(featuredProducts.map((item) => item.id));
    const nearbyProducts = useMemo(() => {
        const source = wisataProducts.filter(
            (item) => !featuredProductIds.has(item.id),
        );
        const fallbackSource = source.length > 0 ? source : wisataProducts;

        if (!userLocation) {
            return fallbackSource.slice(0, 3);
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
            .slice(0, 3);
    }, [featuredProductIds, userLocation, wisataProducts]);
    const bannerSlides = useMemo(() => {
        const configuredBanners = banners
            .filter((banner) => Boolean(banner.image_path))
            .map((banner) => ({
                id: `banner-${banner.id}`,
                title: 'Banner Indotix',
                imageUrl: banner.image_path.startsWith('http')
                    ? banner.image_path
                    : `/storage/${banner.image_path}`,
                href: banner.link_url?.trim() || null,
            }));

        if (configuredBanners.length > 0) {
            return configuredBanners;
        }

        const fallbackDestination = wisataProducts.find(
            (item) => item.image_url,
        );

        return fallbackDestination?.image_url
            ? [
                  {
                      id: `fallback-${fallbackDestination.id}`,
                      title: fallbackDestination.name,
                      imageUrl: fallbackDestination.image_url,
                      href: fallbackDestination.slug
                          ? `/wisata/${fallbackDestination.slug}`
                          : null,
                  },
              ]
            : [];
    }, [banners, wisataProducts]);
    const heroImage = bannerSlides[activeBannerIndex]?.imageUrl ?? null;
    const totalBannerSlides = bannerSlides.length;
    const hasMultipleBanners = totalBannerSlides > 1;
    const activeBanner =
        bannerSlides[activeBannerIndex] ?? bannerSlides[0] ?? null;
    const visibleBannerSlides = useMemo(() => {
        if (bannerSlides.length === 0) {
            return [];
        }

        const offsets = bannerSlides.length > 1 ? [-1, 0, 1] : [0];

        return offsets.map((offset) => {
            const index =
                (activeBannerIndex + offset + bannerSlides.length) %
                bannerSlides.length;

            return {
                slide: bannerSlides[index],
                active: offset === 0,
                offset,
            };
        });
    }, [activeBannerIndex, bannerSlides]);
    const getBannerSlideStyle = (offset: number) => {
        const activeBannerSlideWidth = 'clamp(20rem, 54vw, 68rem)';
        const sideBannerSlideWidth = 'clamp(18rem, 46vw, 58rem)';
        const bannerSlideGap = '1.25rem';
        const frameWidth =
            offset === 0 ? activeBannerSlideWidth : sideBannerSlideWidth;

        if (offset < 0) {
            return {
                width: frameWidth,
                transform: `translateX(calc(-50% - (${activeBannerSlideWidth} / 2) - (${sideBannerSlideWidth} / 2) - ${bannerSlideGap})) translateY(-50%)`,
            };
        }

        if (offset > 0) {
            return {
                width: frameWidth,
                transform: `translateX(calc(-50% + (${activeBannerSlideWidth} / 2) + (${sideBannerSlideWidth} / 2) + ${bannerSlideGap})) translateY(-50%)`,
            };
        }

        return {
            width: frameWidth,
            transform: 'translateX(-50%) translateY(-50%)',
        };
    };
    const advanceBanner = (direction: number) => {
        if (totalBannerSlides <= 1) {
            return;
        }

        setActiveBannerIndex((current) =>
            (current + direction + totalBannerSlides) % totalBannerSlides,
        );
    };
    const addressText =
        contact?.address ??
        'Neo Soho Capital 40th Floor\\nJl. Tanjung Duren Raya No 1\\nJakarta Barat, DKI Jakarta 11470';
    const addressLines = addressText.split('\\n');
    const downloadAppUrl = contact?.download_url?.trim() || '#';
    const downloadLinkAttributes =
        downloadAppUrl !== '#' ? { target: '_blank', rel: 'noreferrer' } : {};
    const normalizeMediaUrl = (value: string | null | undefined) => {
        const path = value?.trim();
        if (!path) {
            return null;
        }

        if (path.startsWith('http') || path.startsWith('/')) {
            return path;
        }

        return `/storage/${path}`;
    };
    const normalizeLinkUrl = (value: string | null | undefined) => {
        const path = value?.trim();
        if (!path) {
            return null;
        }

        if (path.startsWith('http') || path.startsWith('/')) {
            return path;
        }

        return `/${path}`;
    };
    const specialPromoImageCards = useMemo(() => {
        const seen = new Set<string>();
        const cards = [
            ...homeContent.special_promo.cards.map((card, index) => ({
                id: `configured-${index + 1}`,
                title: card.title || `Promo spesial ${index + 1}`,
                subtitle: card.subtitle || 'Promo pilihan',
                href: normalizeLinkUrl(card.link_url) ?? '/promo',
                imageUrl: normalizeMediaUrl(card.image_url),
            })),
            ...promoItems.map((promo) => ({
                id: `promo-${promo.id}`,
                title: promo.title ?? 'Promo Indotix',
                subtitle: promo.excerpt ?? promo.category ?? 'Promo wisata',
                href: promo.slug ? `/promo/${promo.slug}` : '/promo',
                imageUrl: normalizeMediaUrl(promo.image_path),
            })),
            ...wisataProducts.map((destination) => ({
                id: `wisata-${destination.id}`,
                title: destination.name,
                subtitle:
                    destination.city_name ??
                    destination.type ??
                    'Destinasi wisata',
                href: `/wisata/${destination.slug ?? destination.encrypted_id ?? destination.id}`,
                imageUrl: destination.image_url ?? null,
            })),
        ];

        return cards
            .filter((card) => card.imageUrl && card.title)
            .filter((card) => {
                const identity = `${card.href}|${card.imageUrl}`;

                if (seen.has(identity)) {
                    return false;
                }

                seen.add(identity);
                return true;
            })
            .slice(0, 4);
    }, [homeContent.special_promo.cards, promoItems, wisataProducts]);
    const specialPromoVideoUrl = normalizeMediaUrl(
        homeContent.special_promo.video.url,
    );
    const specialPromoVideoPosterUrl =
        normalizeMediaUrl(homeContent.special_promo.video.poster_url) ??
        specialPromoImageCards[0]?.imageUrl ??
        heroImage;
    const specialPromoSlots = Array.from(
        { length: 3 },
        (_, index) =>
            specialPromoImageCards[index] ??
            specialPromoImageCards[index % specialPromoImageCards.length] ??
            null,
    );

    useEffect(() => {
        setActiveBannerIndex(0);
    }, [bannerSlides.length]);

    useEffect(() => {
        if (bannerSlides.length <= 1) {
            return;
        }

        const timer = window.setInterval(() => {
            setActiveBannerIndex((current) =>
                current + 1 >= bannerSlides.length ? 0 : current + 1,
            );
        }, 5000);

        return () => window.clearInterval(timer);
    }, [bannerSlides.length]);

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
                <div className="relative h-32 overflow-hidden bg-slate-100 sm:h-44 lg:h-48">
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
    const renderSpecialPromoVideo = ({
        compact = false,
        shouldLoad,
        onLoad,
        ariaLabel,
    }: {
        compact?: boolean;
        shouldLoad: boolean;
        onLoad: () => void;
        ariaLabel: string;
    }) => (
        <div
            className={`group relative overflow-hidden rounded-3xl bg-slate-100 shadow-[0_22px_50px_-28px_rgba(15,23,42,0.65)] ring-1 ring-slate-200 ${
                compact ? 'aspect-[1920/520]' : 'aspect-[1920/1080]'
            }`}
        >
            {shouldLoad && specialPromoVideoUrl ? (
                <video
                    src={specialPromoVideoUrl}
                    poster={specialPromoVideoPosterUrl ?? undefined}
                    className="absolute inset-0 h-full w-full object-cover"
                    controls
                    autoPlay
                    playsInline
                    preload="metadata"
                />
            ) : (
                <>
                    {specialPromoVideoPosterUrl ? (
                        <img
                            src={specialPromoVideoPosterUrl}
                            alt={homeContent.special_promo.video.title}
                            loading="lazy"
                            decoding="async"
                            className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105"
                        />
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-sky-50 text-sky-500">
                            <ImageOff className="h-14 w-14" />
                        </div>
                    )}
                    <button
                        type="button"
                        onClick={onLoad}
                        disabled={!specialPromoVideoUrl}
                        className="absolute inset-0 flex items-center justify-center disabled:cursor-not-allowed"
                        aria-label={ariaLabel}
                    >
                        <span
                            className={`flex items-center justify-center rounded-full bg-white text-slate-900 shadow-2xl ring-1 ring-white/60 transition group-hover:scale-105 ${
                                compact
                                    ? 'h-14 w-14 sm:h-16 sm:w-16'
                                    : 'h-20 w-20 sm:h-24 sm:w-24'
                            }`}
                        >
                            <Play
                                className={`ml-1 fill-current ${
                                    compact
                                        ? 'h-7 w-7 sm:h-8 sm:w-8'
                                        : 'h-9 w-9 sm:h-10 sm:w-10'
                                }`}
                            />
                        </span>
                    </button>
                </>
            )}
        </div>
    );
    const renderSpecialPromoImageSlot = (
        promo: (typeof specialPromoSlots)[number],
        index: number,
        className = '',
    ) =>
        promo ? (
            <Link
                key={promo.id}
                href={promo.href}
                className={`group relative min-h-[132px] overflow-hidden rounded-3xl bg-slate-100 shadow-[0_18px_45px_-28px_rgba(15,23,42,0.6)] ring-1 ring-slate-200 transition hover:-translate-y-1 hover:shadow-[0_20px_55px_-26px_rgba(15,23,42,0.7)] ${className}`}
            >
                <img
                    src={promo.imageUrl ?? ''}
                    alt={promo.title}
                    loading="lazy"
                    decoding="async"
                    className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105"
                />
            </Link>
        ) : (
            <div
                key={`empty-special-promo-${index + 1}`}
                className={`flex min-h-[132px] items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white p-5 text-center text-xs font-semibold text-slate-500 ${className}`}
            >
                Slot gambar promo {index + 1} belum diatur.
            </div>
        );

    return (
        <PublicLayout
            categories={categories}
            chips={[]}
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
                <section
                    id="hero-banner"
                    className="relative left-1/2 mt-0 w-screen -translate-x-1/2 overflow-hidden bg-white"
                >
                    <nav
                        aria-label="Kategori wisata"
                        className="border-y border-slate-100 bg-white"
                    >
                        <div className="flex items-center justify-center gap-2 overflow-x-auto px-4 py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                            {bannerCategoryLabels.map((label) => (
                                <Link
                                    key={label}
                                    href={`/wisata?q=${encodeURIComponent(label)}`}
                                    className="shrink-0 rounded-full bg-slate-100 px-5 py-1.5 text-xs font-bold text-slate-600 transition hover:bg-sky-100 hover:text-sky-700"
                                >
                                    {label}
                                </Link>
                            ))}
                        </div>
                    </nav>

                    {activeBanner ? (
                        <div className="relative overflow-hidden bg-[#f4f6f8] py-7">
                            <div className="relative mx-auto aspect-[1200/450] w-[clamp(20rem,54vw,68rem)]">
                                {visibleBannerSlides.map(
                                    ({ slide, active, offset }) => {
                                        const bannerFrameClass = `absolute top-1/2 left-1/2 block aspect-[1200/450] overflow-hidden rounded-2xl shadow-sm transition duration-500 ease-out ${
                                            active
                                                ? 'z-10'
                                                : 'z-0 opacity-95'
                                        }`;
                                        const bannerFrameStyle =
                                            getBannerSlideStyle(offset);
                                        const bannerImage = (
                                            <img
                                                src={slide.imageUrl}
                                                alt={slide.title}
                                                className="h-full w-full object-cover"
                                                loading={active ? 'eager' : 'lazy'}
                                                decoding="async"
                                            />
                                        );

                                        if (slide.href?.startsWith('http')) {
                                            return (
                                                <a
                                                    key={`${slide.id}-${offset}`}
                                                    href={slide.href}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className={bannerFrameClass}
                                                    style={bannerFrameStyle}
                                                >
                                                    {bannerImage}
                                                </a>
                                            );
                                        }

                                        if (slide.href) {
                                            return (
                                                <Link
                                                    key={`${slide.id}-${offset}`}
                                                    href={slide.href}
                                                    className={bannerFrameClass}
                                                    style={bannerFrameStyle}
                                                >
                                                    {bannerImage}
                                                </Link>
                                            );
                                        }

                                        return (
                                            <div
                                                key={`${slide.id}-${offset}`}
                                                className={bannerFrameClass}
                                                style={bannerFrameStyle}
                                            >
                                                {bannerImage}
                                            </div>
                                        );
                                    },
                                )}
                            </div>

                            {hasMultipleBanners && (
                                <>
                                    <button
                                        type="button"
                                        onClick={() => advanceBanner(-1)}
                                        className="absolute top-1/2 left-3 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white text-xl font-bold text-slate-600 shadow-lg transition hover:bg-sky-50 hover:text-sky-700"
                                        aria-label="Banner sebelumnya"
                                    >
                                        ‹
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => advanceBanner(1)}
                                        className="absolute top-1/2 right-3 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white text-xl font-bold text-slate-600 shadow-lg transition hover:bg-sky-50 hover:text-sky-700"
                                        aria-label="Banner berikutnya"
                                    >
                                        ›
                                    </button>
                                </>
                            )}
                        </div>
                    ) : (
                        <div className="aspect-[1200/450] w-full border-y border-dashed border-slate-200 bg-sky-50" />
                    )}
                </section>

                <section className="mx-auto max-w-6xl space-y-5 px-4 pt-0 sm:px-6 lg:px-8">
                    <h2 className="font-['Space_Grotesk'] text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                        {homeContent.special_promo.title}
                    </h2>

                    <div className="grid items-stretch gap-5 lg:grid-cols-[minmax(0,1.08fr)_minmax(420px,0.92fr)] lg:grid-rows-[auto_auto]">
                        <div className="lg:col-start-1 lg:row-start-1">
                            {renderSpecialPromoVideo({
                                shouldLoad: shouldLoadSpecialPromoVideo,
                                onLoad: () =>
                                    setShouldLoadSpecialPromoVideo(true),
                                ariaLabel: 'Putar video promo spesial',
                            })}
                        </div>

                        <div className="lg:col-start-1 lg:row-start-2">
                            {renderSpecialPromoVideo({
                                compact: true,
                                shouldLoad: shouldLoadCompactSpecialPromoVideo,
                                onLoad: () =>
                                    setShouldLoadCompactSpecialPromoVideo(true),
                                ariaLabel: 'Putar video promo tambahan',
                            })}
                        </div>

                        <div className="grid grid-cols-2 gap-5 lg:col-start-2 lg:row-start-1">
                            {specialPromoSlots
                                .slice(0, 2)
                                .map((promo, index) =>
                                    renderSpecialPromoImageSlot(
                                        promo,
                                        index,
                                        'h-full min-h-[220px] lg:min-h-[240px]',
                                    ),
                                )}
                        </div>

                        <div className="w-full lg:col-start-2 lg:row-start-2">
                            {renderSpecialPromoImageSlot(
                                specialPromoSlots[2],
                                2,
                                'h-full w-full min-h-[150px]',
                            )}
                        </div>
                    </div>
                </section>

                {categorySections.map((section) => (
                    <section
                        key={section.key}
                        className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6 lg:px-8"
                    >
                        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                            <div>
                                <p className="text-xs font-bold tracking-wider text-sky-600 uppercase">
                                    Kategori Wisata
                                </p>
                                <h2 className="mt-2 font-['Space_Grotesk'] text-2xl font-black tracking-tight text-slate-950">
                                    {section.title}
                                </h2>
                                {section.description && (
                                    <p className="mt-1 max-w-2xl text-xs leading-relaxed font-medium text-slate-500 sm:text-sm">
                                        {section.description}
                                    </p>
                                )}
                            </div>

                            {section.href && (
                                <Link
                                    href={section.href}
                                    className="inline-flex items-center gap-1 text-xs font-bold tracking-wider text-sky-600 uppercase hover:text-sky-700"
                                >
                                    Lihat semua
                                    <ChevronRight className="h-4 w-4" />
                                </Link>
                            )}
                        </div>

                        <div
                            className={`${mobileRailClass} md:grid-cols-3 md:gap-6`}
                        >
                            {section.products.map((item) => (
                                <div
                                    key={`${section.key}-${item.id}`}
                                    className={mobileRailItemClass}
                                >
                                    {renderWisataCard(item)}
                                </div>
                            ))}
                        </div>
                    </section>
                ))}

                <section
                    id="featured-destinations-section"
                    className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6 lg:px-8"
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
                            className={`${mobileRailClass} md:grid-cols-3 md:gap-6`}
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

                <section className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
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
                            className={`${mobileRailClass} md:grid-cols-3 md:gap-6`}
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

                <section className="mx-auto max-w-6xl space-y-6 px-4 sm:px-6 lg:px-8">
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
                            className={`${mobileRailClass} md:grid-cols-3 md:gap-6`}
                        >
                            {blogPosts.map((post) => (
                                <div
                                    key={post.id}
                                    className={mobileRailItemClass}
                                >
                                    <Link
                                        href={`/jelajah/${post.slug}`}
                                        className="group block overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl"
                                    >
                                        <div className="relative h-32 overflow-hidden bg-slate-100 sm:h-44 lg:h-48">
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
                                                    <Camera className="h-10 w-10" />
                                                </div>
                                            )}
                                            {post.label && (
                                                <span className="absolute top-3 left-3 rounded-full bg-white/95 px-3 py-1 text-[10px] font-bold text-sky-600 shadow-sm sm:top-4 sm:left-4">
                                                    {post.label}
                                                </span>
                                            )}
                                        </div>

                                        <div className="space-y-2 p-3 sm:p-4">
                                            <span className="inline-flex rounded-full bg-sky-50 px-2.5 py-1 text-[10px] font-bold text-sky-600">
                                                Jelajah
                                            </span>
                                            <h3 className="line-clamp-2 text-sm leading-snug font-bold text-slate-950">
                                                {post.title}
                                            </h3>
                                            <p className="line-clamp-2 text-xs leading-relaxed font-normal text-slate-500">
                                                {post.excerpt ??
                                                    'Cerita dan inspirasi wisata pilihan Indotix'}
                                            </p>

                                            <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
                                                <span className="text-xs font-bold text-sky-600 group-hover:text-sky-700">
                                                    Baca artikel
                                                </span>
                                                <ChevronRight className="h-4 w-4 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-sky-600" />
                                            </div>
                                        </div>
                                    </Link>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
                            Belum ada artikel Jelajah Indotix.
                        </div>
                    )}
                </section>

                {partners.length > 0 && (
                    <div className="mb-10 sm:mb-14">
                        <PublicPartnerSection partners={partners} />
                    </div>
                )}
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
