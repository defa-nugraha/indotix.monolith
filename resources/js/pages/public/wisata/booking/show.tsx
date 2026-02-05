import { Head, Link, usePage } from '@inertiajs/react';
import { useState } from 'react';
import {
    Bell,
    CalendarCheck,
    CheckCircle,
    Clock,
    CreditCard,
    History as HistoryIcon,
    Loader2,
    Mail,
    MapPin,
    MapPinned,
    MessageCircle,
    Phone,
    ShoppingBag,
    ShoppingCart,
    Star,
    Ticket,
    UserCircle,
    Users,
} from 'lucide-react';

type Booking = {
    encrypted_id: string;
    booking_code: string;
    visit_date: string;
    quantity: number;
    unit_price: number;
    total: number;
    status: string;
    payment_status?: string | null;
    payment_deadline?: string | null;
    qr_url?: string | null;
    qr_data?: string | null;
    ticket: { name: string };
    destination: { name: string; address?: string | null };
    guest: { name: string; email: string; phone: string };
};

export default function WisataBookingShow({ booking }: { booking: Booking }) {
    const { auth, unread_notifications, souvenir_cart_count } = usePage().props as { auth?: { user?: { role?: string } }; unread_notifications?: number; souvenir_cart_count?: number };
    const isUser = Boolean(auth?.user?.role === 'user');
    const [isDownloading, setIsDownloading] = useState(false);

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

    return (
        <div className="min-h-screen bg-[#f4f6f8] text-slate-900">
            <Head title="Detail Booking Wisata">
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
                <div className="grid gap-6 lg:grid-cols-[1.25fr_0.9fr]">
                    <div className="space-y-6">
                        <div className="rounded-2xl bg-white p-6 shadow-sm">
                            <div className="flex flex-wrap items-center justify-between gap-4">
                                <div>
                                    <h1 className="text-2xl font-semibold text-slate-900">Detail Booking Wisata</h1>
                                    <p className="mt-2 text-sm text-slate-500">Cek informasi tiket dan status pembayaran kamu.</p>
                                </div>
                                <span className={`rounded-full px-4 py-2 text-xs font-semibold ${statusBadge(booking.status)}`}>
                                    {statusLabel(booking.status)}
                                </span>
                            </div>
                            <div className="mt-4 grid gap-2 text-sm text-slate-600">
                                <div className="flex items-center gap-2">
                                    <Ticket className="h-4 w-4 text-sky-500" />
                                    {booking.destination.name}
                                </div>
                                <div className="flex items-center gap-2">
                                    <MapPin className="h-4 w-4 text-sky-500" />
                                    {booking.destination.address ?? 'Indonesia'}
                                </div>
                                <div className="flex items-center gap-2">
                                    <CalendarCheck className="h-4 w-4 text-sky-500" />
                                    {booking.visit_date}
                                </div>
                                <div className="flex items-center gap-2">
                                    <Users className="h-4 w-4 text-sky-500" />
                                    {booking.quantity} tiket
                                </div>
                            </div>
                            <div className="mt-4 text-lg font-semibold text-sky-600">Rp {booking.total.toLocaleString('id-ID')}</div>
                        </div>

                        <div className="rounded-2xl bg-white p-6 shadow-sm">
                            <h2 className="text-lg font-semibold text-slate-900">Detail Tiket</h2>
                            <div className="mt-4 grid gap-3">
                                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 px-4 py-3 text-sm">
                                    <div>
                                        <div className="font-semibold text-slate-900">{booking.ticket.name}</div>
                                        <div className="text-xs text-slate-500">{booking.quantity} tiket</div>
                                    </div>
                                    <div className="text-right text-sm text-slate-600">
                                        <div>Rp {booking.unit_price.toLocaleString('id-ID')}/tiket</div>
                                        <div className="font-semibold text-slate-900">Rp {booking.total.toLocaleString('id-ID')}</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-2xl bg-white p-6 shadow-sm">
                            <h2 className="text-lg font-semibold text-slate-900">Data Tamu</h2>
                            <div className="mt-4 grid gap-3 text-sm text-slate-600">
                                <div className="flex items-center gap-2">
                                    <UserCircle className="h-4 w-4 text-sky-500" />
                                    {booking.guest.name ?? '-'}
                                </div>
                                <div className="flex items-center gap-2">
                                    <Mail className="h-4 w-4 text-sky-500" />
                                    {booking.guest.email ?? '-'}
                                </div>
                                <div className="flex items-center gap-2">
                                    <Phone className="h-4 w-4 text-sky-500" />
                                    {booking.guest.phone ?? '-'}
                                </div>
                            </div>
                        </div>
                    </div>

                    <aside className="space-y-6">
                        <div className="rounded-2xl bg-white p-6 shadow-sm">
                            <div className="flex items-center gap-2 rounded-xl bg-sky-50 px-3 py-2 text-sm font-semibold text-sky-700">
                                <CheckCircle className="h-4 w-4" />
                                Booking kamu tercatat aman di INDOTIX
                            </div>
                            <div className="mt-4 space-y-2 text-sm text-slate-600">
                                <div className="flex items-center gap-2">
                                    <CreditCard className="h-4 w-4 text-slate-400" />
                                    Status pembayaran: {booking.payment_status ?? 'pending'}
                                </div>
                                {booking.payment_deadline && (
                                    <div className="flex items-center gap-2">
                                        <Clock className="h-4 w-4 text-slate-400" />
                                        Batas bayar: {new Date(booking.payment_deadline).toLocaleString('id-ID')}
                                    </div>
                                )}
                            </div>
                            {booking.status === 'pending_payment' && (
                                <Link
                                    href={`/wisata/booking/${booking.encrypted_id}/payment`}
                                    className="mt-4 block rounded-lg bg-sky-600 px-4 py-2 text-center text-sm font-semibold text-white"
                                >
                                    Lanjutkan Pembayaran
                                </Link>
                            )}
                            {(booking.status === 'paid' || booking.status === 'completed') && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (isDownloading) return;
                                        setIsDownloading(true);
                                        window.open(`/wisata/booking/${booking.encrypted_id}/ticket`, '_blank');
                                        window.setTimeout(() => setIsDownloading(false), 8000);
                                    }}
                                    className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-center text-sm font-semibold text-slate-700 hover:border-sky-300 hover:text-sky-600"
                                >
                                    {isDownloading ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Menyiapkan tiket...
                                        </>
                                    ) : (
                                        'Download Tiket'
                                    )}
                                </button>
                            )}
                        </div>

                        {(booking.status === 'paid' || booking.status === 'completed') && booking.qr_url && (
                            <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm">
                                <div className="text-sm font-semibold text-slate-900">QR Validasi Tiket</div>
                                <img src={booking.qr_url} alt="QR Tiket" className="mx-auto mt-3 h-44 w-44" />
                                {booking.qr_data && (
                                    <div className="mt-2 text-xs text-slate-500">Kode: {booking.qr_data}</div>
                                )}
                                <div className="mt-2 text-xs text-slate-500">Tunjukkan QR ini saat validasi di lokasi.</div>
                            </div>
                        )}
                    </aside>
                </div>
            </main>
        </div>
    );
}
