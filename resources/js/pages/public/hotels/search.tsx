import { Head, Link, router, usePage } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import { DateRange, RangeKeyDict } from 'react-date-range';
import { format } from 'date-fns';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';
import { Bell, CalendarCheck, MapPinned, MessageCircle, ShoppingBag, Star, Ticket, UserCircle, History, Coffee, Cigarette, CigaretteOff, ShoppingCart, BadgePercent } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import PublicLayout from '@/layouts/public-layout';

type Hotel = {
    id: number;
    encrypted_id?: string;
    name: string;
    address?: string | null;
    city_name?: string | null;
    star_rating?: number | null;
    min_price?: number | null;
    image_url?: string | null;
    breakfast_included?: boolean;
    smoking_allowed?: boolean;
};

type Filters = {
    city?: string | null;
    check_in?: string | null;
    check_out?: string | null;
    rooms?: number;
    guests?: number;
    q?: string | null;
};

type Recommendation = {
    id: number;
    encrypted_id: string;
    name: string;
    city_name?: string | null;
    star_rating?: number | null;
    min_price?: number | null;
    image_url?: string | null;
};

export default function HotelSearch({ filters, hotels, recommendations }: { filters: Filters; hotels: Hotel[]; recommendations: Recommendation[] }) {
    const { auth, unread_notifications, souvenir_cart_count, affiliate_menu } = usePage().props as {
        auth?: { user?: unknown };
        unread_notifications?: number;
        souvenir_cart_count?: number;
        affiliate_menu?: boolean;
    };
    const isUser = Boolean((auth?.user as any)?.role === 'user');
    const [isReady, setIsReady] = useState(false);
    const today = new Date();
    const tomorrow = new Date(Date.now() + 86400000);
    const defaultCheckIn = format(today, 'yyyy-MM-dd');
    const defaultCheckOut = format(tomorrow, 'yyyy-MM-dd');
    const [form, setForm] = useState({
        q: filters.q ?? '',
        city: filters.city ?? '',
        check_in: filters.check_in ?? defaultCheckIn,
        check_out: filters.check_out ?? defaultCheckOut,
        rooms: filters.rooms ?? 1,
        guests: filters.guests ?? 2,
    });
    const [guestOpen, setGuestOpen] = useState(false);
    const [dateOpen, setDateOpen] = useState(false);
    const [adults, setAdults] = useState(Math.max(1, filters.guests ? Math.max(filters.guests - 0, 1) : 2));
    const [children, setChildren] = useState(0);
    const [rooms, setRooms] = useState(filters.rooms ?? 1);
    const guestRef = useRef<HTMLDivElement | null>(null);
    const dateRef = useRef<HTMLDivElement | null>(null);
    const parseDate = (value?: string) => (value ? new Date(value) : new Date());
    const initialStart = form.check_in ? parseDate(form.check_in) : new Date();
    const initialEnd = form.check_out ? parseDate(form.check_out) : new Date(Date.now() + 86400000);
    const [range, setRange] = useState([
        {
            startDate: initialStart,
            endDate: initialEnd,
            key: 'selection',
        },
    ]);

    const submitSearch = (event: React.FormEvent) => {
        event.preventDefault();
        const totalGuests = adults + children;
        router.get('/stay', { ...form, guests: totalGuests, rooms }, { preserveState: true, preserveScroll: true });
    };

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
        if (!form.check_in || !form.check_out) return null;
        const start = new Date(form.check_in);
        const end = new Date(form.check_out);
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

    return (
        <PublicLayout categories={categories} chips={chips}>
            <Head title="Cari Hotel">
                <link
                    href="https://fonts.bunny.net/css?family=plus-jakarta-sans:400,500,600,700|space-grotesk:500,600,700"
                    rel="stylesheet"
                />
            </Head>
                        <div className="mx-auto w-full max-w-7xl px-4 py-8 md:px-8">
                {!isReady && (
                    <section className="space-y-8">
                        <Skeleton className="h-44 w-full rounded-[28px] sm:h-56 md:h-72" />
                        <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-2">
                            {[0, 1].map((idx) => (
                                <Skeleton key={idx} className="h-32 w-full rounded-2xl" />
                            ))}
                        </div>
                    </section>
                )}

                {isReady && (
                <>
                <section className="mb-6">
                    <div className="relative overflow-hidden rounded-[28px] shadow-lg">
                        <img
                            src="https://images.unsplash.com/photo-1506929562872-bb421503ef21?q=80&w=1920&auto=format&fit=crop"
                            alt="Beach resort"
                            className="h-44 w-full object-cover sm:h-56 md:h-72"
                        />
                        <div className="pointer-events-none absolute inset-0 rounded-[28px] bg-gradient-to-r from-black/60 via-black/45 to-transparent" />
                        <div className="absolute left-4 right-4 top-1/2 -translate-y-1/2 text-center text-white sm:left-8 sm:right-8">
                            <h1 className="text-lg font-semibold sm:text-xl md:text-3xl">
                                Mau ke mana dulu? Booking hotel nyaman lebih hemat di INDOTIX
                            </h1>
                            <p className="mt-2 text-xs text-white/85 sm:text-sm">
                                Temukan pilihan hotel, villa, resort, dan banyak lagi — semua dalam satu tempat.
                            </p>
                        </div>
                    </div>

                    <div className="-mt-14 px-4 sm:-mt-20 sm:px-6 md:-mt-24">
                        <div className="relative z-20 rounded-[24px] bg-white p-5 shadow-[0_18px_40px_-18px_rgba(15,23,42,0.35)]">
                            <form className="grid gap-4 md:grid-cols-[2fr_2fr_1.5fr_auto]" onSubmit={submitSearch}>
                                <div className="grid gap-2">
                                    <label className="text-xs font-semibold uppercase text-slate-500">Kota, destinasi, atau nama hotel</label>
                                    <div className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm">
                                        <span className="text-slate-400">📍</span>
                                        <input
                                            className="w-full bg-transparent outline-none"
                                            placeholder="Kota, hotel, atau tempat tujuan"
                                            value={form.q}
                                            onChange={(event) => setForm((prev) => ({ ...prev, q: event.target.value }))}
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
                                                        setForm((prev) => ({
                                                            ...prev,
                                                            check_in: format(start, 'yyyy-MM-dd'),
                                                            check_out: format(end, 'yyyy-MM-dd'),
                                                        }));
                                                    }}
                                                    months={2}
                                                    direction="horizontal"
                                                    minDate={new Date()}
                                                    rangeColors={['#0ea5e9']}
                                                />
                                            </div>
                                        )}
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
                                        <div className="absolute right-0 z-10 mt-2 w-[320px] rounded-2xl border border-slate-200 bg-white p-4 shadow-lg">
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
                                </div>
                                <button className="h-12 rounded-full bg-sky-600 px-8 text-sm font-semibold text-white shadow-md">
                                    Cari
                                </button>
                            </form>
                            <div className="mt-4 text-sm font-semibold text-sky-700">Hotel yang Baru Dilihat</div>
                        </div>
                    </div>
                </section>

                <div className="mt-8 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
                    {hotels.map((hotel) => (
                        <div
                            key={hotel.id}
                            className="group overflow-hidden rounded-xl bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg"
                        >
                            <Link
                                href={`/stay/hotels/${hotel.encrypted_id ?? hotel.id}?check_in=${form.check_in}&check_out=${form.check_out}&rooms=${form.rooms}&guests=${form.guests}`}
                                className="relative block h-28 overflow-hidden"
                            >
                                <img
                                    src={
                                        hotel.image_url ??
                                        `https://images.unsplash.com/photo-1501117716987-c8e005b2bcd4?q=80&w=1200&auto=format&fit=crop&sig=${hotel.id}`
                                    }
                                    alt={hotel.name}
                                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                                <div className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-slate-700 shadow-sm">
                                    {hotel.star_rating ? `${hotel.star_rating}★` : 'Hotel'}
                                </div>
                            </Link>
                            <div className="p-3">
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <h2 className="text-sm font-semibold text-slate-900">{hotel.name}</h2>
                                        <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                                            <MapPinned className="h-3 w-3 text-sky-500" />
                                            {hotel.city_name ?? hotel.address ?? 'Indonesia'}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-0.5">
                                        {Array.from({ length: Math.max(0, Math.round(hotel.star_rating ?? 0)) }).map((_, idx) => (
                                            <Star key={`${hotel.id}-star-${idx}`} className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                                        ))}
                                    </div>
                                </div>
                                <div className="mt-3 flex items-center justify-between">
                                    <div>
                                        <div className="text-[11px] text-slate-500">Mulai</div>
                                        <div className="text-sm font-semibold text-sky-600">
                                            {hotel.min_price ? `Rp ${hotel.min_price.toLocaleString('id-ID')}` : '-'}
                                        </div>
                                    </div>
                                    <Link
                                        href={`/stay/hotels/${hotel.encrypted_id ?? hotel.id}?check_in=${form.check_in}&check_out=${form.check_out}&rooms=${form.rooms}&guests=${form.guests}`}
                                        className="rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-sky-700"
                                    >
                                        Lihat Detail
                                    </Link>
                                </div>
                                <div className="mt-3 flex flex-wrap gap-2">
                                    <span
                                        className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold ${
                                            hotel.breakfast_included ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                                        }`}
                                    >
                                        <Coffee className="h-3 w-3" />
                                        {hotel.breakfast_included ? 'Termasuk sarapan' : 'Tanpa sarapan'}
                                    </span>
                                    <span
                                        className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold ${
                                            hotel.smoking_allowed ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-500'
                                        }`}
                                    >
                                        {hotel.smoking_allowed ? <Cigarette className="h-3 w-3" /> : <CigaretteOff className="h-3 w-3" />}
                                        {hotel.smoking_allowed ? 'Boleh merokok' : 'No smoking'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}

                    {hotels.length === 0 && (
                        <div className="md:col-span-2 rounded-2xl border border-slate-100 bg-white p-6 text-center text-sm text-slate-500 shadow-sm">
                            <div className="text-base font-semibold text-slate-800">Belum ada hasil.</div>
                            <div className="mt-2">Silakan isi tanggal untuk melihat hotel yang tersedia.</div>
                        </div>
                    )}
                </div>

                {hotels.length === 0 && (
                    <section className="mt-10">
                        <h2 className="text-xl font-semibold text-slate-900">Rekomendasi untuk kamu</h2>
                        <p className="mt-2 text-sm text-slate-500">Pilihan hotel favorit dengan lokasi strategis dan fasilitas lengkap.</p>
                        <div className="mt-6 grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3">
                            {recommendations.map((item) => (
                                <div key={item.id} className="overflow-hidden rounded-2xl bg-white shadow-sm">
                                    <img
                                        src={
                                            item.image_url ??
                                            'https://images.unsplash.com/photo-1501117716987-c8e005b2bcd4?q=80&w=1200&auto=format&fit=crop'
                                        }
                                        alt={item.name}
                                        className="h-44 w-full object-cover"
                                    />
                                    <div className="p-4">
                                        <h3 className="text-sm font-semibold text-slate-900">{item.name}</h3>
                                        <p className="text-xs text-slate-500">{item.city_name ?? 'Indonesia'}</p>
                                        <div className="mt-3 text-sm font-semibold text-sky-600">
                                            {item.min_price ? `Mulai Rp ${item.min_price.toLocaleString('id-ID')}` : 'Harga tersedia'}
                                        </div>
                                        <Link
                                            href={`/stay/hotels/${item.encrypted_id}?check_in=${form.check_in || ''}&check_out=${form.check_out || ''}&rooms=${rooms}&guests=${adults + children}`}
                                            className="mt-4 block w-full rounded-lg bg-sky-600 px-4 py-2 text-center text-xs font-semibold text-white"
                                        >
                                            Lihat Detail
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}
                </>
                )}
            </div>
            <footer className="mt-10 border-t border-slate-200 bg-white">
                <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-10 md:grid-cols-4 md:px-8">
                    <div>
                        <Link href="/"><img src="/logo.png" alt="Indotix" className="h-11 w-36 object-contain" /></Link>
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
        </PublicLayout>
    );
}
