import { Head, Link, usePage } from '@inertiajs/react';
import { useState } from 'react';
import PublicLayout from '@/layouts/public-layout';
import { guardPurchaseByRole } from '@/lib/purchase-guard';
import {
    CalendarCheck,
    CheckCircle,
    Clock,
    CreditCard,
    Loader2,
    Mail,
    MapPin,
    MapPinned,
    Phone,
    ScanLine,
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
    ticket: { name: string };
    items?: Array<{
        ticket_id: number;
        name: string;
        quantity: number;
        unit_price: number;
        subtotal: number;
    }>;
    destination: { name: string; address?: string | null };
    guest: { name: string; email: string; phone: string };
    review?: { can_review?: boolean; url?: string | null } | null;
};

export default function WisataBookingShow({ booking }: { booking: Booking }) {
    const { auth, unread_notifications, souvenir_cart_count } = usePage()
        .props as {
        auth?: { user?: { role?: string } };
        unread_notifications?: number;
        souvenir_cart_count?: number;
    };
    const role = auth?.user?.role;
    const isUser = Boolean(auth?.user?.role === 'user');
    const [isDownloading, setIsDownloading] = useState(false);
    const ticketItems =
        booking.items && booking.items.length > 0
            ? booking.items
            : [
                  {
                      ticket_id: 0,
                      name: booking.ticket.name,
                      quantity: booking.quantity,
                      unit_price: booking.unit_price,
                      subtotal: booking.total,
                  },
              ];

    const categories = [{ label: 'Wisata', icon: MapPinned, href: '/wisata' }];

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
        <PublicLayout
            categories={categories}
            chips={chips}
            showCategories={false}
            showChips={false}
        >
            <Head title="Detail Booking Wisata">
                <link
                    href="https://fonts.bunny.net/css?family=plus-jakarta-sans:400,500,600,700|space-grotesk:500,600,700"
                    rel="stylesheet"
                />
            </Head>
            <main className="mx-auto w-full max-w-7xl px-4 py-10 md:px-8">
                <div className="mx-auto mb-8 w-full max-w-3xl overflow-x-auto pb-2">
                    <div className="relative z-0 flex min-w-[20rem] items-center justify-between">
                        <div className="absolute top-1/2 right-0 left-0 z-0 h-1 -translate-y-1/2 bg-slate-200" />
                        <div className="absolute top-1/2 left-0 z-0 h-1 w-full -translate-y-1/2 bg-sky-600" />
                        {[
                            ['✓', 'Detail'],
                            ['✓', 'Pembayaran'],
                            ['3', 'Selesai'],
                        ].map(([number, label], index) => (
                            <div
                                key={label}
                                className={`relative z-10 flex min-h-9 items-center gap-2 rounded-full border bg-white px-2.5 py-1 text-xs font-bold shadow-sm sm:px-3 ${
                                    index === 2
                                        ? 'border-emerald-200 text-emerald-700 ring-2 ring-emerald-100'
                                        : 'border-slate-200 text-slate-500'
                                }`}
                            >
                                <span
                                    className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${
                                        index < 2
                                            ? 'bg-emerald-600 text-white'
                                            : 'bg-sky-600 text-white'
                                    }`}
                                >
                                    {number}
                                </span>
                                <span className="hidden min-[360px]:inline">
                                    {label}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="grid gap-8 lg:grid-cols-[1.25fr_0.9fr]">
                    <div className="space-y-6">
                        <div className="rounded-[28px] border border-slate-100 bg-white p-6 shadow-[0_24px_70px_-36px_rgba(15,23,42,0.34)]">
                            <div className="flex flex-wrap items-center justify-between gap-4">
                                <div>
                                    <h1 className="font-['Space_Grotesk'] text-2xl font-black text-slate-950">
                                        Detail Booking Wisata
                                    </h1>
                                    <p className="mt-2 text-sm text-slate-500">
                                        Cek informasi tiket dan status
                                        pembayaran kamu.
                                    </p>
                                </div>
                                <span
                                    className={`rounded-full px-4 py-2 text-xs font-semibold ${statusBadge(booking.status)}`}
                                >
                                    {statusLabel(booking.status)}
                                </span>
                            </div>
                            <div className="mt-4 grid gap-2 text-sm text-slate-600">
                                <div className="flex min-w-0 items-start gap-2">
                                    <Ticket className="h-4 w-4 text-sky-500" />
                                    <span className="min-w-0 break-words">
                                        {booking.destination.name}
                                    </span>
                                </div>
                                <div className="flex min-w-0 items-start gap-2">
                                    <MapPin className="h-4 w-4 text-sky-500" />
                                    <span className="min-w-0 break-words">
                                        {booking.destination.address ??
                                            'Indonesia'}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <CalendarCheck className="h-4 w-4 text-sky-500" />
                                    {booking.visit_date}
                                </div>
                                <div className="flex items-center gap-2">
                                    <Users className="h-4 w-4 text-sky-500" />
                                    {booking.quantity} tiket ·{' '}
                                    {ticketItems.length} jenis
                                </div>
                            </div>
                            <div className="mt-4 text-lg font-semibold text-sky-600">
                                Rp {booking.total.toLocaleString('id-ID')}
                            </div>
                        </div>

                        <div className="rounded-[28px] border border-slate-100 bg-white p-6 shadow-sm">
                            <h2 className="text-lg font-semibold text-slate-900">
                                Detail Tiket
                            </h2>
                            <div className="mt-4 grid gap-3">
                                {ticketItems.map((item) => (
                                    <div
                                        key={item.ticket_id}
                                        className="flex flex-col gap-3 rounded-xl border border-slate-200 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between"
                                    >
                                        <div>
                                            <div className="font-semibold text-slate-900">
                                                {item.name}
                                            </div>
                                            <div className="text-xs text-slate-500">
                                                {item.quantity} tiket
                                            </div>
                                        </div>
                                        <div className="text-left text-sm text-slate-600 sm:text-right">
                                            <div>
                                                Rp{' '}
                                                {item.unit_price.toLocaleString(
                                                    'id-ID',
                                                )}
                                                /tiket
                                            </div>
                                            <div className="font-semibold text-slate-900">
                                                Rp{' '}
                                                {item.subtotal.toLocaleString(
                                                    'id-ID',
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="rounded-[28px] border border-slate-100 bg-white p-6 shadow-sm">
                            <h2 className="text-lg font-semibold text-slate-900">
                                Data Tamu
                            </h2>
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
                        <div className="rounded-[28px] border border-slate-100 bg-white p-6 shadow-[0_24px_70px_-36px_rgba(15,23,42,0.34)]">
                            <div className="flex items-center gap-2 rounded-xl bg-sky-50 px-3 py-2 text-sm font-semibold text-sky-700">
                                <CheckCircle className="h-4 w-4" />
                                Booking kamu tercatat aman di INDOTIX
                            </div>
                            <div className="mt-4 space-y-2 text-sm text-slate-600">
                                <div className="flex items-center gap-2">
                                    <CreditCard className="h-4 w-4 text-slate-400" />
                                    Status pembayaran:{' '}
                                    {booking.payment_status ?? 'pending'}
                                </div>
                                {booking.payment_deadline && (
                                    <div className="flex items-center gap-2">
                                        <Clock className="h-4 w-4 text-slate-400" />
                                        Batas bayar:{' '}
                                        {new Date(
                                            booking.payment_deadline,
                                        ).toLocaleString('id-ID')}
                                    </div>
                                )}
                            </div>
                            {booking.status === 'pending_payment' && (
                                <Link
                                    href={`/wisata/booking/${booking.encrypted_id}/payment`}
                                    className="mt-4 block rounded-lg bg-sky-600 px-4 py-2 text-center text-sm font-semibold text-white"
                                    onClick={(event) => {
                                        if (guardPurchaseByRole(role)) {
                                            event.preventDefault();
                                        }
                                    }}
                                >
                                    Lanjutkan Pembayaran
                                </Link>
                            )}
                            {(booking.status === 'paid' ||
                                booking.status === 'completed') && (
                                <div className="mt-3 grid grid-cols-[minmax(0,1fr)_auto] gap-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (isDownloading) return;
                                            setIsDownloading(true);
                                            window.open(
                                                `/wisata/booking/${booking.encrypted_id}/ticket`,
                                                '_blank',
                                            );
                                            window.setTimeout(
                                                () => setIsDownloading(false),
                                                8000,
                                            );
                                        }}
                                        className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-center text-sm font-semibold text-slate-700 hover:border-sky-300 hover:text-sky-600"
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
                                    <Link
                                        href="/tickets/scan"
                                        aria-label="Scan QR masuk mitra"
                                        className="grid h-10 w-10 place-items-center rounded-lg bg-sky-600 text-white shadow-sm hover:bg-sky-700"
                                    >
                                        <ScanLine className="h-5 w-5" />
                                    </Link>
                                </div>
                            )}
                            {booking.review?.can_review &&
                                booking.review?.url && (
                                    <Link
                                        href={booking.review.url}
                                        className="mt-3 block rounded-lg border border-slate-200 px-4 py-2 text-center text-sm font-semibold text-slate-700 hover:border-sky-300 hover:text-sky-600"
                                    >
                                        Beri Ulasan
                                    </Link>
                                )}
                        </div>

                        {(booking.status === 'paid' ||
                            booking.status === 'completed') && (
                            <div className="rounded-2xl border border-sky-100 bg-sky-50/70 p-4 shadow-sm">
                                <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                                    <ScanLine className="h-4 w-4 text-sky-600" />
                                    Cara menggunakan tiket
                                </div>
                                <ol className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
                                    <li>1. Datang sesuai tanggal kunjungan.</li>
                                    <li>2. Buka menu Scan Tiket di Indotix.</li>
                                    <li>
                                        3. Scan QR masuk yang disediakan mitra
                                        wisata.
                                    </li>
                                    <li>
                                        4. Pilih tiket yang ingin digunakan.
                                    </li>
                                </ol>
                                <Link
                                    href="/tickets/scan"
                                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700"
                                >
                                    <ScanLine className="h-4 w-4" />
                                    Scan QR Masuk
                                </Link>
                            </div>
                        )}
                    </aside>
                </div>
            </main>
        </PublicLayout>
    );
}
