import { Head, Link, usePage } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { CalendarCheck, MapPinned, ShoppingBag, Star, Ticket, Bell, MessageCircle, History as HistoryIcon, UserCircle, MapPin, Clock, Users, CreditCard, Filter, ShoppingCart } from 'lucide-react';

type Booking = {
    id: number;
    encrypted_id: string;
    type?: 'hotel' | 'wisata' | 'event' | 'special_program' | 'souvenir';
    title?: string | null;
    city_name?: string | null;
    address?: string | null;
    check_in?: string | null;
    check_out?: string | null;
    nights?: number | null;
    rooms_count?: number | null;
    guests_count?: number | null;
    visit_date?: string | null;
    quantity?: number | null;
    total?: number | null;
    status?: string | null;
    payment_status?: string | null;
    payment_deadline?: string | null;
    guest_name?: string | null;
    guest_email?: string | null;
    guest_phone?: string | null;
    created_at?: string | null;
    midtrans_order_id?: string | null;
    payment_url?: string | null;
    detail_url?: string | null;
    ticket_name?: string | null;
};

export default function History({ bookings = [] }: { bookings: Booking[] }) {
    const { auth, unread_notifications, souvenir_cart_count } = usePage().props as { auth?: { user?: any }; unread_notifications?: number; souvenir_cart_count?: number };
    const [activeStatus, setActiveStatus] = useState<'all' | 'pending_payment' | 'paid' | 'expired' | 'cancelled'>('all');
    const [activeType, setActiveType] = useState<'all' | 'hotel' | 'wisata' | 'event' | 'special_program' | 'souvenir'>('all');
    const [query, setQuery] = useState('');

    const categories = [
        { label: 'Wisata', icon: MapPinned, href: '/wisata' },
        { label: 'Event', icon: CalendarCheck, href: '/events' },
        { label: 'Souvenir', icon: ShoppingBag, href: '/souvenir' },
        { label: 'Spesial Program', icon: Star, href: '/special-programs' },
        { label: 'Hotel', icon: Ticket, href: '/stay' },
    ];

    const chips = ['Alam', 'Budaya', 'Edukasi', 'Kuliner', 'Desa Wisata', 'Religi', 'Pantai', 'Gunung', 'Taman Nasional', 'Air Terjun', 'Danau'];

    const statusBadge = (status?: string | null) => {
        switch (status) {
            case 'paid':
                return 'bg-emerald-100 text-emerald-700';
            case 'pending_payment':
                return 'bg-amber-100 text-amber-700';
            case 'expired':
                return 'bg-rose-100 text-rose-700';
            case 'cancelled':
                return 'bg-slate-100 text-slate-600';
            default:
                return 'bg-slate-100 text-slate-600';
        }
    };

    const statusLabel = (status?: string | null) => {
        switch (status) {
            case 'paid':
                return 'Lunas';
            case 'pending_payment':
                return 'Menunggu Pembayaran';
            case 'expired':
                return 'Kedaluwarsa';
            case 'cancelled':
                return 'Dibatalkan';
            default:
                return status ?? 'Status';
        }
    };

    const filteredBookings = useMemo(() => {
        return bookings.filter((booking) => {
            const statusMatch = activeStatus === 'all' ? true : booking.status === activeStatus;
            const typeMatch = activeType === 'all' ? true : booking.type === activeType;
            const haystack = `${booking.title ?? ''} ${booking.city_name ?? ''} ${booking.address ?? ''}`.toLowerCase();
            const queryMatch = query.trim().length === 0 ? true : haystack.includes(query.toLowerCase());
            return statusMatch && typeMatch && queryMatch;
        });
    }, [bookings, activeStatus, activeType, query]);

    const formatIdr = (value?: number | string | null) => {
        const numeric = Number(value);
        if (!Number.isFinite(numeric)) return '-';
        return `Rp ${numeric.toLocaleString('id-ID')}`;
    };

    return (
        <div className="min-h-screen bg-[#f4f6f8] text-slate-900">
            <Head title="Riwayat Pesanan">
                <link href="https://fonts.bunny.net/css?family=plus-jakarta-sans:400,500,600,700|space-grotesk:500,600,700" rel="stylesheet" />
            </Head>

            <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
                <div className="mx-auto flex w-full max-w-6xl items-center gap-6 px-4 py-4 md:px-8">
                    <div className="flex items-center gap-2">
                        <Link href="/"><img src="/logo.png" alt="Indotix" className="h-11 w-36 object-contain" /></Link>
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
                    <div className="flex items-center gap-4 text-sm font-semibold text-slate-600">
                        <Link href="/settings/profile" className="flex items-center gap-2 hover:text-sky-600">
                            <UserCircle className="h-4 w-4" />
                            Profile
                        </Link>
                        <Link href="/history" className="flex items-center gap-2 text-sky-600">
                            <HistoryIcon className="h-4 w-4" />
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
                </div>
                <div className="border-t border-slate-100">
                    <div className="mx-auto flex w-full max-w-6xl items-center gap-6 px-4 py-3 md:px-8">
                        {categories.map((item) => (
                            <Link key={item.label} href={item.href} className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900">
                                <item.icon className="h-4 w-4" />
                                {item.label}
                            </Link>
                        ))}
                    </div>
                </div>
                <div className="border-t border-slate-100">
                    <div className="mx-auto flex w-full max-w-6xl flex-wrap gap-2 px-4 py-3 md:px-8">
                        {chips.map((chip) => (
                            <span key={chip} className="rounded-full bg-slate-100 px-4 py-1 text-xs font-medium text-slate-600">
                                {chip}
                            </span>
                        ))}
                    </div>
                </div>
            </header>

            <main className="mx-auto w-full max-w-6xl px-4 py-10 md:px-8">
                <div className="rounded-2xl bg-white p-6 shadow-sm">
                    <div className="flex items-start justify-between gap-6">
                        <div>
                            <h1 className="text-2xl font-semibold text-slate-900">Riwayat Pesanan</h1>
                            <p className="mt-2 text-sm text-slate-500">Lihat semua transaksi dan lanjutkan pembayaran jika masih tertunda.</p>
                        </div>
                        <div className="hidden items-center gap-2 rounded-full bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-700 md:flex">
                            <HistoryIcon className="h-4 w-4" />
                            {filteredBookings.length} Pesanan
                        </div>
                    </div>
                </div>

                <div className="mt-6 rounded-2xl bg-white p-5 shadow-sm">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                            <Filter className="h-4 w-4 text-sky-500" />
                            Filter Riwayat
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {[
                                { id: 'all', label: 'Semua' },
                                { id: 'hotel', label: 'Hotel' },
                                { id: 'wisata', label: 'Wisata' },
                                { id: 'event', label: 'Event' },
                                { id: 'souvenir', label: 'Souvenir' },
                                { id: 'special_program', label: 'Special Program' },
                            ].map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => setActiveType(item.id as any)}
                                    className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                                        activeType === item.id
                                            ? 'bg-sky-600 text-white'
                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                                >
                                    {item.label}
                                </button>
                            ))}
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {[
                                { id: 'all', label: 'Semua' },
                                { id: 'pending_payment', label: 'Menunggu Pembayaran' },
                                { id: 'paid', label: 'Lunas' },
                                { id: 'expired', label: 'Kedaluwarsa' },
                                { id: 'cancelled', label: 'Dibatalkan' },
                            ].map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => setActiveStatus(item.id as any)}
                                    className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                                        activeStatus === item.id
                                            ? 'bg-sky-600 text-white'
                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                                >
                                    {item.label}
                                </button>
                            ))}
                        </div>
                        <div className="flex w-full items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm md:w-64">
                            <input
                                value={query}
                                onChange={(event) => setQuery(event.target.value)}
                                placeholder="Cari hotel atau kota"
                                className="w-full bg-transparent outline-none"
                            />
                        </div>
                    </div>
                </div>

                {filteredBookings.length === 0 && (
                    <div className="mt-6 rounded-2xl border border-slate-100 bg-white p-8 text-center shadow-sm">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-sky-50 text-sky-600">
                            <HistoryIcon className="h-6 w-6" />
                        </div>
                        <h2 className="mt-4 text-lg font-semibold text-slate-900">Belum ada riwayat</h2>
                        <p className="mt-2 text-sm text-slate-500">Yuk mulai jelajah hotel favoritmu di INDOTIX.</p>
                        <Link href="/stay" className="mt-4 inline-block rounded-lg bg-sky-600 px-5 py-2 text-sm font-semibold text-white">
                            Cari Hotel
                        </Link>
                    </div>
                )}

                {filteredBookings.length > 0 && (
                    <div className="mt-6 grid gap-5">
                        {filteredBookings.map((booking) => (
                            <div key={booking.id} className="rounded-2xl bg-white p-6 shadow-sm">
                                <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                                    <div className="flex items-start gap-4">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sky-100 text-sky-600">
                                            <Ticket className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <h3 className="text-lg font-semibold text-slate-900">{booking.title ?? 'Pesanan'}</h3>
                                                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusBadge(booking.status)}`}>
                                                    {statusLabel(booking.status)}
                                                </span>
                                                {booking.type && (
                                                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                                                        {booking.type === 'hotel'
                                                            ? 'Hotel'
                                                            : booking.type === 'event'
                                                                ? 'Event'
                                                                : booking.type === 'souvenir'
                                                                    ? 'Souvenir'
                                                                    : booking.type === 'special_program'
                                                                        ? 'Special Program'
                                                                    : 'Wisata'}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                                                <span className="flex items-center gap-1">
                                                    <MapPin className="h-4 w-4 text-sky-500" />
                                                    {booking.city_name ?? booking.address ?? 'Indonesia'}
                                                </span>
                                                {booking.type === 'hotel' ? (
                                                    <>
                                                        <span className="flex items-center gap-1">
                                                            <CalendarCheck className="h-4 w-4 text-sky-500" />
                                                            {booking.check_in} → {booking.check_out}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <Users className="h-4 w-4 text-sky-500" />
                                                            {booking.rooms_count} kamar · {booking.guests_count} tamu
                                                        </span>
                                                    </>
                                                ) : booking.type === 'souvenir' ? (
                                                    <>
                                                        <span className="flex items-center gap-1">
                                                            <CalendarCheck className="h-4 w-4 text-sky-500" />
                                                            Souvenir
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <Users className="h-4 w-4 text-sky-500" />
                                                            {booking.quantity ?? 0} item
                                                        </span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <span className="flex items-center gap-1">
                                                            <CalendarCheck className="h-4 w-4 text-sky-500" />
                                                            {booking.visit_date}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <Users className="h-4 w-4 text-sky-500" />
                                                            {booking.quantity} tiket
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                                                {booking.type === 'hotel' && (
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="h-4 w-4 text-slate-400" />
                                                        {booking.nights} malam
                                                    </span>
                                                )}
                                                <span className="flex items-center gap-1">
                                                    <CreditCard className="h-4 w-4 text-slate-400" />
                                                    Status pembayaran: {booking.payment_status ?? 'pending'}
                                                </span>
                                                {booking.payment_deadline && (
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="h-4 w-4 text-slate-400" />
                                                        Batas bayar: {new Date(booking.payment_deadline).toLocaleString('id-ID')}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="mt-4 grid gap-2 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
                                                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                                                    <span>ID Pesanan: {booking.midtrans_order_id ?? `INDOTIX-${booking.id}`}</span>
                                                    {booking.created_at && <span>Dibuat: {new Date(booking.created_at).toLocaleString('id-ID')}</span>}
                                                </div>
                                                <div className="grid gap-1 text-sm text-slate-600">
                                                    <span className="font-semibold text-slate-800">Data Tamu</span>
                                                    <div>{booking.guest_name ?? '-'}</div>
                                                    <div>{booking.guest_email ?? '-'}</div>
                                                    <div>{booking.guest_phone ?? '-'}</div>
                                                    {(booking.type === 'wisata' || booking.type === 'event' || booking.type === 'special_program') && booking.ticket_name && (
                                                        <div className="text-slate-500">Tiket: {booking.ticket_name}</div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-start gap-3 lg:items-end">
                                        <div className="text-right">
                                            <div className="text-xs text-slate-500">Total Pembayaran</div>
                                            <div className="text-lg font-semibold text-sky-600">
                                                {formatIdr(booking.total)}
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {booking.status === 'pending_payment' && booking.payment_url && (
                                                <Link
                                                    href={booking.payment_url}
                                                    className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white"
                                                >
                                                    Lanjutkan Pembayaran
                                                </Link>
                                            )}
                                            {booking.detail_url && (
                                                <Link
                                                    href={booking.detail_url}
                                                    className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-sky-300 hover:text-sky-600"
                                                >
                                                    Lihat Detail
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

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
        </div>
    );
}
