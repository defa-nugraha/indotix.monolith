import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { format } from 'date-fns';
import {
    CalendarCheck,
    Cigarette,
    CigaretteOff,
    Coffee,
    Dumbbell,
    MapPinned,
    ParkingSquare,
    ShieldCheck,
    ShoppingBag,
    Star,
    Ticket,
    Utensils,
    Users,
    Waves,
    Wifi,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { DateRange } from 'react-date-range';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';
import { FooterDownloadSocial } from '@/components/footer-download-social';
import { ProductDescription } from '@/components/product-description';
import { PublicSeo } from '@/components/public-seo';
import ReviewSection from '@/components/reviews/review-section';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import PublicLayout from '@/layouts/public-layout';
import { guardPurchaseByRole } from '@/lib/purchase-guard';

type Hotel = {
    id: number;
    encrypted_id: string;
    slug?: string | null;
    name: string;
    description?: string | null;
    address?: string | null;
    city_name?: string | null;
    star_rating?: number | null;
    check_in_time?: string | null;
    check_out_time?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    facilities?: string[];
    images?: { id: number; url: string }[];
};

type RoomType = {
    id: number;
    name: string;
    description?: string | null;
    max_guest?: number | null;
    bed_type?: string | null;
    base_price?: number | null;
    strike_price?: number | null;
    available_rooms?: number | null;
    total_price?: number | null;
    images?: { id: number; url: string }[];
    breakfast_included?: boolean;
    smoking_allowed?: boolean;
};

type Filters = {
    check_in: string;
    check_out: string;
    rooms: number;
    guests: number;
    children?: number;
};

type ReviewItem = {
    id: number;
    rating: number;
    comment?: string | null;
    user_name: string;
    created_at?: string | null;
    reply?: string | null;
    reply_by?: string | null;
    reply_at?: string | null;
};

type UserReview = {
    id: number;
    rating: number;
    comment?: string | null;
    created_at?: string | null;
};

export default function HotelShow({
    hotel,
    roomTypes,
    filters,
    reviews,
    userReview,
    canReview,
}: {
    hotel: Hotel;
    roomTypes: RoomType[];
    filters: Filters;
    reviews: ReviewItem[];
    userReview?: UserReview | null;
    canReview?: boolean;
}) {
    const { auth } = usePage().props as {
        auth?: { user?: { role?: string } };
    };
    const role = auth?.user?.role;
    const [isReady, setIsReady] = useState(false);
    const initialChildren = Math.max(0, filters.children ?? 0);
    const form = useForm({
        hotel_id: hotel.id,
        room_type_id: '',
        check_in: filters.check_in,
        check_out: filters.check_out,
        rooms: filters.rooms,
        guests: filters.guests,
        children: initialChildren,
        children_ages: [] as number[],
    });
    const reviewCount = reviews.length;
    const averageRating =
        reviewCount > 0
            ? reviews.reduce((sum, review) => sum + review.rating, 0) /
              reviewCount
            : 0;
    const scoreOutOfTen = averageRating > 0 ? averageRating * 2 : 0;
    const ratingText = scoreOutOfTen
        ? scoreOutOfTen.toLocaleString('id-ID', {
              minimumFractionDigits: 1,
              maximumFractionDigits: 1,
          })
        : '-';
    const ratingLabel =
        scoreOutOfTen >= 9
            ? 'Istimewa'
            : scoreOutOfTen >= 8
              ? 'Sangat Baik'
              : scoreOutOfTen >= 7
                ? 'Baik'
                : scoreOutOfTen >= 6
                  ? 'Cukup'
                  : reviewCount > 0
                    ? 'Perlu perbaikan'
                    : 'Belum ada ulasan';
    const ratingCaption =
        reviewCount > 0 ? `${reviewCount} ulasan` : 'Belum ada ulasan';
    const [guestOpen, setGuestOpen] = useState(false);
    const [dateOpen, setDateOpen] = useState(false);
    const [galleryOpen, setGalleryOpen] = useState(false);
    const [adults, setAdults] = useState(
        Math.max(1, Math.max((filters.guests ?? 1) - initialChildren, 1)),
    );
    const [children, setChildren] = useState(initialChildren);
    const [rooms, setRooms] = useState(filters.rooms ?? 1);
    const guestRef = useRef<HTMLDivElement | null>(null);
    const dateRef = useRef<HTMLDivElement | null>(null);
    const [initialDates] = useState(() => {
        const start = filters.check_in
            ? new Date(filters.check_in)
            : new Date();
        const end = filters.check_out
            ? new Date(filters.check_out)
            : new Date(start.getTime() + 86400000);

        return { start, end };
    });
    const [range, setRange] = useState([
        {
            startDate: initialDates.start,
            endDate: initialDates.end,
            key: 'selection',
        },
    ]);

    useEffect(() => {
        form.setData('guests', adults + children);
    }, [adults, children]);

    useEffect(() => {
        form.setData('children', children);
    }, [children]);

    useEffect(() => {
        form.setData('rooms', rooms);
    }, [rooms]);

    useEffect(() => {
        const timer = window.setTimeout(() => setIsReady(true), 350);
        return () => window.clearTimeout(timer);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                guestRef.current &&
                !guestRef.current.contains(event.target as Node)
            ) {
                setGuestOpen(false);
            }
            if (
                dateRef.current &&
                !dateRef.current.contains(event.target as Node)
            ) {
                setDateOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () =>
            document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const nightCount = (() => {
        const start = range[0].startDate;
        const end = range[0].endDate;
        if (!start || !end) return null;
        const diff = Math.max(
            0,
            Math.round(
                (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
            ),
        );
        return diff > 0 ? diff : null;
    })();

    const categories = [
        { label: 'Wisata', icon: MapPinned, href: '/wisata' },
        { label: 'Event', icon: CalendarCheck, href: '/events' },
        { label: 'Retail Shop', icon: ShoppingBag, href: '/retail-shop' },
        { label: 'Spesial Program', icon: Star, href: '/special-programs' },
        { label: 'Hotel', icon: Ticket, href: '/stay', active: true },
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

    const hotelImages = (hotel.images ?? [])
        .map((image) => image.url)
        .filter(Boolean) as string[];
    const fallbackRoomImages = roomTypes
        .flatMap((room) => room.images ?? [])
        .map((image) => image.url)
        .filter(Boolean) as string[];
    const galleryImages =
        hotelImages.length > 0 ? hotelImages : fallbackRoomImages;
    const previewGalleryImages = galleryImages.slice(1, 4);

    return (
        <PublicLayout categories={categories} chips={chips}>
            <PublicSeo
                title={`${hotel.name} - Hotel di Indotix`}
                description={hotel.description ?? hotel.address}
                image={galleryImages[0]}
                canonicalPath={`/stay/hotels/${hotel.slug ?? hotel.encrypted_id}`}
                type="product"
                structuredData={{
                    '@context': 'https://schema.org',
                    '@type': 'Hotel',
                    name: hotel.name,
                    description: hotel.description,
                    image: galleryImages,
                    address: hotel.address,
                    starRating: hotel.star_rating
                        ? {
                              '@type': 'Rating',
                              ratingValue: hotel.star_rating,
                          }
                        : undefined,
                }}
            />
            <Head>
                <link
                    href="https://fonts.bunny.net/css?family=plus-jakarta-sans:400,500,600,700|space-grotesk:500,600,700"
                    rel="stylesheet"
                />
            </Head>
            <div className="mx-auto w-full max-w-6xl px-4 py-8 md:px-8">
                {!isReady && (
                    <section className="space-y-6">
                        <Skeleton className="h-28 w-full rounded-2xl" />
                        <Skeleton className="h-64 w-full rounded-2xl" />
                        <div className="grid gap-6 md:grid-cols-3">
                            {[0, 1, 2].map((idx) => (
                                <Skeleton
                                    key={idx}
                                    className="h-40 w-full rounded-2xl"
                                />
                            ))}
                        </div>
                    </section>
                )}

                {isReady && (
                    <>
                        <section className="relative mb-6 rounded-[28px] bg-white p-6 shadow-sm">
                            <div className="rounded-[24px] bg-white">
                                <form
                                    action="/stay"
                                    method="get"
                                    className="grid gap-4 md:grid-cols-[2fr_2fr_1.5fr_auto]"
                                >
                                    <div className="grid gap-2">
                                        <label className="text-xs font-semibold text-slate-500 uppercase">
                                            Kota, destinasi, atau nama hotel
                                        </label>
                                        <div className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm">
                                            <span className="text-slate-400">
                                                📍
                                            </span>
                                            <input
                                                name="q"
                                                className="w-full bg-transparent outline-none"
                                                placeholder="Kota, hotel, atau tempat tujuan"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid gap-2">
                                        <label className="text-xs font-semibold text-slate-500 uppercase">
                                            Tanggal Check-in & Check-out
                                        </label>
                                        <div className="relative" ref={dateRef}>
                                            <button
                                                type="button"
                                                className={`flex w-full items-center gap-2 rounded-xl border px-4 py-3 text-sm ${dateOpen ? 'border-lime-500' : 'border-slate-200'}`}
                                                onClick={() =>
                                                    setDateOpen((prev) => !prev)
                                                }
                                            >
                                                <span className="text-slate-400">
                                                    📅
                                                </span>
                                                <span className="text-left">
                                                    {format(
                                                        range[0].startDate ??
                                                            new Date(),
                                                        'EEE, dd MMM yyyy',
                                                    )}{' '}
                                                    -{' '}
                                                    {format(
                                                        range[0].endDate ??
                                                            new Date(),
                                                        'EEE, dd MMM yyyy',
                                                    )}
                                                </span>
                                            </button>
                                            {dateOpen && (
                                                <div className="absolute right-0 z-50 mt-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-lg">
                                                    <DateRange
                                                        ranges={range}
                                                        onChange={(item: {
                                                            selection: {
                                                                startDate?: Date;
                                                                endDate?: Date;
                                                                key?: string;
                                                            };
                                                        }) => {
                                                            const start =
                                                                item.selection
                                                                    .startDate ??
                                                                new Date();
                                                            const end =
                                                                item.selection
                                                                    .endDate ??
                                                                new Date();
                                                            const selection = {
                                                                startDate:
                                                                    start,
                                                                endDate: end,
                                                                key:
                                                                    item
                                                                        .selection
                                                                        .key ??
                                                                    'selection',
                                                            };
                                                            setRange([
                                                                selection,
                                                            ]);
                                                            form.setData(
                                                                'check_in',
                                                                format(
                                                                    start,
                                                                    'yyyy-MM-dd',
                                                                ),
                                                            );
                                                            form.setData(
                                                                'check_out',
                                                                format(
                                                                    end,
                                                                    'yyyy-MM-dd',
                                                                ),
                                                            );
                                                        }}
                                                        months={1}
                                                        direction="horizontal"
                                                        minDate={new Date()}
                                                        rangeColors={[
                                                            '#0ea5e9',
                                                        ]}
                                                    />
                                                </div>
                                            )}
                                            <input
                                                type="hidden"
                                                name="check_in"
                                                value={format(
                                                    range[0].startDate ??
                                                        new Date(),
                                                    'yyyy-MM-dd',
                                                )}
                                            />
                                            <input
                                                type="hidden"
                                                name="check_out"
                                                value={format(
                                                    range[0].endDate ??
                                                        new Date(),
                                                    'yyyy-MM-dd',
                                                )}
                                            />
                                        </div>
                                        <div className="text-[11px] text-slate-400">
                                            Durasi:{' '}
                                            {nightCount
                                                ? `${nightCount} malam`
                                                : '-'}
                                        </div>
                                    </div>
                                    <div
                                        className="relative grid gap-2"
                                        ref={guestRef}
                                    >
                                        <label className="text-xs font-semibold text-slate-500 uppercase">
                                            Tamu dan Kamar
                                        </label>
                                        <button
                                            type="button"
                                            className="flex w-full items-center justify-between rounded-xl border border-slate-200 px-4 py-3 text-sm"
                                            onClick={() =>
                                                setGuestOpen((prev) => !prev)
                                            }
                                        >
                                            <span className="text-slate-400">
                                                👥
                                            </span>
                                            <span className="flex-1 pl-2 text-left">
                                                {adults} Dewasa, {children}{' '}
                                                Anak, {rooms} Kamar
                                            </span>
                                            <span className="h-8 w-8 rounded-full bg-sky-100 text-sky-700">
                                                ▾
                                            </span>
                                        </button>
                                        {guestOpen && (
                                            <div className="absolute right-0 z-50 mt-2 w-[320px] rounded-2xl border border-slate-200 bg-white p-4 shadow-lg">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm font-semibold text-slate-700">
                                                        Dewasa
                                                    </span>
                                                    <div className="flex items-center gap-3">
                                                        <button
                                                            type="button"
                                                            className="h-8 w-8 rounded-full bg-slate-100"
                                                            onClick={() =>
                                                                setAdults(
                                                                    (prev) =>
                                                                        Math.max(
                                                                            1,
                                                                            prev -
                                                                                1,
                                                                        ),
                                                                )
                                                            }
                                                        >
                                                            −
                                                        </button>
                                                        <span className="w-6 text-center text-sm font-semibold">
                                                            {adults}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            className="h-8 w-8 rounded-full bg-sky-100 text-sky-700"
                                                            onClick={() =>
                                                                setAdults(
                                                                    (prev) =>
                                                                        prev +
                                                                        1,
                                                                )
                                                            }
                                                        >
                                                            +
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="mt-3 flex items-center justify-between">
                                                    <span className="text-sm font-semibold text-slate-700">
                                                        Anak
                                                    </span>
                                                    <div className="flex items-center gap-3">
                                                        <button
                                                            type="button"
                                                            className="h-8 w-8 rounded-full bg-slate-100"
                                                            onClick={() =>
                                                                setChildren(
                                                                    (prev) =>
                                                                        Math.max(
                                                                            0,
                                                                            prev -
                                                                                1,
                                                                        ),
                                                                )
                                                            }
                                                        >
                                                            −
                                                        </button>
                                                        <span className="w-6 text-center text-sm font-semibold">
                                                            {children}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            className="h-8 w-8 rounded-full bg-sky-100 text-sky-700"
                                                            onClick={() =>
                                                                setChildren(
                                                                    (prev) =>
                                                                        prev +
                                                                        1,
                                                                )
                                                            }
                                                        >
                                                            +
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="mt-3 flex items-center justify-between">
                                                    <span className="text-sm font-semibold text-slate-700">
                                                        Kamar
                                                    </span>
                                                    <div className="flex items-center gap-3">
                                                        <button
                                                            type="button"
                                                            className="h-8 w-8 rounded-full bg-slate-100"
                                                            onClick={() =>
                                                                setRooms(
                                                                    (prev) =>
                                                                        Math.max(
                                                                            1,
                                                                            prev -
                                                                                1,
                                                                        ),
                                                                )
                                                            }
                                                        >
                                                            −
                                                        </button>
                                                        <span className="w-6 text-center text-sm font-semibold">
                                                            {rooms}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            className="h-8 w-8 rounded-full bg-sky-100 text-sky-700"
                                                            onClick={() =>
                                                                setRooms(
                                                                    (prev) =>
                                                                        prev +
                                                                        1,
                                                                )
                                                            }
                                                        >
                                                            +
                                                        </button>
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    className="mt-4 w-full rounded-lg bg-sky-600 py-2 text-sm font-semibold text-white"
                                                    onClick={() =>
                                                        setGuestOpen(false)
                                                    }
                                                >
                                                    Selesai
                                                </button>
                                            </div>
                                        )}
                                        <input
                                            type="hidden"
                                            name="rooms"
                                            value={rooms}
                                        />
                                        <input
                                            type="hidden"
                                            name="guests"
                                            value={adults + children}
                                        />
                                        <input
                                            type="hidden"
                                            name="children"
                                            value={children}
                                        />
                                    </div>
                                    <button className="h-12 rounded-full bg-sky-600 px-8 text-sm font-semibold text-white shadow-md">
                                        Cari
                                    </button>
                                </form>
                            </div>
                        </section>

                        <div className="overflow-hidden rounded-2xl bg-white p-3 shadow-sm sm:p-4">
                            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4 text-xs text-slate-500">
                                <div className="flex flex-wrap gap-2">
                                    <span className="text-sky-600">Hotel</span>/
                                    <span>Indonesia</span>/
                                    <span>{hotel.city_name ?? 'Kota'}</span>/
                                    <span className="text-slate-700">
                                        {hotel.name}
                                    </span>
                                </div>
                            </div>

                            <div className="mt-4 grid gap-4 md:grid-cols-[1.45fr_1fr]">
                                <div className="grid gap-3">
                                    {galleryImages.length > 0 ? (
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setGalleryOpen(true)
                                            }
                                            className="block aspect-[16/9] max-h-[420px] min-h-48 w-full overflow-hidden rounded-xl bg-slate-100 text-left sm:min-h-56"
                                        >
                                            <img
                                                src={galleryImages[0]}
                                                alt={hotel.name}
                                                className="h-full w-full object-cover"
                                            />
                                        </button>
                                    ) : (
                                        <div className="aspect-[16/9] min-h-48 rounded-xl bg-slate-100 sm:min-h-56" />
                                    )}
                                </div>
                                <div className="grid grid-cols-3 gap-2 sm:grid-cols-2 sm:gap-3">
                                    {previewGalleryImages.map((image, idx) => {
                                        const isLastPreview =
                                            idx ===
                                            previewGalleryImages.length - 1;
                                        const shouldShowGalleryOverlay =
                                            isLastPreview &&
                                            galleryImages.length > 1;

                                        return (
                                            <button
                                                type="button"
                                                key={`${image}-${idx}`}
                                                onClick={() =>
                                                    setGalleryOpen(true)
                                                }
                                                className="relative h-24 overflow-hidden rounded-xl bg-slate-100 text-left sm:h-32"
                                            >
                                                <img
                                                    src={image}
                                                    alt={`Foto ${idx + 2}`}
                                                    className={`h-full w-full object-cover ${
                                                        shouldShowGalleryOverlay
                                                            ? 'opacity-45'
                                                            : ''
                                                    }`}
                                                />
                                                {shouldShowGalleryOverlay && (
                                                    <span className="absolute inset-0 flex items-center justify-center bg-slate-950/35 px-2 text-center text-xs font-semibold text-white sm:text-sm">
                                                        Lihat semua gambar
                                                    </span>
                                                )}
                                            </button>
                                        );
                                    })}
                                    {previewGalleryImages.length === 0 && (
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setGalleryOpen(true)
                                            }
                                            className="col-span-3 h-24 rounded-xl bg-slate-100 text-xs font-semibold text-slate-500 sm:col-span-2 sm:h-32"
                                        >
                                            Lihat semua gambar
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="mt-6 flex flex-col gap-4 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                                <div className="min-w-0">
                                    <h1 className="text-2xl font-semibold text-slate-900">
                                        {hotel.name}
                                    </h1>
                                    <p className="text-sm text-slate-500">
                                        {hotel.city_name} · {hotel.address}
                                    </p>
                                    <div className="mt-2 text-lg text-yellow-500">
                                        {hotel.star_rating
                                            ? '★'.repeat(hotel.star_rating)
                                        : 'Hotel'}
                                    </div>
                                </div>
                                <div className="w-full rounded-xl bg-slate-50 px-4 py-3 text-left sm:w-auto sm:text-right">
                                    <div className="text-xs text-slate-500">
                                        Harga mulai dari
                                    </div>
                                    <div className="text-lg font-semibold text-orange-500">
                                        Rp{' '}
                                        {roomTypes[0]?.total_price?.toLocaleString(
                                            'id-ID',
                                        ) ?? '-'}
                                    </div>
                                    <a
                                        href="#rooms"
                                        className="mt-2 inline-flex rounded-lg bg-orange-500 px-4 py-2 text-xs font-semibold text-white hover:bg-orange-600"
                                    >
                                        Pilih Kamar
                                    </a>
                                    <Link
                                        href={`/chat/start/hotel/${hotel.id}`}
                                        className="mt-2 block rounded-lg border border-slate-200 px-4 py-2 text-center text-xs font-semibold text-slate-600 hover:bg-white"
                                    >
                                        Chat Mitra
                                    </Link>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 flex gap-2 overflow-x-auto rounded-2xl border border-slate-100 bg-white p-2 text-sm font-semibold text-slate-600 shadow-sm">
                            {[
                                'Overview',
                                'Rooms',
                                'Location',
                                'Facilities',
                                'Policy',
                                'Reviews',
                            ].map((tab) => (
                                <a
                                    key={tab}
                                    href={`#${tab.toLowerCase()}`}
                                    className="shrink-0 rounded-full px-4 py-2 hover:bg-slate-50 hover:text-slate-900"
                                >
                                    {tab}
                                </a>
                            ))}
                        </div>

                        <section
                            id="overview"
                            className="mt-8 rounded-2xl bg-white p-4 shadow-sm md:p-6"
                        >
                            <div className="grid gap-6 md:grid-cols-3">
                                <div className="rounded-2xl border border-slate-100 p-4">
                                    <div className="text-2xl font-semibold text-slate-900">
                                        {ratingText}
                                        <span className="text-sm text-slate-500">
                                            /10
                                        </span>
                                    </div>
                                    <div className="text-sm font-semibold text-slate-900">
                                        {ratingLabel}
                                    </div>
                                    <div className="text-xs text-slate-500">
                                        {ratingCaption}
                                    </div>
                                    <div className="mt-4 flex flex-wrap gap-2">
                                        {[
                                            'Kebersihan',
                                            'Lokasi',
                                            'Pelayanan',
                                        ].map((chip) => (
                                            <span
                                                key={chip}
                                                className="rounded-full bg-emerald-50 px-3 py-1 text-xs text-emerald-700"
                                            >
                                                {chip}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <div className="rounded-2xl border border-slate-100 p-4 md:col-span-2">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-sm font-semibold text-slate-900">
                                            Tentang hotel
                                        </h3>
                                        <a
                                            href="#location"
                                            className="text-xs text-sky-600"
                                        >
                                            Lihat peta
                                        </a>
                                    </div>
                                    <ProductDescription
                                        text={hotel.description}
                                        fallback="Deskripsi hotel akan tampil di sini."
                                        lines={4}
                                        className="mt-3 text-sm text-slate-600"
                                    />
                                    <div className="mt-4 grid gap-2 text-sm text-slate-600">
                                        <div>Alamat: {hotel.address}</div>
                                        <div>
                                            Check-in:{' '}
                                            {hotel.check_in_time ?? '14:00'} ·
                                            Check-out:{' '}
                                            {hotel.check_out_time ?? '12:00'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section id="rooms" className="mt-8">
                            <div className="rounded-2xl bg-white p-4 shadow-sm md:p-6">
                                <h2 className="text-xl font-semibold text-slate-900">
                                    Tipe Kamar Tersedia
                                </h2>
                                <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                                    Pilih kamar yang kamu butuhkan dan lanjutkan
                                    pemesanan.
                                </div>
                            </div>
                        </section>

                        <div className="mt-6 grid gap-6">
                            {roomTypes.map((room) => (
                                <div
                                    key={room.id}
                                    className="rounded-2xl bg-white p-4 shadow-sm md:p-6"
                                >
                                    {room.images && room.images.length > 0 && (
                                        <div className="mb-4 grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-3">
                                            {room.images
                                                .slice(0, 3)
                                                .map((image) => (
                                                    <img
                                                        key={image.id}
                                                        src={image.url}
                                                        alt={room.name}
                                                        className="aspect-video w-full rounded-xl object-cover"
                                                    />
                                                ))}
                                        </div>
                                    )}
                                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                        <div className="min-w-0">
                                            <h2 className="text-lg font-semibold text-slate-900">
                                                {room.name}
                                            </h2>
                                            <p className="text-sm text-slate-500">
                                                {room.bed_type} · Maks{' '}
                                                {room.max_guest} tamu
                                            </p>
                                            <div className="mt-2 flex flex-wrap gap-2 text-xs font-semibold">
                                                <span
                                                    className={`inline-flex items-center gap-1 rounded-full px-2 py-1 ${
                                                        room.breakfast_included
                                                            ? 'bg-emerald-50 text-emerald-700'
                                                            : 'bg-slate-100 text-slate-500'
                                                    }`}
                                                >
                                                    <Coffee className="h-3 w-3" />
                                                    {room.breakfast_included
                                                        ? 'Termasuk sarapan'
                                                        : 'Tanpa sarapan'}
                                                </span>
                                                <span
                                                    className={`inline-flex items-center gap-1 rounded-full px-2 py-1 ${
                                                        room.smoking_allowed
                                                            ? 'bg-amber-50 text-amber-700'
                                                            : 'bg-slate-100 text-slate-500'
                                                    }`}
                                                >
                                                    {room.smoking_allowed ? (
                                                        <Cigarette className="h-3 w-3" />
                                                    ) : (
                                                        <CigaretteOff className="h-3 w-3" />
                                                    )}
                                                    {room.smoking_allowed
                                                        ? 'Boleh merokok'
                                                        : 'No smoking'}
                                                </span>
                                            </div>
                                            <ProductDescription
                                                text={room.description}
                                                lines={2}
                                                className="mt-2 text-sm text-slate-600"
                                            />
                                        </div>
                                        <div className="shrink-0 text-left md:text-right">
                                            {room.strike_price && (
                                                <div className="text-xs text-slate-400 line-through">
                                                    Rp{' '}
                                                    {room.strike_price.toLocaleString(
                                                        'id-ID',
                                                    )}
                                                </div>
                                            )}
                                            <div className="text-lg font-semibold text-sky-600">
                                                Rp{' '}
                                                {room.total_price?.toLocaleString(
                                                    'id-ID',
                                                )}
                                            </div>
                                            <div className="text-xs text-slate-500">
                                                {filters.rooms} kamar ·{' '}
                                                {filters.guests} tamu
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-4">
                                        <button
                                            type="button"
                                            className="relative z-10 w-full rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white sm:w-auto"
                                            onClick={() => {
                                                if (guardPurchaseByRole(role)) {
                                                    return;
                                                }
                                                router.post(
                                                    '/booking/prepare',
                                                    {
                                                        hotel_id:
                                                            form.data.hotel_id,
                                                        room_type_id: room.id,
                                                        check_in:
                                                            form.data.check_in,
                                                        check_out:
                                                            form.data.check_out,
                                                        rooms: form.data.rooms,
                                                        guests: form.data
                                                            .guests,
                                                        children:
                                                            form.data.children,
                                                        children_ages:
                                                            form.data
                                                                .children_ages,
                                                    },
                                                );
                                            }}
                                        >
                                            Pilih Kamar
                                        </button>
                                    </div>
                                </div>
                            ))}

                            {roomTypes.length === 0 && (
                                <div className="rounded-2xl bg-white p-6 text-center text-sm text-slate-500 shadow-sm">
                                    Kamar tidak tersedia untuk tanggal yang
                                    dipilih.
                                </div>
                            )}
                        </div>

                        <section
                            id="location"
                            className="mt-8 rounded-2xl bg-white p-4 shadow-sm md:p-6"
                        >
                            <h2 className="text-xl font-semibold text-slate-900">
                                Lokasi
                            </h2>
                            <p className="mt-2 text-sm text-slate-600">
                                {hotel.address}
                            </p>
                            <div className="mt-4 flex items-center justify-between">
                                <span className="text-sm font-semibold text-slate-700">
                                    Lihat di peta
                                </span>
                                {hotel.latitude && hotel.longitude && (
                                    <a
                                        href={`https://www.google.com/maps?q=${hotel.latitude},${hotel.longitude}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-sm font-semibold text-sky-600"
                                    >
                                        Buka Google Maps →
                                    </a>
                                )}
                            </div>
                            <div className="mt-3 overflow-hidden rounded-2xl border border-slate-100">
                                {hotel.latitude && hotel.longitude ? (
                                    <iframe
                                        title="Google Maps"
                                        className="h-72 w-full"
                                        loading="lazy"
                                        src={`https://www.google.com/maps?q=${hotel.latitude},${hotel.longitude}&z=15&output=embed`}
                                    />
                                ) : (
                                    <div className="flex h-56 items-center justify-center bg-slate-100 text-sm text-slate-500">
                                        Lokasi belum tersedia.
                                    </div>
                                )}
                            </div>
                        </section>

                        <section
                            id="facilities"
                            className="mt-8 rounded-2xl bg-white p-4 shadow-sm md:p-6"
                        >
                            <h2 className="text-xl font-semibold text-slate-900">
                                Fasilitas
                            </h2>
                            <div className="mt-4 flex flex-wrap gap-2">
                                {hotel.facilities?.map((item) => {
                                    const key = item.toLowerCase();
                                    const icon = key.includes('wifi')
                                        ? Wifi
                                        : key.includes('parking')
                                          ? ParkingSquare
                                          : key.includes('pool')
                                            ? Waves
                                            : key.includes('gym')
                                              ? Dumbbell
                                              : key.includes('restaurant')
                                                ? Utensils
                                                : key.includes('coffee') ||
                                                    key.includes('breakfast')
                                                  ? Coffee
                                                  : key.includes('lobby') ||
                                                      key.includes('meeting')
                                                    ? Users
                                                    : ShieldCheck;
                                    const Icon = icon;
                                    return (
                                        <span
                                            key={item}
                                            className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600"
                                        >
                                            <Icon className="h-3.5 w-3.5 text-sky-600" />
                                            {item}
                                        </span>
                                    );
                                })}
                            </div>
                        </section>

                        <section
                            id="policy"
                            className="mt-8 rounded-2xl bg-white p-4 shadow-sm md:p-6"
                        >
                            <h2 className="text-xl font-semibold text-slate-900">
                                Kebijakan Hotel
                            </h2>
                            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-600">
                                <li>
                                    Check-in mulai pukul{' '}
                                    {hotel.check_in_time ?? '14:00'}.
                                </li>
                                <li>
                                    Check-out maksimal pukul{' '}
                                    {hotel.check_out_time ?? '12:00'}.
                                </li>
                                <li>
                                    Ketentuan pembatalan mengikuti kebijakan
                                    masing-masing kamar.
                                </li>
                            </ul>
                        </section>

                        <ReviewSection
                            productType="hotel"
                            productId={hotel.id}
                            reviews={reviews}
                            userReview={userReview}
                            canReview={canReview}
                        />
                    </>
                )}
            </div>
            <Dialog open={galleryOpen} onOpenChange={setGalleryOpen}>
                <DialogContent className="max-h-[90vh] max-w-[calc(100vw-1.5rem)] overflow-y-auto rounded-3xl p-4 sm:max-w-4xl sm:p-6">
                    <DialogHeader>
                        <DialogTitle>Galeri {hotel.name}</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-3 sm:grid-cols-2">
                        {galleryImages.map((image, index) => (
                            <img
                                key={`${image}-${index}`}
                                src={image}
                                alt={`${hotel.name} ${index + 1}`}
                                className="aspect-video w-full rounded-2xl bg-slate-100 object-cover"
                                loading="lazy"
                            />
                        ))}
                    </div>
                </DialogContent>
            </Dialog>
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
