import { Head, Link, usePage } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import {
    Bell,
    CalendarCheck,
    Filter,
    History as HistoryIcon,
    MapPin,
    MapPinned,
    MessageCircle,
    ShoppingBag,
    Star,
    Ticket,
    UserCircle,
    Users,
    CreditCard,
    Clock,
} from 'lucide-react';

type WisataBooking = {
    id: number;
    encrypted_id: string;
    booking_code?: string | null;
    destination_name?: string | null;
    city_name?: string | null;
    address?: string | null;
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
    ticket_name?: string | null;
};

export default function WisataHistory({ bookings = [] }: { bookings: WisataBooking[] }) {
    const { auth, unread_notifications } = usePage().props as { auth?: { user?: any }; unread_notifications?: number };
    const [activeStatus, setActiveStatus] = useState<'all' | 'pending_payment' | 'paid' | 'expired' | 'cancelled'>('all');
    const [query, setQuery] = useState('');

    const categories = [
        { label: 'Wisata', icon: MapPinned, href: '/wisata', active: true },
        { label: 'Event', icon: CalendarCheck, href: '/?tab=event' },
        { label: 'Souvenir', icon: ShoppingBag, href: '/?tab=souvenir' },
        { label: 'Spesial Program', icon: Star, href: '/?tab=spesial' },
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
            const haystack = `${booking.destination_name ?? ''} ${booking.city_name ?? ''} ${booking.address ?? ''}`.toLowerCase();
            const queryMatch = query.trim().length === 0 ? true : haystack.includes(query.toLowerCase());
            return statusMatch && queryMatch;
        });
    }, [bookings, activeStatus, query]);

    return (
        <div className="min-h-screen bg-[#f4f6f8] text-slate-900">
            <Head title="Riwayat Tiket Wisata">
                <link href="https://fonts.bunny.net/css?family=plus-jakarta-sans:400,500,600,700|space-grotesk:500,600,700" rel="stylesheet" />
            </Head>

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
                    {auth?.user && (
                        <div className="flex items-center gap-4 text-sm font-semibold text-slate-600">
                            <Link href="/settings/profile" className="flex items-center gap-2 hover:text-sky-600">
                                <UserCircle className="h-4 w-4" />
                                Profile
                            </Link>
                            <Link href="/wisata/history" className="flex items-center gap-2 text-sky-600">
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
                    )}
                </div>
                <div className="border-t border-slate-100">
                    <div className="mx-auto flex w-full max-w-6xl items-center gap-6 px-4 py-3 md:px-8">
                        {categories.map((item) => (
                            <Link
                                key={item.label}
                                href={item.href}
                                className={`flex items-center gap-2 text-sm font-semibold ${
                                    item.active ? 'text-slate-900' : 'text-slate-500 hover:text-slate-900'
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
                            <h1 className="text-2xl font-semibold text-slate-900">Riwayat Tiket Wisata</h1>
                            <p className="mt-2 text-sm text-slate-500">Cek status tiket dan lanjutkan pembayaran jika masih tertunda.</p>
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
                                placeholder="Cari destinasi atau kota"
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
                        <p className="mt-2 text-sm text-slate-500">Yuk jelajahi destinasi wisata favoritmu di INDOTIX.</p>
                        <Link href="/wisata" className="mt-4 inline-block rounded-lg bg-sky-600 px-5 py-2 text-sm font-semibold text-white">
                            Cari Wisata
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
                                                <h3 className="text-lg font-semibold text-slate-900">{booking.destination_name ?? 'Wisata'}</h3>
                                                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusBadge(booking.status)}`}>
                                                    {statusLabel(booking.status)}
                                                </span>
                                            </div>
                                            <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                                                <span className="flex items-center gap-1">
                                                    <MapPin className="h-4 w-4 text-sky-500" />
                                                    {booking.city_name ?? booking.address ?? 'Indonesia'}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <CalendarCheck className="h-4 w-4 text-sky-500" />
                                                    {booking.visit_date}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Users className="h-4 w-4 text-sky-500" />
                                                    {booking.quantity} tiket
                                                </span>
                                            </div>
                                            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500">
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
                                                    <span>ID Pesanan: {booking.midtrans_order_id ?? booking.booking_code ?? `WISATA-${booking.id}`}</span>
                                                    {booking.created_at && <span>Dibuat: {new Date(booking.created_at).toLocaleString('id-ID')}</span>}
                                                </div>
                                                <div className="grid gap-1 text-sm text-slate-600">
                                                    <span className="font-semibold text-slate-800">Data Tamu</span>
                                                    <div>{booking.guest_name ?? '-'}</div>
                                                    <div>{booking.guest_email ?? '-'}</div>
                                                    <div>{booking.guest_phone ?? '-'}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-3 text-right">
                                        <div className="text-sm text-slate-500">Total</div>
                                        <div className="text-xl font-semibold text-sky-600">
                                            {booking.total ? `Rp ${booking.total.toLocaleString('id-ID')}` : '-'}
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {booking.status === 'pending_payment' && (
                                                <Link
                                                    href={`/wisata/booking/${booking.encrypted_id}/payment`}
                                                    className="rounded-lg bg-sky-600 px-4 py-2 text-xs font-semibold text-white"
                                                >
                                                    Bayar Sekarang
                                                </Link>
                                            )}
                                            <Link
                                                href={`/wisata/booking/${booking.encrypted_id}`}
                                                className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600"
                                            >
                                                Lihat Detail
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
