import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import Swal from 'sweetalert2';

type Booking = {
    id: number;
    encrypted_id: string;
    booking_code: string;
    visit_date: string;
    quantity: number;
    unit_price: number;
    total: number;
    status: string;
    payment_status?: string | null;
    payment_deadline?: string | null;
    ticket: { id: number; name: string };
    destination: { id: number; name: string; address?: string | null };
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

export default function WisataBookingPayment({
    booking,
    snapClientKey,
    snapScriptUrl,
}: {
    booking: Booking;
    snapClientKey: string;
    snapScriptUrl: string;
}) {
    const { auth, unread_notifications } = usePage().props as { auth?: { user?: { role?: string } }; unread_notifications?: number };
    const [remaining, setRemaining] = useState<string | null>(null);
    const form = useForm({});
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
            <Head title="Pembayaran Tiket Wisata">
                <link
                    href="https://fonts.bunny.net/css?family=plus-jakarta-sans:400,500,600,700|space-grotesk:500,600,700"
                    rel="stylesheet"
                />
            </Head>
            <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
                <div className="mx-auto flex w-full max-w-6xl items-center gap-6 px-4 py-4 md:px-8">
                    <div className="flex items-center gap-2">
                        <img src="/logo.png" alt="Indotix" className="h-11 w-36 object-contain" />
                    </div>
                    <div className="flex flex-1 items-center">
                        <input
                            type="text"
                            placeholder="Cari kota/hotel/wisata/event..."
                            className="h-11 w-full rounded-lg border border-slate-200 px-4 text-sm shadow-sm focus:border-sky-400 focus:outline-none"
                        />
                    </div>
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
                    ) : (
                        <>
                            <Link
                                href="/register"
                                className="rounded-full bg-sky-600 px-4 py-2 text-sm font-semibold text-white"
                            >
                                Gabung Mitra
                            </Link>
                            <Link
                                href="/login"
                                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
                            >
                                Login
                            </Link>
                        </>
                    )}
                </div>
            </header>

            <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 md:px-8">
                <section className="grid gap-6 lg:grid-cols-[2fr,1fr]">
                    <div className="rounded-3xl bg-white p-6 shadow-sm">
                        <h1 className="text-xl font-semibold text-slate-900">Booking kamu sudah siap, lanjutkan pembayaran</h1>
                        <p className="mt-2 text-sm text-slate-500">Selesaikan pembayaran sebelum batas waktu.</p>
                        {remaining && (
                            <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-amber-50 px-4 py-2 text-xs font-semibold text-amber-700">
                                Batas bayar: {remaining}
                            </div>
                        )}

                        <div className="mt-6">
                            <button
                                type="button"
                                onClick={() => {
                                    if (snapToken && window.snap) {
                                        window.snap.pay(snapToken);
                                        return;
                                    }
                                    form.post(`/wisata/booking/${booking.encrypted_id}/payment`, {
                                        onError: (errors) =>
                                            Swal.fire({ icon: 'error', title: 'Gagal', text: errors.payment ?? 'Tidak dapat memproses pembayaran.' }),
                                    });
                                }}
                                className="mt-6 w-full rounded-full bg-sky-600 px-6 py-2 text-sm font-semibold text-white"
                                disabled={form.processing}
                            >
                                {form.processing ? 'Memproses...' : snapToken ? 'Buka Pembayaran' : 'Lanjutkan Pembayaran'}
                            </button>
                        </div>
                    </div>

                    <aside className="rounded-3xl bg-white p-6 shadow-sm">
                        <h2 className="text-lg font-semibold text-slate-900">{booking.destination.name}</h2>
                        <p className="text-sm text-slate-500">{booking.destination.address}</p>
                        <div className="mt-4 space-y-2 text-sm text-slate-600">
                            <div className="flex justify-between">
                                <span>Tiket</span>
                                <span className="font-semibold">{booking.ticket.name}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Tanggal</span>
                                <span className="font-semibold">{booking.visit_date}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Jumlah</span>
                                <span className="font-semibold">{booking.quantity} tiket</span>
                            </div>
                            <div className="flex justify-between text-base font-semibold text-sky-600">
                                <span>Total</span>
                                <span>Rp {booking.total.toLocaleString('id-ID')}</span>
                            </div>
                        </div>
                    </aside>
                </section>
            </main>
        </div>
    );
}
