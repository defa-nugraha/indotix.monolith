import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import { DateRange, RangeKeyDict } from 'react-date-range';
import { format } from 'date-fns';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';
import { Bell, CalendarCheck, MapPinned, MessageCircle, ShoppingBag, Star, Ticket, UserCircle, History, Wifi, ParkingSquare, Waves, Dumbbell, Utensils, Coffee, Users, ShieldCheck, Cigarette, CigaretteOff, ShoppingCart } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

type Hotel = {
    id: number;
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
};

export default function HotelShow({ hotel, roomTypes, filters }: { hotel: Hotel; roomTypes: RoomType[]; filters: Filters }) {
    const { auth, unread_notifications, souvenir_cart_count } = usePage().props as { auth?: { user?: unknown }; unread_notifications?: number; souvenir_cart_count?: number };
    const isUser = Boolean((auth?.user as any)?.role === 'user');
    const [isReady, setIsReady] = useState(false);
    const form = useForm({
        hotel_id: hotel.id,
        room_type_id: '',
        check_in: filters.check_in,
        check_out: filters.check_out,
        rooms: filters.rooms,
        guests: filters.guests,
    });
    const [guestOpen, setGuestOpen] = useState(false);
    const [dateOpen, setDateOpen] = useState(false);
    const [adults, setAdults] = useState(Math.max(1, Math.max(filters.guests - 0, 1)));
    const [children, setChildren] = useState(0);
    const [rooms, setRooms] = useState(filters.rooms ?? 1);
    const guestRef = useRef<HTMLDivElement | null>(null);
    const dateRef = useRef<HTMLDivElement | null>(null);
    const initialStart = filters.check_in ? new Date(filters.check_in) : new Date();
    const initialEnd = filters.check_out ? new Date(filters.check_out) : new Date(Date.now() + 86400000);
    const [range, setRange] = useState([
        {
            startDate: initialStart,
            endDate: initialEnd,
            key: 'selection',
        },
    ]);

    useEffect(() => {
        form.setData('guests', adults + children);
    }, [adults, children]);

    useEffect(() => {
        form.setData('rooms', rooms);
    }, [rooms]);

    useEffect(() => {
        const timer = window.setTimeout(() => setIsReady(true), 350);
        return () => window.clearTimeout(timer);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (guestRef.current && !guestRef.current.contains(event.target as Node)) {
                setGuestOpen(false);
            }
            if (dateRef.current && !dateRef.current.contains(event.target as Node)) {
                setDateOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const nightCount = (() => {
        const start = range[0].startDate;
        const end = range[0].endDate;
        if (!start || !end) return null;
        const diff = Math.max(0, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
        return diff > 0 ? diff : null;
    })();

    const categories = [
        { label: 'Wisata', icon: MapPinned, href: '/wisata' },
        { label: 'Event', icon: CalendarCheck, href: '/events' },
        { label: 'Souvenir', icon: ShoppingBag, href: '/souvenir' },
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
    const galleryImages = hotelImages.length > 0 ? hotelImages : fallbackRoomImages;

    return (
        <div className="min-h-screen bg-[#f4f6f8] text-slate-900">
            <Head title={hotel.name}>
                <link
                    href="https://fonts.bunny.net/css?family=plus-jakarta-sans:400,500,600,700|space-grotesk:500,600,700"
                    rel="stylesheet"
                />
            </Head>
            <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
                <div className="mx-auto flex w-full max-w-6xl items-center gap-6 px-4 py-4 md:px-8">
                    <div className="flex items-center gap-2">
                        <img src="/logo.png" alt="Indotix" className="h-11 w-36 object-contain" />
                    </div>
                    <div className="flex flex-1 items-center">
                        <input
                            type="text"
                            placeholder="Cari kota/hotel/wisata/event..."
                            className="h-11 w-full rounded-lg border border-slate-200 px-4 text-sm shadow-sm focus:border-sky-400 focus:outline-none"
                        />
                    </div>
                    <Link href="/souvenir/cart" className="relative flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-sky-600">
                        <ShoppingCart className="h-4 w-4" />
                        Keranjang
                        {Boolean(souvenir_cart_count) && (
                            <span className="absolute -right-3 -top-2 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-emerald-500 px-1 text-[10px] font-bold text-white">
                                {souvenir_cart_count}
                            </span>
                        )}
                    </Link>
                    {!auth?.user && (
                        <div className="flex items-center gap-2">
                            <Link
                                href="/register"
                                className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-700"
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
                            <Link href="/notifications" className="relative flex items-center gap-2 hover:text-sky-600">
                                <Bell className="h-4 w-4" />
                                Notifikasi
                                {Boolean(unread_notifications) && (
                                    <span className="absolute -right-3 -top-2 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                                        {unread_notifications}
                                    </span>
                                )}
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

            <div className="mx-auto w-full max-w-6xl px-4 py-8 md:px-8">
                {!isReady && (
                    <section className="space-y-6">
                        <Skeleton className="h-28 w-full rounded-2xl" />
                        <Skeleton className="h-64 w-full rounded-2xl" />
                        <div className="grid gap-6 md:grid-cols-3">
                            {[0, 1, 2].map((idx) => (
                                <Skeleton key={idx} className="h-40 w-full rounded-2xl" />
                            ))}
                        </div>
                    </section>
                )}

                {isReady && (
                <>
                <section className="relative mb-6 rounded-[28px] bg-white p-6 shadow-sm">
                    <div className="rounded-[24px] bg-white">
                        <form action="/stay" method="get" className="grid gap-4 md:grid-cols-[2fr_2fr_1.5fr_auto]">
                                <div className="grid gap-2">
                                    <label className="text-xs font-semibold uppercase text-slate-500">Kota, destinasi, atau nama hotel</label>
                                    <div className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm">
                                        <span className="text-slate-400">📍</span>
                                        <input
                                            name="q"
                                            className="w-full bg-transparent outline-none"
                                            placeholder="Kota, hotel, atau tempat tujuan"
                                        />
                                    </div>
                                </div>
                                <div className="grid gap-2">
                                    <label className="text-xs font-semibold uppercase text-slate-500">Tanggal Check-in & Check-out</label>
                                    <div className="relative" ref={dateRef}>
                                        <button
                                            type="button"
                                            className={`flex w-full items-center gap-2 rounded-xl border px-4 py-3 text-sm ${dateOpen ? 'border-lime-500' : 'border-slate-200'}`}
                                            onClick={() => setDateOpen((prev) => !prev)}
                                        >
                                            <span className="text-slate-400">📅</span>
                                            <span className="text-left">
                                                {format(range[0].startDate ?? new Date(), 'EEE, dd MMM yyyy')} -{' '}
                                                {format(range[0].endDate ?? new Date(), 'EEE, dd MMM yyyy')}
                                            </span>
                                        </button>
                                        {dateOpen && (
                                            <div className="absolute right-0 z-50 mt-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-lg">
                                                <DateRange
                                                    ranges={range}
                                                    onChange={(item: RangeKeyDict) => {
                                                        const selection = item.selection;
                                                        setRange([selection]);
                                                        const start = selection.startDate ?? new Date();
                                                        const end = selection.endDate ?? new Date();
                                                        form.setData('check_in', format(start, 'yyyy-MM-dd'));
                                                        form.setData('check_out', format(end, 'yyyy-MM-dd'));
                                                    }}
                                                    months={2}
                                                    direction="horizontal"
                                                    minDate={new Date()}
                                                    rangeColors={['#0ea5e9']}
                                                />
                                            </div>
                                        )}
                                        <input type="hidden" name="check_in" value={format(range[0].startDate ?? new Date(), 'yyyy-MM-dd')} />
                                        <input type="hidden" name="check_out" value={format(range[0].endDate ?? new Date(), 'yyyy-MM-dd')} />
                                    </div>
                                    <div className="text-[11px] text-slate-400">Durasi: {nightCount ? `${nightCount} malam` : '-'}</div>
                                </div>
                                <div className="relative grid gap-2" ref={guestRef}>
                                    <label className="text-xs font-semibold uppercase text-slate-500">Tamu dan Kamar</label>
                                    <button
                                        type="button"
                                        className="flex w-full items-center justify-between rounded-xl border border-slate-200 px-4 py-3 text-sm"
                                        onClick={() => setGuestOpen((prev) => !prev)}
                                    >
                                        <span className="text-slate-400">👥</span>
                                        <span className="flex-1 pl-2 text-left">
                                            {adults} Dewasa, {children} Anak, {rooms} Kamar
                                        </span>
                                        <span className="h-8 w-8 rounded-full bg-sky-100 text-sky-700">▾</span>
                                    </button>
                                    {guestOpen && (
                                        <div className="absolute right-0 z-50 mt-2 w-[320px] rounded-2xl border border-slate-200 bg-white p-4 shadow-lg">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-semibold text-slate-700">Dewasa</span>
                                                <div className="flex items-center gap-3">
                                                    <button type="button" className="h-8 w-8 rounded-full bg-slate-100" onClick={() => setAdults((prev) => Math.max(1, prev - 1))}>−</button>
                                                    <span className="w-6 text-center text-sm font-semibold">{adults}</span>
                                                    <button type="button" className="h-8 w-8 rounded-full bg-sky-100 text-sky-700" onClick={() => setAdults((prev) => prev + 1)}>+</button>
                                                </div>
                                            </div>
                                            <div className="mt-3 flex items-center justify-between">
                                                <span className="text-sm font-semibold text-slate-700">Anak</span>
                                                <div className="flex items-center gap-3">
                                                    <button type="button" className="h-8 w-8 rounded-full bg-slate-100" onClick={() => setChildren((prev) => Math.max(0, prev - 1))}>−</button>
                                                    <span className="w-6 text-center text-sm font-semibold">{children}</span>
                                                    <button type="button" className="h-8 w-8 rounded-full bg-sky-100 text-sky-700" onClick={() => setChildren((prev) => prev + 1)}>+</button>
                                                </div>
                                            </div>
                                            <div className="mt-3 flex items-center justify-between">
                                                <span className="text-sm font-semibold text-slate-700">Kamar</span>
                                                <div className="flex items-center gap-3">
                                                    <button type="button" className="h-8 w-8 rounded-full bg-slate-100" onClick={() => setRooms((prev) => Math.max(1, prev - 1))}>−</button>
                                                    <span className="w-6 text-center text-sm font-semibold">{rooms}</span>
                                                    <button type="button" className="h-8 w-8 rounded-full bg-sky-100 text-sky-700" onClick={() => setRooms((prev) => prev + 1)}>+</button>
                                                </div>
                                            </div>
                                            <button type="button" className="mt-4 w-full rounded-lg bg-sky-600 py-2 text-sm font-semibold text-white" onClick={() => setGuestOpen(false)}>
                                                Selesai
                                            </button>
                                        </div>
                                    )}
                                    <input type="hidden" name="rooms" value={rooms} />
                                    <input type="hidden" name="guests" value={adults + children} />
                                </div>
                                <button className="h-12 rounded-full bg-sky-600 px-8 text-sm font-semibold text-white shadow-md">
                                    Cari
                                </button>
                            </form>
                        </div>
                </section>

                <div className="rounded-2xl bg-white p-4 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4 text-xs text-slate-500">
                        <div className="flex flex-wrap gap-2">
                            <span className="text-sky-600">Hotel</span>/
                            <span>Indonesia</span>/
                            <span>{hotel.city_name ?? 'Kota'}</span>/
                            <span className="text-slate-700">{hotel.name}</span>
                        </div>
                    </div>

                    <div className="mt-4 grid gap-4 md:grid-cols-[1.6fr_1fr]">
                        <div className="grid gap-3">
                            {galleryImages.length > 0 ? (
                                <img
                                    src={galleryImages[0]}
                                    alt={hotel.name}
                                    className="h-64 w-full rounded-xl object-cover md:h-full"
                                />
                            ) : (
                                <div className="h-64 rounded-xl bg-slate-100" />
                            )}
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                            {galleryImages.slice(1, 5).map((image, idx) => (
                                <div key={`${image}-${idx}`} className="relative">
                                    <img src={image} alt={`Foto ${idx + 2}`} className="h-32 w-full rounded-xl object-cover" />
                                    {idx === 3 && galleryImages.length > 5 && (
                                        <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/40 text-sm font-semibold text-white">
                                            Lihat semua foto
                                        </div>
                                    )}
                                </div>
                            ))}
                            {galleryImages.length === 0 && (
                                <div className="h-32 rounded-xl bg-slate-100" />
                            )}
                        </div>
                    </div>

                    <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-4">
                        <div>
                            <h1 className="text-2xl font-semibold text-slate-900">{hotel.name}</h1>
                            <p className="text-sm text-slate-500">{hotel.city_name} · {hotel.address}</p>
                            <div className="mt-2 text-lg text-yellow-500">
                                {hotel.star_rating ? '★'.repeat(hotel.star_rating) : 'Hotel'}
                            </div>
                        </div>
                        <div className="rounded-xl bg-slate-50 px-4 py-3 text-right">
                            <div className="text-xs text-slate-500">Harga mulai dari</div>
                            <div className="text-lg font-semibold text-orange-500">Rp {roomTypes[0]?.total_price?.toLocaleString('id-ID') ?? '-'}</div>
                            <button className="mt-2 rounded-lg bg-orange-500 px-4 py-2 text-xs font-semibold text-white">Pilih Kamar</button>
                        </div>
                    </div>
                </div>

                <div className="sticky top-[120px] z-20 mt-6 flex items-center gap-6 border-b border-slate-200 bg-white/95 px-4 py-3 text-sm font-semibold text-slate-600 shadow-sm backdrop-blur">
                    {['Overview', 'Rooms', 'Location', 'Facilities', 'Policy', 'Reviews'].map((tab) => (
                        <a key={tab} href={`#${tab.toLowerCase()}`} className="hover:text-slate-900">
                            {tab}
                        </a>
                    ))}
                </div>

                <section id="overview" className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
                    <div className="grid gap-6 md:grid-cols-3">
                        <div className="rounded-2xl border border-slate-100 p-4">
                            <div className="text-2xl font-semibold text-slate-900">8,4<span className="text-sm text-slate-500">/10</span></div>
                            <div className="text-sm font-semibold text-slate-900">Sangat Baik</div>
                            <div className="text-xs text-slate-500">Ulasan terbatas</div>
                            <div className="mt-4 flex flex-wrap gap-2">
                                {['Kebersihan', 'Lokasi', 'Pelayanan'].map((chip) => (
                                    <span key={chip} className="rounded-full bg-emerald-50 px-3 py-1 text-xs text-emerald-700">{chip}</span>
                                ))}
                            </div>
                        </div>
                        <div className="rounded-2xl border border-slate-100 p-4 md:col-span-2">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-semibold text-slate-900">Tentang hotel</h3>
                                <a href="#location" className="text-xs text-sky-600">Lihat peta</a>
                            </div>
                            <p className="mt-3 text-sm text-slate-600">{hotel.description ?? 'Deskripsi hotel akan tampil di sini.'}</p>
                            <div className="mt-4 grid gap-2 text-sm text-slate-600">
                                <div>Alamat: {hotel.address}</div>
                                <div>Check-in: {hotel.check_in_time ?? '14:00'} · Check-out: {hotel.check_out_time ?? '12:00'}</div>
                            </div>
                        </div>
                    </div>
                </section>

                <section id="rooms" className="mt-8">
                    <div className="rounded-2xl bg-white p-6 shadow-sm">
                        <h2 className="text-xl font-semibold text-slate-900">Tipe Kamar Tersedia</h2>
                        <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                            Pilih kamar yang kamu butuhkan dan lanjutkan pemesanan.
                        </div>
                    </div>
                </section>

                <div className="mt-6 grid gap-6">
                    {roomTypes.map((room) => (
                        <div key={room.id} className="rounded-2xl bg-white p-6 shadow-sm">
                            {room.images && room.images.length > 0 && (
                                <div className="mb-4 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                                    {room.images.slice(0, 6).map((image) => (
                                        <img
                                            key={image.id}
                                            src={image.url}
                                            alt={room.name}
                                            className="h-32 w-full rounded-xl object-cover"
                                        />
                                    ))}
                                </div>
                            )}
                            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                <div>
                                    <h2 className="text-lg font-semibold text-slate-900">{room.name}</h2>
                                    <p className="text-sm text-slate-500">{room.bed_type} · Maks {room.max_guest} tamu</p>
                                    <div className="mt-2 flex flex-wrap gap-2 text-xs font-semibold">
                                        <span
                                            className={`inline-flex items-center gap-1 rounded-full px-2 py-1 ${
                                                room.breakfast_included ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                                            }`}
                                        >
                                            <Coffee className="h-3 w-3" />
                                            {room.breakfast_included ? 'Termasuk sarapan' : 'Tanpa sarapan'}
                                        </span>
                                        <span
                                            className={`inline-flex items-center gap-1 rounded-full px-2 py-1 ${
                                                room.smoking_allowed ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-500'
                                            }`}
                                        >
                                            {room.smoking_allowed ? <Cigarette className="h-3 w-3" /> : <CigaretteOff className="h-3 w-3" />}
                                            {room.smoking_allowed ? 'Boleh merokok' : 'No smoking'}
                                        </span>
                                    </div>
                                    <p className="mt-2 text-sm text-slate-600">{room.description}</p>
                                </div>
                                <div className="text-right">
                                    {room.strike_price && (
                                        <div className="text-xs text-slate-400 line-through">
                                            Rp {room.strike_price.toLocaleString('id-ID')}
                                        </div>
                                    )}
                                    <div className="text-lg font-semibold text-sky-600">
                                        Rp {room.total_price?.toLocaleString('id-ID')}
                                    </div>
                                    <div className="text-xs text-slate-500">{filters.rooms} kamar · {filters.guests} tamu</div>
                                </div>
                            </div>
                            <div className="mt-4">
                                <button
                                    type="button"
                                    className="relative z-10 rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white"
                                    onClick={() => {
                                        router.post('/booking/prepare', {
                                            hotel_id: form.data.hotel_id,
                                            room_type_id: room.id,
                                            check_in: form.data.check_in,
                                            check_out: form.data.check_out,
                                            rooms: form.data.rooms,
                                            guests: form.data.guests,
                                        });
                                    }}
                                >
                                    Pilih Kamar
                                </button>
                            </div>
                        </div>
                    ))}

                    {roomTypes.length === 0 && (
                        <div className="rounded-2xl bg-white p-6 text-center text-sm text-slate-500 shadow-sm">
                            Kamar tidak tersedia untuk tanggal yang dipilih.
                        </div>
                    )}
                </div>

                <section id="location" className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
                    <h2 className="text-xl font-semibold text-slate-900">Lokasi</h2>
                    <p className="mt-2 text-sm text-slate-600">{hotel.address}</p>
                    <div className="mt-4 flex items-center justify-between">
                        <span className="text-sm font-semibold text-slate-700">Lihat di peta</span>
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

                <section id="facilities" className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
                    <h2 className="text-xl font-semibold text-slate-900">Fasilitas</h2>
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
                                : key.includes('coffee') || key.includes('breakfast')
                                ? Coffee
                                : key.includes('lobby') || key.includes('meeting')
                                ? Users
                                : ShieldCheck;
                            const Icon = icon;
                            return (
                                <span key={item} className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
                                    <Icon className="h-3.5 w-3.5 text-sky-600" />
                                    {item}
                                </span>
                            );
                        })}
                    </div>
                </section>

                <section id="policy" className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
                    <h2 className="text-xl font-semibold text-slate-900">Kebijakan Hotel</h2>
                    <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-600">
                        <li>Check-in mulai pukul {hotel.check_in_time ?? '14:00'}.</li>
                        <li>Check-out maksimal pukul {hotel.check_out_time ?? '12:00'}.</li>
                        <li>Ketentuan pembatalan mengikuti kebijakan masing-masing kamar.</li>
                    </ul>
                </section>

                <section id="reviews" className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
                    <h2 className="text-xl font-semibold text-slate-900">Ulasan</h2>
                    <div className="mt-3 text-sm text-slate-600">Belum ada ulasan untuk hotel ini.</div>
                </section>
                </>
                )}
            </div>
            <footer className="mt-10 border-t border-slate-200 bg-white">
                <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-10 md:grid-cols-4 md:px-8">
                    <div>
                        <img src="/logo.png" alt="Indotix" className="h-11 w-36 object-contain" />
                        <p className="mt-3 text-sm text-slate-600">
                            Neo Soho Capital 40th Floor<br />
                            Jl. Tanjung Duren Raya No 1<br />
                            Jakarta Barat, DKI Jakarta 11470
                        </p>
                        <p className="mt-4 text-sm text-slate-600">0812 9205 9888</p>
                        <p className="text-sm text-slate-600">info@indotix.co.id</p>
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
                        <div className="mt-3 h-12 w-40 rounded-lg bg-slate-900" />
                        <h4 className="mt-6 text-sm font-semibold text-slate-900">Ikuti Kami</h4>
                        <div className="mt-3 flex gap-2">
                            <div className="h-9 w-9 rounded-full bg-slate-200" />
                            <div className="h-9 w-9 rounded-full bg-slate-200" />
                            <div className="h-9 w-9 rounded-full bg-slate-200" />
                            <div className="h-9 w-9 rounded-full bg-slate-200" />
                            <div className="h-9 w-9 rounded-full bg-slate-200" />
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
