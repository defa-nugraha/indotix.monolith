import { Head, Link, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { CheckCircle, Clock, CreditCard, Loader2, ShoppingCart } from 'lucide-react';

type Booking = {
    id: number;
    encrypted_id: string;
    booking_code: string;
    quantity: number;
    total: number;
    status: string;
    payment_status?: string | null;
    payment_deadline?: string | null;
    qr_url?: string | null;
    qr_data?: string | null;
    ticket: { id: number; name: string };
    class: { id: number; title: string; location?: string | null; start_at?: string | null };
    guest: { name: string; email: string; phone: string };
};

export default function AcademyBookingShow({ booking }: { booking: Booking }) {
    const { auth, unread_notifications, souvenir_cart_count } = usePage().props as { auth?: { user?: any }; unread_notifications?: number; souvenir_cart_count?: number };
    const [isDownloading, setIsDownloading] = useState(false);
    const formatIdr = (value?: number | string | null) => {
        const numeric = Number(value);
        if (!Number.isFinite(numeric)) return '-';
        return `Rp ${numeric.toLocaleString('id-ID')}`;
    };

    const isPaid = ['paid', 'completed'].includes(booking.status)
        || ['settlement', 'capture', 'success', 'paid'].includes((booking.payment_status ?? '').toString());

    return (
        <div className="min-h-screen bg-[#f4f6f8] text-slate-900">
            <Head title="Detail Booking Academy">
                <link
                    href="https://fonts.bunny.net/css?family=plus-jakarta-sans:400,500,600,700|space-grotesk:500,600,700"
                    rel="stylesheet"
                />
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
                    {auth?.user ? (
                        <div className="flex items-center gap-4 text-sm font-semibold text-slate-600">
                            <Link href="/settings/profile" className="hover:text-sky-600">Profile</Link>
                            <Link href="/history" className="hover:text-sky-600">Riwayat</Link>
                            <Link href="/chat" className="hover:text-sky-600">Chat</Link>
                            <Link href="/notifications" className="relative hover:text-sky-600">
                                Notifikasi
                                {Boolean(unread_notifications) && (
                                    <span className="absolute -right-4 -top-2 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                                        {unread_notifications}
                                    </span>
                                )}
                            </Link>
                        </div>
                    ) : null}
                </div>
            </header>

            <main className="mx-auto w-full max-w-6xl px-4 py-10 md:px-8">
                <div className="grid gap-6 lg:grid-cols-[1.25fr_0.9fr]">
                    <div className="space-y-6">
                        <div className="rounded-2xl bg-white p-6 shadow-sm">
                            <h1 className="text-2xl font-semibold text-slate-900">Detail Booking Academy</h1>
                            <p className="mt-2 text-sm text-slate-500">Ringkasan pesanan kelas kamu.</p>
                            <div className="mt-6 grid gap-4 text-sm text-slate-600">
                                <div className="flex items-center justify-between">
                                    <span>Kelas</span>
                                    <span className="font-semibold text-slate-900">{booking.class.title}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span>Lokasi</span>
                                    <span className="font-semibold text-slate-900">{booking.class.location ?? '-'}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span>Tiket</span>
                                    <span className="font-semibold text-slate-900">{booking.ticket.name}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span>Jumlah</span>
                                    <span className="font-semibold text-slate-900">{booking.quantity}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span>Status</span>
                                    <span className="font-semibold text-slate-900">{booking.status}</span>
                                </div>
                                <div className="flex items-center justify-between border-t border-slate-200 pt-3">
                                    <span>Total</span>
                                    <span className="text-lg font-semibold text-sky-600">{formatIdr(booking.total)}</span>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-2xl bg-white p-6 shadow-sm">
                            <h2 className="text-lg font-semibold text-slate-900">Data Pemesan</h2>
                            <div className="mt-4 grid gap-3 text-sm text-slate-600">
                                <div>{booking.guest.name ?? '-'}</div>
                                <div>{booking.guest.email ?? '-'}</div>
                                <div>{booking.guest.phone ?? '-'}</div>
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
                                    href={`/academy/booking/${booking.encrypted_id}/payment`}
                                    className="mt-4 block rounded-lg bg-sky-600 px-4 py-2 text-center text-sm font-semibold text-white"
                                >
                                    Lanjutkan Pembayaran
                                </Link>
                            )}
                            {isPaid && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (isDownloading) return;
                                        setIsDownloading(true);
                                        window.open(`/academy/booking/${booking.encrypted_id}/ticket`, '_blank');
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

                        {isPaid && booking.qr_url && (
                            <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm">
                                <div className="text-sm font-semibold text-slate-900">QR Validasi Tiket</div>
                                <img src={booking.qr_url} alt="QR Tiket" className="mx-auto mt-3 h-44 w-44" />
                                {booking.qr_data && (
                                    <div className="mt-2 text-xs text-slate-500">Kode: {booking.qr_data}</div>
                                )}
                                <div className="mt-2 text-xs text-slate-500">Tunjukkan QR ini saat check-in.</div>
                            </div>
                        )}
                    </aside>
                </div>
            </main>
        </div>
    );
}
