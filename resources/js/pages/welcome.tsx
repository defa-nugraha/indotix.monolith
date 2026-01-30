import { Head, Link, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
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
type Partner = { id: number; image_path: string; link_url?: string | null; name?: string | null };
type HotelCard = { id: number; encrypted_id?: string; name: string; city_name?: string | null; star_rating?: number | null; min_price?: number | null };
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

export default function Welcome({
    canRegister,
    banners = [],
    promoVideo,
    promoItems = [],
    contact,
    partners = [],
    hotelCards = [],
}: {
    canRegister?: boolean;
    banners?: Banner[];
    promoVideo?: PromoVideo | null;
    promoItems?: PromoItem[];
    contact?: Contact | null;
    partners?: Partner[];
    hotelCards?: HotelCard[];
}) {
    const { auth } = usePage().props as { auth?: { user?: unknown } };
    const isUser = Boolean((auth?.user as any)?.role === 'user');
    const [isReady, setIsReady] = useState(false);
    const [bannerIndex, setBannerIndex] = useState(1);
    const [isBannerTransitioning, setIsBannerTransitioning] = useState(false);
    const bannerSlides =
        banners.length > 0
            ? banners.map((banner) => ({
                  id: banner.id,
                  image: `/storage/${banner.image_path}`,
                  link: banner.link_url ?? null,
              }))
            : [
                  { id: 0, gradient: 'linear-gradient(135deg, #0b3b8f 0%, #1d73d6 55%, #4cc9f0 100%)' },
                  { id: 1, gradient: 'linear-gradient(135deg, #0b7bb8 0%, #0d97c7 50%, #1c5cb6 100%)' },
                  { id: 2, gradient: 'linear-gradient(135deg, #0a4aa8 0%, #0f6edb 50%, #02b3e4 100%)' },
              ];

    const advanceBanner = (delta: number) => {
        if (bannerSlides.length === 0 || isBannerTransitioning) {
            return;
        }
        setIsBannerTransitioning(true);
        window.setTimeout(() => {
            setBannerIndex(
                (prev) => (prev + delta + bannerSlides.length) % bannerSlides.length
            );
            window.setTimeout(() => {
                setIsBannerTransitioning(false);
            }, 180);
        }, 180);
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
    const categories = [
        { label: 'Wisata', icon: MapPinned, active: true, href: '/?tab=wisata' },
        { label: 'Event', icon: CalendarCheck, href: '/?tab=event' },
        { label: 'Souvenir', icon: ShoppingBag, href: '/?tab=souvenir' },
        { label: 'Spesial Program', icon: Star, href: '/?tab=spesial' },
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

    const promoVideoData: PromoVideo = promoVideo ?? {
        title: 'MJS Talent Management',
        description:
            'MJS Talent Management mengelola dan mempromosikan influencer serta talenta berbakat, membuka jalan menuju peluang emas di industri hiburan dan kreatif.',
        cta_label: 'Lihat Selengkapnya',
        cta_url: '#',
    };

    const hotelProducts = hotelCards.length > 0 ? hotelCards : [
        { id: 0, encrypted_id: undefined, name: 'Hotel Indotix', city_name: 'Jakarta', star_rating: 4, min_price: 350000 },
        { id: 1, encrypted_id: undefined, name: 'Indotix Heritage', city_name: 'Bandung', star_rating: 5, min_price: 520000 },
        { id: 2, encrypted_id: undefined, name: 'Indotix City Stay', city_name: 'Surabaya', star_rating: 3, min_price: 280000 },
    ];

    const mediaPartners = partners.length > 0
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

    return (
        <div className="min-h-screen bg-[#f4f6f8] text-slate-900">
            <Head title="Indotix">
                <link
                    href="https://fonts.bunny.net/css?family=plus-jakarta-sans:400,500,600,700|space-grotesk:500,600,700"
                    rel="stylesheet"
                />
            </Head>
            <style>{`
                @keyframes partner-scroll {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
            `}</style>

            <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
                <div className="mx-auto flex w-full max-w-6xl items-center gap-6 px-4 py-4 md:px-8">
                    <div className="flex items-center gap-2">
                        <img src="/logo.png" alt="Indotix" className="h-8" />
                    </div>
                    <div className="flex flex-1 items-center">
                        <input
                            type="text"
                            placeholder="Cari kota/hotel/wisata/event..."
                            className="h-11 w-full rounded-lg border border-slate-200 px-4 text-sm shadow-sm focus:border-sky-400 focus:outline-none"
                        />
                    </div>
                    {!auth?.user && (
                        <div className="flex items-center gap-2">
                            <Link
                                href={canRegister ? '/register' : '#'}
                                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
                            >
                                Register
                            </Link>
                            <Link
                                href="/login"
                                className="rounded-lg border border-blue-600 px-4 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-50"
                            >
                                Login
                            </Link>
                        </div>
                    )}
                    {isUser && (
                        <div className="flex items-center gap-4 text-sm font-semibold text-slate-600">
                            <Link href="/settings/profile" className="flex items-center gap-2 hover:text-sky-600">
                                <UserCircle className="h-4 w-4" />
                                Profile
                            </Link>
                            <Link href="/history" className="flex items-center gap-2 hover:text-sky-600">
                                <History className="h-4 w-4" />
                                Riwayat
                            </Link>
                            <Link href="/?tab=chat" className="flex items-center gap-2 hover:text-sky-600">
                                <MessageCircle className="h-4 w-4" />
                                Chat
                            </Link>
                            <Link href="/?tab=notifikasi" className="flex items-center gap-2 hover:text-sky-600">
                                <Bell className="h-4 w-4" />
                                Notifikasi
                            </Link>
                        </div>
                    )}
                </div>
                <div className="border-t border-slate-100">
                    <div className="mx-auto flex w-full max-w-6xl items-center gap-6 px-4 py-3 md:px-8">
                        {categories.map((item) => (
                            <Link
                                key={item.label}
                                href={item.href}
                                className={`flex items-center gap-2 text-sm font-semibold ${
                                    item.active ? 'text-slate-900' : 'text-slate-500'
                                }`}
                            >
                                <item.icon className="h-4 w-4" />
                                {item.label}
                            </Link>
                        ))}
                    </div>
                </div>
                <div className="border-t border-slate-100">
                    <div className="mx-auto flex w-full max-w-6xl flex-wrap gap-2 px-4 py-3 md:px-8">
                        {chips.map((chip) => (
                            <span
                                key={chip}
                                className="rounded-full bg-slate-100 px-4 py-1 text-xs font-medium text-slate-600"
                            >
                                {chip}
                            </span>
                        ))}
                    </div>
                </div>
            </header>

            <main className="mx-auto w-full max-w-6xl px-4 py-8 md:px-8">
                {!isReady && (
                    <section className="space-y-8">
                        <div className="grid w-full gap-6 md:grid-cols-[1fr_2.4fr_1fr]">
                            {[0, 1, 2].map((idx) => (
                                <Skeleton key={idx} className="h-56 w-full rounded-2xl" />
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
                                <div className="mt-6 grid gap-4 md:grid-cols-2">
                                    {[0, 1].map((idx) => (
                                        <Skeleton key={idx} className="h-64 w-full rounded-2xl" />
                                    ))}
                                </div>
                                <Skeleton className="mt-4 h-48 w-full rounded-2xl" />
                            </div>
                        </div>
                        <div className="rounded-2xl bg-white p-6 shadow-sm">
                            <Skeleton className="h-6 w-48" />
                            <div className="mt-6 grid gap-6 md:grid-cols-3">
                                {[0, 1, 2].map((idx) => (
                                    <Skeleton key={idx} className="h-56 w-full rounded-2xl" />
                                ))}
                            </div>
                        </div>
                        <div className="rounded-2xl bg-white p-6 shadow-sm">
                            <Skeleton className="h-6 w-48" />
                            <div className="mt-6 grid gap-4 md:grid-cols-6">
                                {Array.from({ length: 6 }).map((_, idx) => (
                                    <Skeleton key={idx} className="h-20 w-full rounded-xl" />
                                ))}
                            </div>
                        </div>
                    </section>
                )}

                {isReady && (
                <>
                <section className="relative left-1/2 right-1/2 mb-8 w-screen -translate-x-1/2 px-4 md:px-8">
                    <div className="relative flex items-center gap-6">
                        <button
                            type="button"
                            onClick={() => advanceBanner(-1)}
                            className="absolute left-2 z-10 h-10 w-10 -translate-x-1/2 rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm"
                            aria-label="Banner sebelumnya"
                        >
                            ‹
                        </button>

                        <div className="grid w-full gap-6 md:grid-cols-[1fr_2.4fr_1fr]">
                            {[bannerIndex - 1, bannerIndex, bannerIndex + 1].map((offset, idx) => {
                                const safeIndex =
                                    (offset + bannerSlides.length) % bannerSlides.length;
                                const slide = bannerSlides[safeIndex];
                                const content = (
                                    <div
                                        className={`h-44 w-full transition-opacity duration-300 md:h-56 ${
                                            isBannerTransitioning ? 'opacity-0' : 'opacity-100'
                                        }`}
                                        style={{
                                            backgroundImage: slide.image
                                                ? `url(${slide.image})`
                                                : slide.gradient,
                                            backgroundSize: 'cover',
                                            backgroundPosition: 'center',
                                        }}
                                    />
                                );
                                return (
                                    <div
                                        key={`${slide.id}-${idx}`}
                                        className="overflow-hidden rounded-2xl bg-white shadow-sm"
                                    >
                                        {slide.link ? (
                                            <a href={slide.link} className="block">
                                                {content}
                                            </a>
                                        ) : (
                                            content
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        <button
                            type="button"
                            onClick={() => advanceBanner(1)}
                            className="absolute right-2 z-10 h-10 w-10 translate-x-1/2 rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm"
                            aria-label="Banner berikutnya"
                        >
                            ›
                        </button>
                    </div>
                </section>

                <section className="mt-8 grid gap-8 md:grid-cols-[1.1fr_1fr]">
                    <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
                        {promoVideoData.image_path ? (
                            <video
                                src={`/storage/${promoVideoData.image_path}`}
                                className="h-64 w-full rounded-t-2xl bg-[#0b3b8f] object-cover"
                                autoPlay
                                muted
                                loop
                                playsInline
                            />
                        ) : (
                            <div className="h-64 w-full rounded-t-2xl bg-[#0b3b8f]" />
                        )}
                        <div className="p-6">
                            <h3 className="text-lg font-semibold text-slate-900">
                                {promoVideoData.title}
                            </h3>
                            <p className="mt-2 text-sm text-slate-600">
                                {promoVideoData.description}
                            </p>
                            <a
                                href={promoVideoData.cta_url ?? '#'}
                                className="mt-4 inline-block rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white"
                            >
                                {promoVideoData.cta_label ?? 'Lihat Selengkapnya'}
                            </a>
                            <div className="mt-6 overflow-hidden rounded-2xl bg-white shadow-sm">
                                {promoVideoData.secondary_video_path ? (
                                    <video
                                        src={`/storage/${promoVideoData.secondary_video_path}`}
                                        className="h-32 w-full bg-slate-100 object-cover"
                                        autoPlay
                                        muted
                                        loop
                                        playsInline
                                    />
                                ) : (
                                    <div className="h-32 w-full bg-slate-100" />
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl bg-white p-6 shadow-sm">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-semibold text-slate-900">
                                Promo Terkini
                            </h2>
                            <div className="flex gap-2">
                                <button className="h-9 w-9 rounded-full border border-slate-200">‹</button>
                                <button className="h-9 w-9 rounded-full border border-slate-200">›</button>
                            </div>
                        </div>
                        <div className="mt-6 grid gap-4 md:grid-cols-2">
                            {(promoItems[0] ? [promoItems[0]] : []).map((item) => (
                                <div key={item.id} className="overflow-hidden rounded-2xl shadow-sm">
                                    <a href={item.link_url ?? '#'} className="block">
                                        <div
                                            className="h-64 w-full"
                                            style={{
                                                backgroundImage: `url(/storage/${item.image_path})`,
                                                backgroundSize: 'cover',
                                                backgroundPosition: 'center',
                                            }}
                                        />
                                    </a>
                                </div>
                            ))}
                            {(promoItems[1] ? [promoItems[1]] : []).map((item) => (
                                <div key={item.id} className="overflow-hidden rounded-2xl shadow-sm">
                                    <a href={item.link_url ?? '#'} className="block">
                                        <div
                                            className="h-64 w-full"
                                            style={{
                                                backgroundImage: `url(/storage/${item.image_path})`,
                                                backgroundSize: 'cover',
                                                backgroundPosition: 'center',
                                            }}
                                        />
                                    </a>
                                </div>
                            ))}
                        </div>
                        <div className="mt-4 grid gap-4">
                            {(promoItems[2] ? [promoItems[2]] : []).map((item) => (
                                <div key={item.id} className="overflow-hidden rounded-2xl shadow-sm">
                                    <a href={item.link_url ?? '#'} className="block">
                                        <div
                                            className="h-48 w-full"
                                            style={{
                                                backgroundImage: `url(/storage/${item.image_path})`,
                                                backgroundSize: 'cover',
                                                backgroundPosition: 'center',
                                            }}
                                        />
                                    </a>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="mt-10 rounded-2xl bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold text-slate-900">
                            Produk Hotel
                        </h2>
                        <Link href="/stay" className="text-sm font-semibold text-sky-600">
                            Lihat Semua Hotel →
                        </Link>
                    </div>
                    <div className="mt-6 grid gap-6 md:grid-cols-3">
                        {hotelProducts.map((hotel) => (
                            <div key={hotel.id} className="overflow-hidden rounded-2xl border border-slate-100 shadow-sm">
                                <div className="h-40 bg-gradient-to-br from-blue-700 to-sky-400" />
                                <div className="p-4">
                                    <h3 className="text-sm font-semibold text-slate-900">
                                        {hotel.name}
                                    </h3>
                                    <p className="text-xs text-slate-500">
                                        {hotel.city_name ?? 'Indonesia'}
                                    </p>
                                    <div className="mt-3 text-xs text-slate-400">
                                        {hotel.star_rating ? `${hotel.star_rating}★` : 'Hotel'}
                                    </div>
                                    <div className="text-sm font-semibold text-sky-600">
                                        {hotel.min_price ? `Mulai Rp ${hotel.min_price.toLocaleString('id-ID')}` : 'Harga tersedia'}
                                    </div>
                                    {hotel.encrypted_id ? (
                                        <Link
                                            href={`/stay/hotels/${hotel.encrypted_id}?check_in=${defaultCheckIn}&check_out=${defaultCheckOut}&rooms=1&guests=2`}
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
                        <h2 className="text-xl font-semibold text-slate-900">Partner Kami</h2>
                    </div>
                    <div className="mt-6 overflow-hidden">
                        <div className="flex w-max animate-[partner-scroll_28s_linear_infinite] gap-4">
                            {[...mediaPartners, ...mediaPartners].map((item, idx) => (
                                <div
                                    key={`${item.id}-${idx}`}
                                    className="flex h-24 w-40 items-center justify-center rounded-2xl border border-slate-100 bg-white shadow-sm"
                                >
                                    {item.image_path ? (
                                        <a href={item.link_url ?? '#'} className="flex h-full w-full items-center justify-center">
                                            <img
                                                src={`/storage/${item.image_path}`}
                                                alt={item.name ?? 'Partner'}
                                                className="h-14 w-24 object-contain"
                                            />
                                        </a>
                                    ) : (
                                        <div className="h-14 w-24 rounded-md bg-slate-200" />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
                </>
                )}
            </main>

            <footer className="mt-10 border-t border-slate-200 bg-white">
                <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-10 md:grid-cols-4 md:px-8">
                    <div>
                        <img src="/logo.png" alt="Indotix" className="h-8" />
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
                        <h4 className="text-sm font-semibold text-slate-900">Layanan</h4>
                        <ul className="mt-3 space-y-2 text-sm text-slate-600">
                            <li>Wisata</li>
                            <li>Special Program</li>
                            <li>Event</li>
                            <li>Hotel</li>
                            <li>Souvenir</li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-sm font-semibold text-slate-900">Perusahaan</h4>
                        <ul className="mt-3 space-y-2 text-sm text-slate-600">
                            <li>Tentang Kami</li>
                            <li>Karir</li>
                            <li>Blog</li>
                            <li>Kebijakan Privasi</li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-sm font-semibold text-slate-900">Download Indotix</h4>
                        <a
                            href={contact?.download_url ?? '#'}
                            className="mt-3 inline-block h-12 w-40 rounded-lg bg-slate-900"
                        />
                        <h4 className="mt-6 text-sm font-semibold text-slate-900">Ikuti Kami</h4>
                        <div className="mt-3 flex gap-2">
                            <a href={contact?.facebook_url ?? '#'} className="h-9 w-9 rounded-full bg-slate-200" />
                            <a href={contact?.instagram_url ?? '#'} className="h-9 w-9 rounded-full bg-slate-200" />
                            <a href={contact?.twitter_url ?? '#'} className="h-9 w-9 rounded-full bg-slate-200" />
                            <a href={contact?.tiktok_url ?? '#'} className="h-9 w-9 rounded-full bg-slate-200" />
                            <a href={contact?.youtube_url ?? '#'} className="h-9 w-9 rounded-full bg-slate-200" />
                        </div>
                    </div>
                </div>
                <div className="border-t border-slate-200 py-4 text-center text-xs text-slate-500">
                    © 2025 Indotix. All rights reserved.
                </div>
            </footer>
        </div>
    );
}
