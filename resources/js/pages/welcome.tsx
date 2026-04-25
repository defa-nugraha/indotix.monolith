import { Head, Link, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { FooterDownloadSocial } from '@/components/footer-download-social';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import PublicLayout from '@/layouts/public-layout';
import SaleCountdown from '@/components/sale-countdown';
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
    BookOpen,
    BadgePercent,
} from 'lucide-react';

type Banner = { id: number; image_path: string; link_url?: string | null };
type PromoVideo = {
    title: string;
    description?: string | null;
    image_path?: string | null;
    secondary_video_path?: string | null;
    cta_label?: string | null;
    cta_url?: string | null;
};
type PromoItem = { id: number; image_path: string; link_url?: string | null };
type Partner = {
    id: number;
    image_path: string;
    link_url?: string | null;
    name?: string | null;
};
type HotelCard = {
    id: number;
    encrypted_id?: string;
    slug?: string | null;
    name: string;
    city_name?: string | null;
    star_rating?: number | null;
    min_price?: number | null;
    image_url?: string | null;
};
type WisataCard = {
    id: number;
    encrypted_id?: string;
    slug?: string | null;
    name: string;
    city_name?: string | null;
    min_price?: number | null;
    image_url?: string | null;
    type?: string | null;
};
type EventCard = {
    id: number;
    encrypted_id?: string;
    slug?: string | null;
    title: string;
    city_name?: string | null;
    start_at?: string | null;
    min_price?: number | null;
};
type AcademyCard = {
    id: number;
    encrypted_id?: string;
    slug?: string | null;
    title: string;
    category?: string | null;
    start_at?: string | null;
    min_price?: number | null;
    image_url?: string | null;
    sales_start_at?: string | null;
    sales_end_at?: string | null;
};
type SpecialProgramItem = {
    type: 'special_program';
    id: number;
    encrypted_id?: string;
    slug?: string | null;
    name: string;
    category?: string | null;
    image_url?: string | null;
    price?: number | null;
};
type SouvenirCard = {
    id: number;
    encrypted_id?: string;
    slug?: string | null;
    name: string;
    price?: number | null;
    image_url?: string | null;
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

const MOBILE_DOWNLOAD_PROMPT_KEY = 'indotix_mobile_download_prompt_dismissed';

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
    canRegister,
    banners = [],
    promoVideo,
    promoItems = [],
    contact,
    partners = [],
    hotelCards = [],
    specialProgramItems = [],
    wisataCards = [],
    eventCards = [],
    academyCards = [],
    souvenirCards = [],
    blogPosts = [],
}: {
    canRegister?: boolean;
    banners?: Banner[];
    promoVideo?: PromoVideo | null;
    promoItems?: PromoItem[];
    contact?: Contact | null;
    partners?: Partner[];
    hotelCards?: HotelCard[];
    specialProgramItems?: SpecialProgramItem[];
    wisataCards?: WisataCard[];
    eventCards?: EventCard[];
    academyCards?: AcademyCard[];
    souvenirCards?: SouvenirCard[];
    blogPosts?: BlogPost[];
}) {
    const { auth, unread_notifications, souvenir_cart_count, affiliate_menu } =
        usePage().props as {
            auth?: { user?: unknown };
            unread_notifications?: number;
            souvenir_cart_count?: number;
            affiliate_menu?: boolean;
        };
    const isUser = Boolean((auth?.user as any)?.role === 'user');
    const [isReady, setIsReady] = useState(false);
    const [bannerIndex, setBannerIndex] = useState(1);
    const [isBannerTransitioning, setIsBannerTransitioning] = useState(false);
    const [bannerDirection, setBannerDirection] = useState<'next' | 'prev'>(
        'next',
    );
    const [pendingBannerIndex, setPendingBannerIndex] = useState<number | null>(
        null,
    );
    const [showMobileDownloadPrompt, setShowMobileDownloadPrompt] =
        useState(false);
    const bannerSlides =
        banners.length > 0
            ? banners.map((banner) => ({
                  id: banner.id,
                  image: `/storage/${banner.image_path}`,
                  link: banner.link_url ?? null,
              }))
            : [
                  {
                      id: 0,
                      gradient:
                          'linear-gradient(135deg, #0b3b8f 0%, #1d73d6 55%, #4cc9f0 100%)',
                  },
                  {
                      id: 1,
                      gradient:
                          'linear-gradient(135deg, #0b7bb8 0%, #0d97c7 50%, #1c5cb6 100%)',
                  },
                  {
                      id: 2,
                      gradient:
                          'linear-gradient(135deg, #0a4aa8 0%, #0f6edb 50%, #02b3e4 100%)',
                  },
              ];
    const totalBannerSlides = bannerSlides.length;
    const hasMultipleBanners = totalBannerSlides > 1;
    const currentBannerIndex =
        totalBannerSlides === 0
            ? 0
            : (bannerIndex + totalBannerSlides) % totalBannerSlides;
    const bannerSlots = hasMultipleBanners
        ? [
              { offset: -1, className: 'hidden md:block' },
              { offset: 0, className: '' },
              { offset: 1, className: 'hidden md:block' },
          ]
        : [{ offset: 0, className: '' }];

    const advanceBanner = (delta: number) => {
        if (bannerSlides.length === 0 || isBannerTransitioning) {
            return;
        }
        const nextIndex =
            (bannerIndex + delta + bannerSlides.length) % bannerSlides.length;
        if (nextIndex === bannerIndex) {
            return;
        }
        setBannerDirection(delta >= 0 ? 'next' : 'prev');
        setPendingBannerIndex(nextIndex);
        setIsBannerTransitioning(true);
        window.setTimeout(() => {
            setBannerIndex(nextIndex);
            setPendingBannerIndex(null);
            setIsBannerTransitioning(false);
        }, 450);
    };

    useEffect(() => {
        const timer = window.setTimeout(() => setIsReady(true), 350);
        return () => window.clearTimeout(timer);
    }, []);

    useEffect(() => {
        const interval = window.setInterval(() => {
            advanceBanner(1);
        }, 3000);

        return () => window.clearInterval(interval);
    }, [bannerSlides.length, isBannerTransitioning]);

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
    const categories = [
        { label: 'Wisata', icon: MapPinned, active: true, href: '/wisata' },
        { label: 'Event', icon: CalendarCheck, href: '/events' },
        { label: 'Retail Shop', icon: ShoppingBag, href: '/retail-shop' },
        { label: 'Spesial Program', icon: Star, href: '/special-programs' },
        { label: 'Academy', icon: BookOpen, href: '/academy' },
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

    const formatRupiah = (value: number | string | null | undefined) => {
        const numeric = Number(value);
        if (!Number.isFinite(numeric) || numeric <= 0) return null;
        return `Rp ${numeric.toLocaleString('id-ID')}`;
    };

    const promoVideoData: PromoVideo = promoVideo ?? {
        title: 'MJS Talent Management',
        description:
            'MJS Talent Management mengelola dan mempromosikan influencer serta talenta berbakat, membuka jalan menuju peluang emas di industri hiburan dan kreatif.',
        cta_label: 'Lihat Selengkapnya',
        cta_url: '#',
    };

    const hotelProducts =
        hotelCards.length > 0
            ? hotelCards
            : [
                  {
                      id: 0,
                      encrypted_id: undefined,
                      name: 'Hotel Indotix',
                      city_name: 'Jakarta',
                      star_rating: 4,
                      min_price: 350000,
                  },
                  {
                      id: 1,
                      encrypted_id: undefined,
                      name: 'Indotix Heritage',
                      city_name: 'Bandung',
                      star_rating: 5,
                      min_price: 520000,
                  },
                  {
                      id: 2,
                      encrypted_id: undefined,
                      name: 'Indotix City Stay',
                      city_name: 'Surabaya',
                      star_rating: 3,
                      min_price: 280000,
                  },
              ];
    const wisataProducts =
        wisataCards.length > 0
            ? wisataCards
            : [
                  {
                      id: 0,
                      encrypted_id: undefined,
                      name: 'Wisata Pantai Ceria',
                      city_name: 'Bali',
                      min_price: 25000,
                      type: 'alam',
                  },
                  {
                      id: 1,
                      encrypted_id: undefined,
                      name: 'Desa Wisata Lestari',
                      city_name: 'Yogyakarta',
                      min_price: 15000,
                      type: 'budaya',
                  },
                  {
                      id: 2,
                      encrypted_id: undefined,
                      name: 'Taman Edukasi Indotix',
                      city_name: 'Bogor',
                      min_price: 20000,
                      type: 'edukasi',
                  },
              ];
    const eventProducts =
        eventCards.length > 0
            ? eventCards
            : [
                  {
                      id: 0,
                      encrypted_id: undefined,
                      title: 'Festival Musik Nusantara',
                      city_name: 'Jakarta',
                      start_at: '2026-03-01',
                      min_price: 250000,
                  },
                  {
                      id: 1,
                      encrypted_id: undefined,
                      title: 'Indotix Creative Fair',
                      city_name: 'Bandung',
                      start_at: '2026-03-15',
                      min_price: 150000,
                  },
                  {
                      id: 2,
                      encrypted_id: undefined,
                      title: 'Seminar Digital Tourism',
                      city_name: 'Surabaya',
                      start_at: '2026-04-05',
                      min_price: 100000,
                  },
              ];
    const academyProducts =
        academyCards.length > 0
            ? academyCards
            : [
                  {
                      id: 0,
                      encrypted_id: undefined,
                      title: 'Hospitality Bootcamp',
                      category: 'Hospitality',
                      start_at: '2026-03-10',
                      min_price: 350000,
                      sales_end_at: null,
                  },
                  {
                      id: 1,
                      encrypted_id: undefined,
                      title: 'Event Production Masterclass',
                      category: 'Event',
                      start_at: '2026-03-20',
                      min_price: 400000,
                      sales_end_at: null,
                  },
                  {
                      id: 2,
                      encrypted_id: undefined,
                      title: 'Digital Marketing for Tourism',
                      category: 'Marketing',
                      start_at: '2026-04-02',
                      min_price: 250000,
                      sales_end_at: null,
                  },
              ];
    const specialProgramProducts =
        specialProgramItems.length > 0
            ? specialProgramItems
            : [
                  {
                      id: 0,
                      encrypted_id: undefined,
                      name: 'Promo Liburan Sekolah',
                      category: 'travel',
                      price: 120000,
                      type: 'special_program',
                  },
                  {
                      id: 1,
                      encrypted_id: undefined,
                      name: 'Flash Sale Festival',
                      category: 'meeting',
                      price: 180000,
                      type: 'special_program',
                  },
                  {
                      id: 2,
                      encrypted_id: undefined,
                      name: 'Hemat Akhir Pekan',
                      category: 'wedding',
                      price: 350000,
                      type: 'special_program',
                  },
              ];
    const souvenirProducts =
        souvenirCards.length > 0
            ? souvenirCards
            : [
                  {
                      id: 0,
                      encrypted_id: undefined,
                      name: 'Gantungan Kunci Nusantara',
                      price: 25000,
                  },
                  {
                      id: 1,
                      encrypted_id: undefined,
                      name: 'Tas Anyaman Bali',
                      price: 175000,
                  },
                  {
                      id: 2,
                      encrypted_id: undefined,
                      name: 'Patung Kayu Mini',
                      price: 90000,
                  },
                  {
                      id: 3,
                      encrypted_id: undefined,
                      name: 'Kopi Gayo Premium 250g',
                      price: 78000,
                  },
              ];

    const mediaPartners =
        partners.length > 0
            ? partners
            : new Array(6).fill(0).map((_, idx) => ({
                  id: idx,
                  image_path: '',
                  link_url: null,
                  name: null,
              }));
    const addressText =
        contact?.address ??
        'Neo Soho Capital 40th Floor\\nJl. Tanjung Duren Raya No 1\\nJakarta Barat, DKI Jakarta 11470';
    const addressLines = addressText.split('\\n');
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    const formatDate = (value: Date) => value.toISOString().slice(0, 10);
    const defaultCheckIn = formatDate(today);
    const defaultCheckOut = formatDate(tomorrow);
    const downloadAppUrl = contact?.download_url?.trim() || '#';

    return (
        <PublicLayout categories={categories} chips={chips}>
            <Head title="Indotix">
                <link
                    href="https://fonts.bunny.net/css?family=plus-jakarta-sans:400,500,600,700|space-grotesk:500,600,700"
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
                            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/80">
                                Download Aplikasi
                            </p>
                            <DialogHeader className="mt-2 text-left">
                                <DialogTitle className="text-xl font-bold leading-tight text-white">
                                    Buka pengalaman yang lebih praktis di aplikasi
                                    Indotix
                                </DialogTitle>
                                <DialogDescription className="text-sm leading-6 text-white/85">
                                    Booking tiket, cek pesanan, dan pantau update
                                    terbaru langsung dari ponselmu.
                                </DialogDescription>
                            </DialogHeader>
                        </div>
                        <div className="space-y-4 bg-white px-6 py-5">
                            <a
                                href={downloadAppUrl}
                                target="_blank"
                                rel="noreferrer"
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
            <style>{`
                @keyframes partner-scroll {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }

                @keyframes banner-enter-right {
                    0% { transform: translateX(100%); opacity: 0.8; }
                    100% { transform: translateX(0); opacity: 1; }
                }

                @keyframes banner-exit-left {
                    0% { transform: translateX(0); opacity: 1; }
                    100% { transform: translateX(-100%); opacity: 0.8; }
                }

                @keyframes banner-enter-left {
                    0% { transform: translateX(-100%); opacity: 0.8; }
                    100% { transform: translateX(0); opacity: 1; }
                }

                @keyframes banner-exit-right {
                    0% { transform: translateX(0); opacity: 1; }
                    100% { transform: translateX(100%); opacity: 0.8; }
                }

                .banner-enter-right {
                    animation: banner-enter-right 0.45s ease-out both;
                }

                .banner-exit-left {
                    animation: banner-exit-left 0.45s ease-out both;
                }

                .banner-enter-left {
                    animation: banner-enter-left 0.45s ease-out both;
                }

                .banner-exit-right {
                    animation: banner-exit-right 0.45s ease-out both;
                }
            `}</style>

            <main className="mx-auto w-full max-w-6xl px-4 py-8 md:px-8">
                {!isReady && (
                    <section className="space-y-8">
                        <div className="grid w-full items-start gap-6 md:grid-cols-[1fr_2.4fr_1fr]">
                            {[0, 1, 2].map((idx) => (
                                <Skeleton
                                    key={idx}
                                    className={
                                        idx === 1
                                            ? 'h-[150px] w-full rounded-2xl md:h-56'
                                            : 'hidden h-56 w-full rounded-2xl md:block'
                                    }
                                />
                            ))}
                        </div>
                        <div className="grid gap-8 md:grid-cols-[1.1fr_1fr]">
                            <div className="rounded-2xl bg-white p-6 shadow-sm">
                                <Skeleton className="h-6 w-40" />
                                <Skeleton className="mt-6 h-64 w-full rounded-xl" />
                                <Skeleton className="mt-6 h-4 w-3/4" />
                                <Skeleton className="mt-2 h-4 w-2/3" />
                                <Skeleton className="mt-6 h-10 w-40 rounded-lg" />
                            </div>
                            <div className="rounded-2xl bg-white p-6 shadow-sm">
                                <Skeleton className="h-6 w-40" />
                                <div className="mt-6 grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-2">
                                    {[0, 1].map((idx) => (
                                        <Skeleton
                                            key={idx}
                                            className="h-64 w-full rounded-2xl"
                                        />
                                    ))}
                                </div>
                                <Skeleton className="mt-4 h-48 w-full rounded-2xl" />
                            </div>
                        </div>
                        <div className="rounded-2xl bg-white p-6 shadow-sm">
                            <Skeleton className="h-6 w-48" />
                            <div className="mt-6 grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3">
                                {[0, 1, 2].map((idx) => (
                                    <Skeleton
                                        key={idx}
                                        className="h-56 w-full rounded-2xl"
                                    />
                                ))}
                            </div>
                        </div>
                        <div className="rounded-2xl bg-white p-6 shadow-sm">
                            <Skeleton className="h-6 w-48" />
                            <div className="mt-6 grid gap-4 md:grid-cols-6">
                                {Array.from({ length: 6 }).map((_, idx) => (
                                    <Skeleton
                                        key={idx}
                                        className="h-20 w-full rounded-xl"
                                    />
                                ))}
                            </div>
                        </div>
                    </section>
                )}

                {isReady && (
                    <>
                        <section className="relative right-1/2 left-1/2 mb-8 w-screen -translate-x-1/2 px-4 md:px-8">
                            <div className="relative flex items-center gap-6">
                                {hasMultipleBanners && (
                                    <button
                                        type="button"
                                        onClick={() => advanceBanner(-1)}
                                        className="absolute left-2 z-10 h-10 w-10 -translate-x-1/2 rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm"
                                        aria-label="Banner sebelumnya"
                                    >
                                        ‹
                                    </button>
                                )}

                                <div className="grid w-full items-stretch gap-6 md:grid-cols-[1fr_2.4fr_1fr]">
                                    {bannerSlots.map((slot, idx) => {
                                        const slotIndex =
                                            (currentBannerIndex +
                                                slot.offset +
                                                totalBannerSlides) %
                                            totalBannerSlides;
                                        const pendingSlotIndex =
                                            pendingBannerIndex !== null
                                                ? (pendingBannerIndex +
                                                      slot.offset +
                                                      totalBannerSlides) %
                                                  totalBannerSlides
                                                : null;
                                        const slide = bannerSlides[slotIndex];
                                        const incomingSlide =
                                            isBannerTransitioning &&
                                            pendingSlotIndex !== null
                                                ? bannerSlides[pendingSlotIndex]
                                                : null;
                                        const activeSlide =
                                            incomingSlide ?? slide;
                                        const isMainBanner =
                                            slot.className === '';
                                        const isSideBanner = !isMainBanner;
                                        const outgoingClass =
                                            isBannerTransitioning
                                                ? bannerDirection === 'next'
                                                    ? 'banner-exit-left'
                                                    : 'banner-exit-right'
                                                : '';
                                        const incomingClass =
                                            bannerDirection === 'next'
                                                ? 'banner-enter-right'
                                                : 'banner-enter-left';
                                        const content = (
                                            <div
                                                className={`relative w-full overflow-hidden ${
                                                    isMainBanner
                                                        ? 'aspect-[842/236]'
                                                        : 'h-full'
                                                }`}
                                            >
                                                <div
                                                    className={`absolute inset-0 ${outgoingClass}`}
                                                    style={{
                                                        backgroundImage:
                                                            slide.image
                                                                ? `url(${slide.image})`
                                                                : slide.gradient,
                                                        backgroundSize:
                                                            isMainBanner
                                                                ? 'contain'
                                                                : 'cover',
                                                        backgroundPosition:
                                                            'center',
                                                        backgroundRepeat:
                                                            'no-repeat',
                                                    }}
                                                />
                                                {incomingSlide && (
                                                    <div
                                                        className={`absolute inset-0 ${incomingClass}`}
                                                        style={{
                                                            backgroundImage:
                                                                incomingSlide.image
                                                                    ? `url(${incomingSlide.image})`
                                                                    : incomingSlide.gradient,
                                                            backgroundSize:
                                                                isMainBanner
                                                                    ? 'contain'
                                                                    : 'cover',
                                                            backgroundPosition:
                                                                'center',
                                                            backgroundRepeat:
                                                                'no-repeat',
                                                        }}
                                                    />
                                                )}
                                                {isSideBanner && (
                                                    <div className="absolute inset-0 bg-slate-900/20" />
                                                )}
                                            </div>
                                        );
                                        return (
                                            <div
                                                key={`${slide.id}-${idx}`}
                                                className={`overflow-hidden rounded-2xl bg-white shadow-sm ${
                                                    isMainBanner
                                                        ? 'mx-auto w-full max-w-[842px]'
                                                        : 'h-full'
                                                } ${slot.className}`}
                                            >
                                                {activeSlide.link ? (
                                                    <a
                                                        href={activeSlide.link}
                                                        className="block h-full"
                                                    >
                                                        {content}
                                                    </a>
                                                ) : (
                                                    content
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>

                                {hasMultipleBanners && (
                                    <button
                                        type="button"
                                        onClick={() => advanceBanner(1)}
                                        className="absolute right-2 z-10 h-10 w-10 translate-x-1/2 rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm"
                                        aria-label="Banner berikutnya"
                                    >
                                        ›
                                    </button>
                                )}
                            </div>
                        </section>

                        <section className="mt-8 grid gap-8 md:grid-cols-[1.1fr_1fr] md:items-start">
                            <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
                                <div className="flex gap-4 overflow-x-auto p-4 md:grid md:overflow-visible">
                                    <div className="min-w-[85vw] overflow-hidden rounded-2xl bg-slate-100 md:min-w-0">
                                        {promoVideoData.image_path ? (
                                            <video
                                                src={`/storage/${promoVideoData.image_path}`}
                                                className="aspect-video w-full bg-white object-contain"
                                                autoPlay
                                                muted
                                                loop
                                                playsInline
                                            />
                                        ) : (
                                            <div className="aspect-video w-full bg-white" />
                                        )}
                                    </div>
                                    <div className="min-w-[85vw] overflow-hidden rounded-2xl bg-slate-100 md:min-w-0">
                                        {promoVideoData.secondary_video_path ? (
                                            <video
                                                src={`/storage/${promoVideoData.secondary_video_path}`}
                                                className="aspect-video w-full bg-white object-contain"
                                                autoPlay
                                                muted
                                                loop
                                                playsInline
                                            />
                                        ) : (
                                            <div className="aspect-video w-full bg-white" />
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="self-start rounded-2xl bg-white p-6 shadow-sm">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-xl font-semibold text-slate-900">
                                        Promo Terkini
                                    </h2>
                                </div>
                                <div className="mt-6 grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-2">
                                    {(promoItems[0] ? [promoItems[0]] : []).map(
                                        (item) => (
                                            <div
                                                key={item.id}
                                                className="overflow-hidden rounded-2xl shadow-sm"
                                            >
                                                <a
                                                    href={item.link_url ?? '#'}
                                                    className="block"
                                                >
                                                    <div
                                                        className="aspect-[3/4] w-full"
                                                        style={{
                                                            backgroundImage: `url(/storage/${item.image_path})`,
                                                            backgroundSize:
                                                                'cover',
                                                            backgroundPosition:
                                                                'center',
                                                        }}
                                                    />
                                                </a>
                                            </div>
                                        ),
                                    )}
                                    {(promoItems[1] ? [promoItems[1]] : []).map(
                                        (item) => (
                                            <div
                                                key={item.id}
                                                className="overflow-hidden rounded-2xl shadow-sm"
                                            >
                                                <a
                                                    href={item.link_url ?? '#'}
                                                    className="block"
                                                >
                                                    <div
                                                        className="aspect-[3/4] w-full"
                                                        style={{
                                                            backgroundImage: `url(/storage/${item.image_path})`,
                                                            backgroundSize:
                                                                'cover',
                                                            backgroundPosition:
                                                                'center',
                                                        }}
                                                    />
                                                </a>
                                            </div>
                                        ),
                                    )}
                                </div>
                                <div className="mt-4 grid gap-4">
                                    {(promoItems[2] ? [promoItems[2]] : []).map(
                                        (item) => (
                                            <div
                                                key={item.id}
                                                className="overflow-hidden rounded-2xl shadow-sm"
                                            >
                                                <a
                                                    href={item.link_url ?? '#'}
                                                    className="block"
                                                >
                                                    <div
                                                        className="aspect-[3/1] w-full"
                                                        style={{
                                                            backgroundImage: `url(/storage/${item.image_path})`,
                                                            backgroundSize:
                                                                'cover',
                                                            backgroundPosition:
                                                                'center',
                                                        }}
                                                    />
                                                </a>
                                            </div>
                                        ),
                                    )}
                                </div>
                            </div>
                        </section>

                        <section className="mt-10 rounded-2xl bg-white p-6 shadow-sm">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-xl font-semibold text-slate-900">
                                        Special program pilihan, lebih hemat{' '}
                                        <span className="text-sky-600">
                                            #SpecialDeal
                                        </span>
                                    </h2>
                                    <p className="text-sm text-slate-500">
                                        Diskon, subsidi, dan highlight terbaik
                                        untuk kamu.
                                    </p>
                                </div>
                                <Link
                                    href="/special-programs"
                                    className="text-sm font-semibold text-sky-600"
                                >
                                    Lihat Semua Special Program →
                                </Link>
                            </div>
                            <div className="mt-6 grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3">
                                {specialProgramProducts.map((item) => {
                                    const detailSlug =
                                        item.slug ?? item.encrypted_id;
                                    const link = `/special-programs/${detailSlug}`;
                                    return (
                                        <div
                                            key={`${item.type}-${item.id}`}
                                            className="overflow-hidden rounded-2xl border border-slate-100 shadow-sm"
                                        >
                                            <div className="h-40 overflow-hidden bg-gradient-to-br from-sky-600 to-blue-400">
                                                <img
                                                    src={
                                                        item.image_url ??
                                                        '/images/placeholder-card.jpg'
                                                    }
                                                    alt={item.name}
                                                    className="h-full w-full object-cover"
                                                />
                                            </div>
                                            <div className="p-4">
                                                <div className="mb-2 inline-flex items-center rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
                                                    {item.category ??
                                                        'Special Program'}
                                                </div>
                                                <h3 className="text-sm font-semibold text-slate-900">
                                                    {item.name}
                                                </h3>
                                                <p className="text-xs text-slate-500">
                                                    {item.category ??
                                                        'Indonesia'}
                                                </p>
                                                <div className="text-sm font-semibold text-sky-600">
                                                    {formatRupiah(item.price)
                                                        ? `Mulai ${formatRupiah(item.price)}`
                                                        : 'Harga tersedia'}
                                                </div>
                                                {detailSlug ? (
                                                    <Link
                                                        href={link}
                                                        className="mt-4 inline-block w-full rounded-lg bg-sky-600 px-4 py-2 text-center text-xs font-semibold text-white"
                                                    >
                                                        Lihat Detail
                                                    </Link>
                                                ) : (
                                                    <span className="mt-4 inline-block w-full rounded-lg bg-slate-200 px-4 py-2 text-center text-xs font-semibold text-slate-500">
                                                        Lihat Detail
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>

                        <section className="mt-10 rounded-2xl bg-white p-6 shadow-sm">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-semibold text-slate-900">
                                    Staycation nyaman, recharge maksimal{' '}
                                    <span className="text-sky-600">
                                        #StaycationGoals
                                    </span>
                                </h2>
                                <Link
                                    href="/stay"
                                    className="text-sm font-semibold text-sky-600"
                                >
                                    Lihat Semua Hotel →
                                </Link>
                            </div>
                            <div className="mt-6 grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3">
                                {hotelProducts.map((hotel) => (
                                    <div
                                        key={hotel.id}
                                        className="overflow-hidden rounded-2xl border border-slate-100 shadow-sm"
                                    >
                                        <div className="h-40 overflow-hidden bg-gradient-to-br from-blue-700 to-sky-400">
                                            <img
                                                src={
                                                    hotel.image_url ??
                                                    '/images/placeholder-card.jpg'
                                                }
                                                alt={hotel.name}
                                                className="h-full w-full object-cover"
                                            />
                                        </div>
                                        <div className="p-4">
                                            <h3 className="text-sm font-semibold text-slate-900">
                                                {hotel.name}
                                            </h3>
                                            <p className="text-xs text-slate-500">
                                                {hotel.city_name ?? 'Indonesia'}
                                            </p>
                                            <div className="mt-3 flex items-center gap-1">
                                                {Array.from({
                                                    length: Math.max(
                                                        0,
                                                        Math.round(
                                                            hotel.star_rating ??
                                                                0,
                                                        ),
                                                    ),
                                                }).map((_, idx) => (
                                                    <Star
                                                        key={`${hotel.id}-star-${idx}`}
                                                        className="h-4 w-4 fill-yellow-400 text-yellow-400"
                                                    />
                                                ))}
                                                {(!hotel.star_rating ||
                                                    hotel.star_rating <= 0) && (
                                                    <span className="text-xs text-slate-400">
                                                        Hotel
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-sm font-semibold text-sky-600">
                                                {formatRupiah(hotel.min_price)
                                                    ? `Mulai ${formatRupiah(hotel.min_price)}`
                                                    : 'Harga tersedia'}
                                            </div>
                                            {hotel.slug ||
                                            hotel.encrypted_id ? (
                                                <Link
                                                    href={`/stay/hotels/${hotel.slug ?? hotel.encrypted_id}?check_in=${defaultCheckIn}&check_out=${defaultCheckOut}&rooms=1&guests=2`}
                                                    className="mt-4 inline-block w-full rounded-lg bg-sky-600 px-4 py-2 text-center text-xs font-semibold text-white"
                                                >
                                                    Lihat Detail
                                                </Link>
                                            ) : (
                                                <span className="mt-4 inline-block w-full rounded-lg bg-slate-200 px-4 py-2 text-center text-xs font-semibold text-slate-500">
                                                    Lihat Detail
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        <section className="mt-10 rounded-2xl bg-white p-6 shadow-sm">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-xl font-semibold text-slate-900">
                                        Event seru, momen tak terlupa{' '}
                                        <span className="text-sky-600">
                                            #EventWeekend
                                        </span>
                                    </h2>
                                    <p className="text-sm text-slate-500">
                                        Temukan event seru yang siap kamu
                                        datangi.
                                    </p>
                                </div>
                                <Link
                                    href="/events"
                                    className="text-sm font-semibold text-sky-600"
                                >
                                    Lihat Semua Event →
                                </Link>
                            </div>
                            <div className="mt-6 grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3">
                                {eventProducts.map((event) => (
                                    <div
                                        key={event.id}
                                        className="overflow-hidden rounded-2xl border border-slate-100 shadow-sm"
                                    >
                                        <div className="h-40 overflow-hidden bg-gradient-to-br from-indigo-600 to-sky-500">
                                            <img
                                                src="/images/placeholder-card.jpg"
                                                alt={event.title}
                                                className="h-full w-full object-cover"
                                            />
                                        </div>
                                        <div className="p-4">
                                            <h3 className="text-sm font-semibold text-slate-900">
                                                {event.title}
                                            </h3>
                                            <p className="text-xs text-slate-500">
                                                {event.city_name ?? 'Indonesia'}{' '}
                                                ·{' '}
                                                {event.start_at ??
                                                    'Jadwal segera'}
                                            </p>
                                            <div className="text-sm font-semibold text-indigo-600">
                                                {formatRupiah(event.min_price)
                                                    ? `Mulai ${formatRupiah(event.min_price)}`
                                                    : 'Harga tersedia'}
                                            </div>
                                            {event.slug ||
                                            event.encrypted_id ? (
                                                <Link
                                                    href={`/events/${event.slug ?? event.encrypted_id}`}
                                                    className="mt-4 inline-block w-full rounded-lg bg-sky-600 px-4 py-2 text-center text-xs font-semibold text-white"
                                                >
                                                    Lihat Detail
                                                </Link>
                                            ) : (
                                                <span className="mt-4 inline-block w-full rounded-lg bg-slate-200 px-4 py-2 text-center text-xs font-semibold text-slate-500">
                                                    Lihat Detail
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        <section className="mt-10 rounded-2xl bg-white p-6 shadow-sm">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-xl font-semibold text-slate-900">
                                        Upgrade skill bareng Academy{' '}
                                        <span className="text-sky-600">
                                            #LevelUp
                                        </span>
                                    </h2>
                                    <p className="text-sm text-slate-500">
                                        Kelas praktis untuk boost karier dan
                                        bisnis kamu.
                                    </p>
                                </div>
                                <Link
                                    href="/academy"
                                    className="text-sm font-semibold text-sky-600"
                                >
                                    Lihat Semua Academy →
                                </Link>
                            </div>
                            <div className="mt-6 grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3">
                                {academyProducts.map((item) => (
                                    <div
                                        key={item.id}
                                        className="overflow-hidden rounded-2xl border border-slate-100 shadow-sm"
                                    >
                                        <div className="relative h-40 overflow-hidden bg-gradient-to-br from-sky-500 to-indigo-600">
                                            <img
                                                src={
                                                    item.image_url ??
                                                    '/images/placeholder-card.jpg'
                                                }
                                                alt={item.title}
                                                className="h-full w-full object-cover"
                                            />
                                            {(() => {
                                                const now = new Date();
                                                const endAt = item.sales_end_at
                                                    ? new Date(
                                                          item.sales_end_at.replace(
                                                              ' ',
                                                              'T',
                                                          ),
                                                      )
                                                    : null;
                                                const startAt =
                                                    item.sales_start_at
                                                        ? new Date(
                                                              item.sales_start_at.replace(
                                                                  ' ',
                                                                  'T',
                                                              ),
                                                          )
                                                        : null;
                                                const target =
                                                    endAt && endAt > now
                                                        ? {
                                                              label: 'Berakhir',
                                                              value: item.sales_end_at,
                                                          }
                                                        : startAt &&
                                                            startAt > now
                                                          ? {
                                                                label: 'Dibuka',
                                                                value: item.sales_start_at,
                                                            }
                                                          : null;
                                                return target ? (
                                                    <div className="absolute top-3 right-3">
                                                        <SaleCountdown
                                                            target={
                                                                target.value
                                                            }
                                                            label={target.label}
                                                            compact
                                                        />
                                                    </div>
                                                ) : null;
                                            })()}
                                        </div>
                                        <div className="p-4">
                                            <h3 className="text-sm font-semibold text-slate-900">
                                                {item.title}
                                            </h3>
                                            <p className="text-xs text-slate-500">
                                                {item.category ?? 'Academy'} ·{' '}
                                                {item.start_at ??
                                                    'Jadwal segera'}
                                            </p>
                                            <div className="text-sm font-semibold text-indigo-600">
                                                {formatRupiah(item.min_price)
                                                    ? `Mulai ${formatRupiah(item.min_price)}`
                                                    : 'Harga tersedia'}
                                            </div>
                                            {item.slug || item.encrypted_id ? (
                                                <Link
                                                    href={`/academy/${item.slug ?? item.encrypted_id}`}
                                                    className="mt-4 inline-block w-full rounded-lg bg-sky-600 px-4 py-2 text-center text-xs font-semibold text-white"
                                                >
                                                    Lihat Detail
                                                </Link>
                                            ) : (
                                                <span className="mt-4 inline-block w-full rounded-lg bg-slate-200 px-4 py-2 text-center text-xs font-semibold text-slate-500">
                                                    Lihat Detail
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        <section className="mt-10 rounded-2xl bg-white p-6 shadow-sm">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-xl font-semibold text-slate-900">
                                        Piknik asyik, cerita baru{' '}
                                        <span className="text-sky-600">
                                            #HealingTrip
                                        </span>
                                    </h2>
                                    <p className="text-sm text-slate-500">
                                        Cari tiket wisata dengan suasana yang
                                        paling kamu suka.
                                    </p>
                                </div>
                                <Link
                                    href="/wisata"
                                    className="text-sm font-semibold text-sky-600"
                                >
                                    Lihat Semua Wisata →
                                </Link>
                            </div>
                            <div className="mt-6 grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3">
                                {wisataProducts.map((item) => (
                                    <div
                                        key={item.id}
                                        className="overflow-hidden rounded-2xl border border-slate-100 shadow-sm"
                                    >
                                        <div className="h-40 overflow-hidden bg-gradient-to-br from-emerald-500 to-sky-400">
                                            <img
                                                src={
                                                    item.image_url ??
                                                    '/images/placeholder-card.jpg'
                                                }
                                                alt={item.name}
                                                className="h-full w-full object-cover"
                                            />
                                        </div>
                                        <div className="p-4">
                                            <h3 className="text-sm font-semibold text-slate-900">
                                                {item.name}
                                            </h3>
                                            <p className="text-xs text-slate-500">
                                                {item.city_name ?? 'Indonesia'}{' '}
                                                · {item.type ?? 'wisata'}
                                            </p>
                                            <div className="text-sm font-semibold text-emerald-600">
                                                {formatRupiah(item.min_price)
                                                    ? `Mulai ${formatRupiah(item.min_price)}`
                                                    : 'Harga tersedia'}
                                            </div>
                                            {item.slug || item.encrypted_id ? (
                                                <Link
                                                    href={`/wisata/${item.slug ?? item.encrypted_id}`}
                                                    className="mt-4 inline-block w-full rounded-lg bg-sky-600 px-4 py-2 text-center text-xs font-semibold text-white"
                                                >
                                                    Lihat Detail
                                                </Link>
                                            ) : (
                                                <span className="mt-4 inline-block w-full rounded-lg bg-slate-200 px-4 py-2 text-center text-xs font-semibold text-slate-500">
                                                    Lihat Detail
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        <section className="mt-10 rounded-2xl bg-white p-6 shadow-sm">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-xl font-semibold text-slate-900">
                                        Produk retail pilihan, siap dikirim
                                        cepat{' '}
                                        <span className="text-sky-600">
                                            #RetailShopReady
                                        </span>
                                    </h2>
                                    <p className="text-sm text-slate-500">
                                        Temukan gadget, kebutuhan perjalanan,
                                        dan produk lifestyle dari mitra
                                        terpercaya.
                                    </p>
                                </div>
                                <Link
                                    href="/retail-shop"
                                    className="text-sm font-semibold text-sky-600"
                                >
                                    Lihat Semua Retail Shop →
                                </Link>
                            </div>
                            <div className="mt-6 grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-4">
                                {souvenirProducts.map((item) => {
                                    const detailSlug =
                                        item.slug ?? item.encrypted_id ?? '';
                                    return (
                                        <div
                                            key={item.id}
                                            className="overflow-hidden rounded-2xl border border-slate-100 shadow-sm"
                                        >
                                            <div className="h-40 overflow-hidden bg-gradient-to-br from-amber-500 to-orange-400">
                                                <img
                                                    src={
                                                        item.image_url ??
                                                        '/images/placeholder-card.jpg'
                                                    }
                                                    alt={item.name}
                                                    className="h-full w-full object-cover"
                                                />
                                            </div>
                                            <div className="p-4">
                                                <h3 className="text-sm font-semibold text-slate-900">
                                                    {item.name}
                                                </h3>
                                                <div className="text-sm font-semibold text-amber-600">
                                                    {formatRupiah(item.price) ??
                                                        'Harga tersedia'}
                                                </div>
                                                {detailSlug ? (
                                                    <Link
                                                        href={`/retail-shop/${detailSlug}`}
                                                        className="mt-4 inline-block w-full rounded-lg bg-sky-600 px-4 py-2 text-center text-xs font-semibold text-white"
                                                    >
                                                        Lihat Detail
                                                    </Link>
                                                ) : (
                                                    <span className="mt-4 inline-block w-full rounded-lg bg-slate-200 px-4 py-2 text-center text-xs font-semibold text-slate-500">
                                                        Lihat Detail
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>

                        <section className="mt-10 rounded-2xl bg-white p-6 shadow-sm">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-xl font-semibold text-slate-900">
                                        Jelajah Indotix
                                    </h2>
                                    <p className="text-sm text-slate-500">
                                        Inspirasi perjalanan terbaru dari tim
                                        kami.
                                    </p>
                                </div>
                                <Link
                                    href="/jelajah"
                                    className="text-sm font-semibold text-sky-600"
                                >
                                    Lihat Semua →
                                </Link>
                            </div>
                            <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                                {blogPosts.map((post) => (
                                    <div
                                        key={post.id}
                                        className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm"
                                    >
                                        <div className="h-32 bg-slate-100">
                                            {post.cover_image_url ? (
                                                <img
                                                    src={post.cover_image_url}
                                                    alt={post.title}
                                                    className="h-full w-full object-cover"
                                                />
                                            ) : (
                                                <div className="h-full w-full bg-gradient-to-br from-sky-200 to-sky-50" />
                                            )}
                                        </div>
                                        <div className="p-4">
                                            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                                                {post.label && (
                                                    <span className="rounded-full bg-sky-50 px-2 py-0.5 text-sky-600">
                                                        {post.label}
                                                    </span>
                                                )}
                                                {post.published_at && (
                                                    <span>
                                                        {post.published_at}
                                                    </span>
                                                )}
                                            </div>
                                            <h3 className="mt-2 text-sm font-semibold text-slate-900">
                                                {post.title}
                                            </h3>
                                            {post.excerpt && (
                                                <p className="mt-2 line-clamp-2 text-xs text-slate-500">
                                                    {post.excerpt}
                                                </p>
                                            )}
                                            <Link
                                                href={`/jelajah/${post.slug}`}
                                                className="mt-3 inline-flex text-xs font-semibold text-sky-600"
                                            >
                                                Baca Selengkapnya →
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                                {blogPosts.length === 0 && (
                                    <div className="col-span-full rounded-2xl border border-slate-100 p-6 text-center text-sm text-slate-500">
                                        Belum ada artikel terbaru.
                                    </div>
                                )}
                            </div>
                        </section>

                        <section className="mt-10 rounded-2xl bg-white p-6 shadow-sm">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-semibold text-slate-900">
                                    Partner Kami
                                </h2>
                            </div>
                            <div className="mt-6 overflow-hidden">
                                <div className="flex w-max animate-[partner-scroll_28s_linear_infinite] gap-4">
                                    {[...mediaPartners, ...mediaPartners].map(
                                        (item, idx) => (
                                            <div
                                                key={`${item.id}-${idx}`}
                                                className="flex h-24 w-40 items-center justify-center rounded-2xl border border-slate-100 bg-white shadow-sm"
                                            >
                                                {item.image_path ? (
                                                    <a
                                                        href={
                                                            item.link_url ?? '#'
                                                        }
                                                        className="flex h-full w-full items-center justify-center"
                                                    >
                                                        <img
                                                            src={`/storage/${item.image_path}`}
                                                            alt={
                                                                item.name ??
                                                                'Partner'
                                                            }
                                                            className="h-14 w-24 object-contain"
                                                        />
                                                    </a>
                                                ) : (
                                                    <div className="h-14 w-24 rounded-md bg-slate-200" />
                                                )}
                                            </div>
                                        ),
                                    )}
                                </div>
                            </div>
                        </section>
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
