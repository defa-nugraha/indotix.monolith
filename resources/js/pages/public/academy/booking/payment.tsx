import { Head, Link, usePage } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import { ShoppingCart } from 'lucide-react';

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
    class: { id: number; title: string; location?: string | null; start_at?: string | null };
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

export default function AcademyBookingPayment({
    booking,
    snapClientKey,
    snapScriptUrl,
}: {
    booking: Booking;
    snapClientKey: string;
    snapScriptUrl: string;
}) {
    const { auth, unread_notifications, souvenir_cart_count } = usePage().props as { auth?: { user?: { role?: string } }; unread_notifications?: number; souvenir_cart_count?: number };
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
        <div className="min-h-screen bg-[#f4f6f8] text-slate-900">
            <Head title="Pembayaran Academy">
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
                            <Link href="/?tab=chat" className="hover:text-sky-600">Chat</Link>
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
                            <span>Kelas</span>
                            <span className="font-semibold text-slate-900">{booking.class.title}</span>
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
                            if (window.snap && snapToken) {
                                window.snap.pay(snapToken);
                            }
                        }}
                        className="mt-6 w-full rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white"
                    >
                        Lanjutkan Pembayaran
                    </button>
                </div>
            </main>
        </div>
    );
}
