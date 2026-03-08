import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import Swal from 'sweetalert2';
import { Bell, CalendarCheck, Ticket, Users, MapPinned, UserCircle, History, MessageCircle, ShoppingCart} from 'lucide-react';
import { FooterDownloadSocial } from '@/components/footer-download-social';
import PublicLayout from '@/layouts/public-layout';
import { guardPurchaseByRole } from '@/lib/purchase-guard';

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
    const { auth, unread_notifications, souvenir_cart_count } = usePage().props as { auth?: { user?: unknown }; unread_notifications?: number; souvenir_cart_count?: number };
    const role = (auth?.user as any)?.role as string | undefined;
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
        <PublicLayout>
            <Head title="Pembayaran">
                <link
                    href="https://fonts.bunny.net/css?family=plus-jakarta-sans:400,500,600,700|space-grotesk:500,600,700"
                    rel="stylesheet"
                />
            </Head>
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
                                    if (guardPurchaseByRole(role)) {
                                        return;
                                    }
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
                            <li>Retail Shop</li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-sm font-semibold text-slate-900">Perusahaan</h4>
                        <ul className="mt-3 space-y-2 text-sm text-slate-600">
                            <li>Tentang Kami</li>
                            <li>Karir</li>
                            <li>Blog</li>
                            <li>
                                <Link href="/faq" className="transition hover:text-sky-600">FAQ</Link>
                            </li>
                            <li>
                                <Link href="/privacy-policy" className="transition hover:text-sky-600">Kebijakan Privasi</Link>
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
