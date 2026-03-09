import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import { ShoppingCart } from 'lucide-react';
import { FooterDownloadSocial } from '@/components/footer-download-social';
import PublicLayout from '@/layouts/public-layout';
import { guardPurchaseByRole } from '@/lib/purchase-guard';
import Swal from 'sweetalert2';

type Booking = {
    id: number;
    encrypted_id: string;
    booking_code: string;
    quantity: number;
    total: number;
    status: string;
    payment_status?: string | null;
    payment_deadline?: string | null;
    ticket: { id: number; name: string };
    program: { id: number; title: string; location?: string | null; start_at?: string | null };
    guest: { name: string; email: string; phone: string };
    payment?: { status?: string; payment_type?: string; payload?: any } | null;
};

declare global {
    interface Window {
        snap?: {
            pay: (token: string, options?: Record<string, unknown>) => void;
        };
    }
}

export default function SpecialProgramBookingPayment({
    booking,
    snapClientKey,
    snapScriptUrl,
}: {
    booking: Booking;
    snapClientKey: string;
    snapScriptUrl: string;
}) {
    const { auth, unread_notifications, souvenir_cart_count } = usePage().props as { auth?: { user?: { role?: string } }; unread_notifications?: number; souvenir_cart_count?: number };
    const role = auth?.user?.role;
    const form = useForm({});
    const [remaining, setRemaining] = useState<string | null>(null);
    const snapOpened = useRef(false);
    const snapToken = booking.payment?.payload?.token;

    useEffect(() => {
        if (!booking.payment_deadline) return;
        const deadline = new Date(booking.payment_deadline).getTime();
        const interval = setInterval(() => {
            const diff = deadline - Date.now();
            if (diff <= 0) {
                setRemaining('00:00');
                clearInterval(interval);
            } else {
                const minutes = Math.floor(diff / 60000);
                const seconds = Math.floor((diff % 60000) / 1000);
                setRemaining(`${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`);
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [booking.payment_deadline]);

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
            <Head title="Pembayaran Special Program">
                <link
                    href="https://fonts.bunny.net/css?family=plus-jakarta-sans:400,500,600,700|space-grotesk:500,600,700"
                    rel="stylesheet"
                />
            </Head>
                        <main className="mx-auto w-full max-w-4xl px-4 py-10 md:px-8">
                <div className="rounded-3xl bg-white p-6 shadow-sm">
                    <h1 className="text-xl font-semibold text-slate-900">Booking kamu sudah siap</h1>
                    <p className="mt-2 text-sm text-slate-500">Selesaikan pembayaran sebelum waktu habis.</p>
                    <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl bg-sky-50 px-4 py-3 text-sm text-sky-700">
                        <span className="font-semibold">Batas pembayaran:</span>
                        <span>{remaining ?? '-'}</span>
                    </div>
                    <div className="mt-6 grid gap-4 text-sm text-slate-600">
                        <div className="flex items-center justify-between">
                            <span>Special Program</span>
                            <span className="font-semibold text-slate-900">{booking.program.title}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span>Tiket</span>
                            <span className="font-semibold text-slate-900">{booking.ticket.name}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span>Jumlah</span>
                            <span className="font-semibold text-slate-900">{booking.quantity}</span>
                        </div>
                        <div className="flex items-center justify-between border-t border-slate-200 pt-3">
                            <span>Total</span>
                            <span className="text-lg font-semibold text-sky-600">Rp {booking.total.toLocaleString('id-ID')}</span>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => {
                            if (guardPurchaseByRole(role)) {
                                return;
                            }
                            if (window.snap && snapToken) {
                                window.snap.pay(snapToken);
                                return;
                            }
                            form.post(`/special-programs/booking/${booking.encrypted_id}/payment`, {
                                preserveScroll: true,
                                onError: (errors) =>
                                    Swal.fire({
                                        icon: 'error',
                                        title: 'Gagal',
                                        text: errors.payment ?? 'Tidak dapat memproses pembayaran.',
                                    }),
                            });
                        }}
                        className="mt-6 w-full rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-70"
                        disabled={form.processing}
                    >
                        {form.processing ? 'Memproses...' : snapToken ? 'Buka Pembayaran' : 'Lanjutkan Pembayaran'}
                    </button>
                </div>
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
                            <li>Retail Shop</li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-sm font-semibold text-slate-900">Perusahaan</h4>
                        <ul className="mt-3 space-y-2 text-sm text-slate-600">
                            <li>
                                <Link href="/about" className="transition hover:text-sky-600">Tentang Kami</Link>
                            </li>
                            <li>
                                <Link href="/jelajah" className="transition hover:text-sky-600">Blog</Link>
                            </li>
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
