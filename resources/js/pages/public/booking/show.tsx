import { Head, Link, router, usePage } from '@inertiajs/react';
import Swal from 'sweetalert2';
import {
    Bell,
    CalendarCheck,
    Clock,
    CreditCard,
    History as HistoryIcon,
    MapPin,
    MessageCircle,
    ShoppingBag,
    Star,
    Ticket,
    UserCircle,
    Users,
    MapPinned,
    Mail,
    Phone,
    CheckCircle,
} from 'lucide-react';

type Booking = {
    id: number;
    encrypted_id?: string;
    status: string;
    payment_status?: string | null;
    payment_deadline?: string | null;
    qr_url?: string | null;
    qr_data?: string | null;
    hotel: { name?: string | null; address?: string | null };
    check_in: string;
    check_out: string;
    nights: number;
    rooms_count: number;
    guests_count: number;
    total: number;
    guest_name?: string | null;
    guest_email?: string | null;
    guest_phone?: string | null;
    rooms: { room_type?: string | null; rooms_count: number; price_per_night?: number | null; subtotal?: number | null }[];
    payment?: { status?: string | null; payment_type?: string | null } | null;
};

export default function BookingShow({ booking }: { booking: Booking }) {
    const { auth, unread_notifications } = usePage().props as { auth?: { user?: any }; unread_notifications?: number };

    const categories = [
        { label: 'Wisata', icon: MapPinned, href: '/wisata' },
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

    return (
        <div className="min-h-screen bg-[#f4f6f8] text-slate-900">
            <Head title="Detail Booking">
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
                                    <h1 className="text-2xl font-semibold text-slate-900">Detail Booking</h1>
                                    <p className="mt-2 text-sm text-slate-500">Cek informasi booking dan status pembayaran kamu.</p>
                                </div>
                                <span className={`rounded-full px-4 py-2 text-xs font-semibold ${statusBadge(booking.status)}`}>
                                    {statusLabel(booking.status)}
                                </span>
                            </div>
                            <div className="mt-4 grid gap-2 text-sm text-slate-600">
                                <div className="flex items-center gap-2">
                                    <Ticket className="h-4 w-4 text-sky-500" />
                                    {booking.hotel.name}
                                </div>
                                <div className="flex items-center gap-2">
                                    <MapPin className="h-4 w-4 text-sky-500" />
                                    {booking.hotel.address}
                                </div>
                                <div className="flex items-center gap-2">
                                    <CalendarCheck className="h-4 w-4 text-sky-500" />
                                    {booking.check_in} → {booking.check_out} · {booking.nights} malam
                                </div>
                                <div className="flex items-center gap-2">
                                    <Users className="h-4 w-4 text-sky-500" />
                                    {booking.rooms_count} kamar · {booking.guests_count} tamu
                                </div>
                            </div>
                            <div className="mt-4 text-lg font-semibold text-sky-600">Rp {booking.total.toLocaleString('id-ID')}</div>
                        </div>

                        <div className="rounded-2xl bg-white p-6 shadow-sm">
                            <h2 className="text-lg font-semibold text-slate-900">Detail Kamar</h2>
                            <div className="mt-4 grid gap-3">
                                {booking.rooms.map((room, index) => (
                                    <div key={`${room.room_type ?? 'room'}-${index}`} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 px-4 py-3 text-sm">
                                        <div>
                                            <div className="font-semibold text-slate-900">{room.room_type ?? 'Tipe kamar'}</div>
                                            <div className="text-xs text-slate-500">{room.rooms_count} kamar</div>
                                        </div>
                                        <div className="text-right text-sm text-slate-600">
                                            <div>Rp {room.price_per_night?.toLocaleString('id-ID') ?? '-'}/malam</div>
                                            <div className="font-semibold text-slate-900">Rp {room.subtotal?.toLocaleString('id-ID') ?? '-'}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="rounded-2xl bg-white p-6 shadow-sm">
                            <h2 className="text-lg font-semibold text-slate-900">Data Tamu</h2>
                            <div className="mt-4 grid gap-3 text-sm text-slate-600">
                                <div className="flex items-center gap-2">
                                    <UserCircle className="h-4 w-4 text-sky-500" />
                                    {booking.guest_name ?? '-'}
                                </div>
                                <div className="flex items-center gap-2">
                                    <Mail className="h-4 w-4 text-sky-500" />
                                    {booking.guest_email ?? '-'}
                                </div>
                                <div className="flex items-center gap-2">
                                    <Phone className="h-4 w-4 text-sky-500" />
                                    {booking.guest_phone ?? '-'}
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
                                    href={`/booking/${booking.encrypted_id ?? booking.id}/payment`}
                                    className="mt-4 block rounded-lg bg-sky-600 px-4 py-2 text-center text-sm font-semibold text-white"
                                >
                                    Lanjutkan Pembayaran
                                </Link>
                            )}
                            {(booking.status === 'paid' || booking.status === 'completed') && booking.qr_url && (
                                <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4 text-center">
                                    <div className="text-sm font-semibold text-slate-900">QR Validasi Check-in</div>
                                    <img src={booking.qr_url} alt="QR Booking" className="mx-auto mt-3 h-44 w-44" />
                                    {booking.qr_data && (
                                        <div className="mt-2 text-xs text-slate-500">Kode: {booking.qr_data}</div>
                                    )}
                                    <div className="mt-2 text-xs text-slate-500">Tunjukkan QR ini saat check-in.</div>
                                </div>
                            )}
                            <a
                                href={`/booking/${booking.encrypted_id ?? booking.id}/invoice`}
                                className="mt-3 block rounded-lg border border-slate-200 px-4 py-2 text-center text-sm font-semibold text-slate-700 hover:border-sky-300 hover:text-sky-600"
                            >
                                Download Invoice
                            </a>
                            {booking.status === 'pending_payment' && (
                                <button
                                    type="button"
                                    className="mt-3 w-full rounded-lg border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-600 hover:border-rose-300"
                                    onClick={() => {
                                        Swal.fire({
                                            title: 'Batalkan pesanan?',
                                            text: 'Kamar akan dilepas dan pesanan tidak bisa dilanjutkan.',
                                            icon: 'warning',
                                            showCancelButton: true,
                                            confirmButtonText: 'Ya, batalkan',
                                            cancelButtonText: 'Batal',
                                        }).then((result) => {
                                            if (!result.isConfirmed) return;
                                            router.post(`/booking/${booking.encrypted_id ?? booking.id}/cancel`, {}, {
                                                onSuccess: () => Swal.fire({ title: 'Dibatalkan', text: 'Pesanan berhasil dibatalkan.', icon: 'success' }),
                                                onError: (errors) =>
                                                    Swal.fire({ title: 'Gagal', text: errors.cancel ?? 'Pesanan gagal dibatalkan.', icon: 'error' }),
                                            });
                                        });
                                    }}
                                >
                                    Batalkan Pesanan
                                </button>
                            )}
                        </div>

                        <div className="rounded-2xl bg-white p-6 shadow-sm">
                            <h3 className="text-sm font-semibold text-slate-900">Butuh Bantuan?</h3>
                            <p className="mt-2 text-sm text-slate-600">Tim kami siap membantu proses booking kamu.</p>
                            <div className="mt-4 space-y-2 text-sm text-slate-600">
                                <div className="flex items-center gap-2">
                                    <Phone className="h-4 w-4 text-sky-500" />
                                    0812 9205 9888
                                </div>
                                <div className="flex items-center gap-2">
                                    <Mail className="h-4 w-4 text-sky-500" />
                                    info@indotix.co.id
                                </div>
                            </div>
                        </div>
                    </aside>
                </div>
            </main>

            <footer className="mt-10 border-t border-slate-200 bg-white">
                <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-10 md:grid-cols-4 md:px-8">
                    <div>
                        <img src="/logo.png" alt="Indotix" className="h-8" />
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
