import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import Swal from 'sweetalert2';
import { Bell, CalendarCheck, Ticket, Users, MapPinned, UserCircle, History, MessageCircle } from 'lucide-react';

type Booking = {
    id: number;
    encrypted_id?: string;
    status: string;
    payment_status?: string | null;
    payment_deadline?: string | null;
    hotel: { name?: string | null; address?: string | null };
    check_in: string;
    check_out: string;
    nights: number;
    rooms_count: number;
    guests_count: number;
    subtotal?: number;
    discount_amount?: number | null;
    voucher_code?: string | null;
    total: number;
    payment?: { status?: string | null; payment_type?: string | null; payload?: any } | null;
};

declare global {
    interface Window {
        snap?: {
            pay: (token: string, options?: Record<string, unknown>) => void;
        };
    }
}

export default function BookingPayment({
    booking,
    snapClientKey,
    snapScriptUrl,
}: {
    booking: Booking;
    snapClientKey: string;
    snapScriptUrl: string;
}) {
    const { auth } = usePage().props as { auth?: { user?: unknown } };
    const isUser = Boolean((auth?.user as any)?.role === 'user');
    const form = useForm({});
    const [remaining, setRemaining] = useState<number | null>(null);
    const snapOpened = useRef(false);
    const snapToken = booking.payment?.payload?.token;

    useEffect(() => {
        if (!booking.payment_deadline) return;
        const deadline = new Date(booking.payment_deadline).getTime();
        const interval = setInterval(() => {
            const diff = Math.max(0, Math.floor((deadline - Date.now()) / 1000));
            setRemaining(diff);
        }, 1000);
        return () => clearInterval(interval);
    }, [booking.payment_deadline]);

    const countdown = useMemo(() => {
        if (remaining === null) return '-';
        const minutes = Math.floor(remaining / 60);
        const seconds = remaining % 60;
        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }, [remaining]);

    useEffect(() => {
        if (!snapScriptUrl || !snapClientKey) return;
        if (document.querySelector('script[data-midtrans-snap]')) return;
        const script = document.createElement('script');
        script.src = snapScriptUrl;
        script.setAttribute('data-client-key', snapClientKey);
        script.setAttribute('data-midtrans-snap', 'true');
        script.async = true;
        script.onload = () => {
            if (snapToken && !snapOpened.current && window.snap) {
                snapOpened.current = true;
                window.snap.pay(snapToken);
            }
        };
        document.body.appendChild(script);
    }, [snapClientKey, snapScriptUrl]);

    useEffect(() => {
        if (!snapToken || snapOpened.current || !window.snap) return;
        snapOpened.current = true;
        window.snap.pay(snapToken);
    }, [snapToken]);

    return (
        <div className="min-h-screen bg-[#f4f6f8] text-slate-900">
            <Head title="Pembayaran">
                <link
                    href="https://fonts.bunny.net/css?family=plus-jakarta-sans:400,500,600,700|space-grotesk:500,600,700"
                    rel="stylesheet"
                />
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
                    {!auth?.user && (
                        <div className="flex items-center gap-2">
                            <Link
                                href="/register"
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
                            <Link href="/notifications" className="flex items-center gap-2 hover:text-sky-600">
                                <Bell className="h-4 w-4" />
                                Notifikasi
                            </Link>
                        </div>
                    )}
                </div>
                <div className="border-t border-slate-100">
                    <div className="mx-auto flex w-full max-w-6xl items-center gap-6 px-4 py-3 md:px-8 text-sm font-semibold text-slate-600">
                        <div className="flex items-center gap-2 text-slate-500">
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-500">1</span>
                            Review
                        </div>
                        <span className="text-slate-300">—</span>
                        <div className="flex items-center gap-2 text-slate-900">
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-sky-600 text-xs font-semibold text-white">2</span>
                            Bayar
                        </div>
                    </div>
                </div>
            </header>

            <div className="mx-auto w-full max-w-6xl px-4 py-8 md:px-8">
                <div className="grid gap-6 lg:grid-cols-[1.3fr_0.9fr]">
                    <div className="space-y-6">
                        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                            <h1 className="text-2xl font-semibold text-slate-900">Pembayaran</h1>
                            <p className="mt-2 text-sm text-slate-500">Selesaikan pembayaran sebelum {countdown}.</p>
                            <div className="mt-4 grid gap-2 text-sm text-slate-600">
                                <div className="flex items-center gap-2">
                                    <Ticket className="h-4 w-4 text-sky-500" />
                                    {booking.hotel.name}
                                </div>
                                <div className="flex items-center gap-2">
                                    <CalendarCheck className="h-4 w-4 text-sky-500" />
                                    {booking.check_in} → {booking.check_out} · {booking.nights} malam
                                </div>
                                <div className="flex items-center gap-2">
                                    <Users className="h-4 w-4 text-sky-500" />
                                    {booking.rooms_count} kamar · {booking.guests_count} tamu
                                </div>
                                <div className="flex items-center gap-2">
                                    <MapPinned className="h-4 w-4 text-sky-500" />
                                    {booking.hotel.address}
                                </div>
                            </div>
                            <div className="mt-4 text-lg font-semibold text-sky-600">Rp {booking.total.toLocaleString('id-ID')}</div>
                            <div className="mt-3 border-t border-slate-100 pt-3 text-sm text-slate-600">
                                <div className="flex items-center justify-between">
                                    <span>Subtotal</span>
                                    <span>Rp {(booking.subtotal ?? booking.total).toLocaleString('id-ID')}</span>
                                </div>
                                {booking.discount_amount && booking.discount_amount > 0 && (
                                    <div className="mt-2 flex items-center justify-between text-emerald-600">
                                        <span>Voucher {booking.voucher_code ?? ''}</span>
                                        <span>- Rp {booking.discount_amount.toLocaleString('id-ID')}</span>
                                    </div>
                                )}
                                <div className="mt-2 flex items-center justify-between border-t border-dashed border-slate-200 pt-2 font-semibold text-slate-900">
                                    <span>Total</span>
                                    <span>Rp {booking.total.toLocaleString('id-ID')}</span>
                                </div>
                            </div>
                            <button
                                type="button"
                                className="mt-4 w-full rounded-full bg-sky-600 px-4 py-3 text-sm font-semibold text-white shadow-sm disabled:opacity-70"
                                disabled={form.processing}
                                onClick={() => {
                                    if (snapToken && window.snap) {
                                        window.snap.pay(snapToken);
                                        return;
                                    }
                                    form.post(`/booking/${booking.encrypted_id ?? booking.id}/payment`, {
                                        preserveScroll: true,
                                        onError: () => Swal.fire({ title: 'Gagal', text: 'Gagal membuat pembayaran.', icon: 'error' }),
                                    });
                                }}
                            >
                                {form.processing ? 'Memproses...' : snapToken ? 'Buka Pembayaran' : 'Lanjutkan Pembayaran'}
                            </button>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                            <div className="flex items-center gap-2 rounded-xl bg-sky-50 px-3 py-2 text-sm text-sky-700">
                                <Ticket className="h-4 w-4" />
                                Booking kamu sudah siap, lanjutkan pembayaran.
                            </div>
                            <div className="mt-4 text-sm text-slate-600">
                                Status: <span className="font-semibold text-slate-900">{booking.status}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

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
