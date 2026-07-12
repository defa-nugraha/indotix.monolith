import { Head, useForm, usePage } from '@inertiajs/react';
import { AlertCircle, Clock, CreditCard, RefreshCw } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import Swal from 'sweetalert2';
import PublicLayout from '@/layouts/public-layout';
import { guardPurchaseByRole } from '@/lib/purchase-guard';

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
    const { auth, unread_notifications, souvenir_cart_count } = usePage().props as { auth?: { user?: { role?: string } }; unread_notifications?: number; souvenir_cart_count?: number };
    const role = auth?.user?.role;
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
        <PublicLayout>
            <Head title="Pembayaran Tiket Wisata">
                <link
                    href="https://fonts.bunny.net/css?family=plus-jakarta-sans:400,500,600,700|space-grotesk:500,600,700"
                    rel="stylesheet"
                />
            </Head>
            <main className="mx-auto w-full max-w-7xl px-4 py-8 font-sans text-slate-800 sm:px-6 lg:px-8">
                <div className="mx-auto w-full max-w-3xl">
                    <div className="relative z-0 flex items-center justify-between">
                        <div className="absolute right-0 left-0 top-1/2 z-0 h-1 -translate-y-1/2 bg-slate-200" />
                        <div className="absolute left-0 top-1/2 z-0 h-1 w-3/4 -translate-y-1/2 bg-sky-600" />
                        {[
                            ['✓', 'Detail'],
                            ['2', 'Pembayaran'],
                            ['3', 'Selesai'],
                        ].map(([number, label], index) => (
                            <div
                                key={label}
                                className={`relative z-10 flex items-center gap-2 rounded-full border bg-white px-3 py-1 text-xs font-bold shadow-sm ${
                                    index === 1
                                        ? 'border-sky-200 text-sky-600 ring-2 ring-sky-100'
                                        : index === 0
                                          ? 'border-slate-200 text-slate-500'
                                          : 'border-slate-200 text-slate-400'
                                }`}
                            >
                                <span
                                    className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${
                                        index === 0
                                            ? 'bg-emerald-600 text-white'
                                            : index === 1
                                              ? 'bg-sky-600 text-white'
                                              : 'bg-slate-200 text-slate-500'
                                    }`}
                                >
                                    {number}
                                </span>
                                {label}
                            </div>
                        ))}
                    </div>
                </div>

                <section className="mx-auto mt-10 max-w-xl space-y-6 rounded-3xl border border-slate-150 bg-white p-6 text-center shadow-lg sm:p-10">
                    <div className="flex flex-col items-center">
                        <div className="mb-3 flex h-14 w-14 animate-pulse items-center justify-center rounded-full border border-amber-500/20 bg-amber-500/10 text-amber-500">
                            <Clock className="h-7 w-7" />
                        </div>
                        <span className="block text-sm font-bold tracking-widest text-slate-500 uppercase">
                            Menunggu Pembayaran
                        </span>
                        <span
                            className="mt-1.5 font-mono text-4xl font-black tracking-tight text-slate-800 sm:text-5xl"
                            id="countdown-clock"
                        >
                            {remaining ?? '00:00'}
                        </span>
                    </div>

                    <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-left sm:p-6">
                        <div className="border-b border-slate-200/60 pb-3">
                            <span className="block text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                                Kode Booking
                            </span>
                            <span className="mt-0.5 block font-mono text-base font-black tracking-tight text-slate-800 sm:text-lg">
                                {booking.booking_code}
                            </span>
                        </div>

                        <div className="border-b border-slate-200/60 pb-3">
                            <span className="block text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                                Total yang harus dibayar
                            </span>
                            <span className="mt-0.5 block text-lg font-black tracking-tight text-blue-600 sm:text-xl">
                                Rp {booking.total.toLocaleString('id-ID')}
                            </span>
                        </div>

                        <div className="space-y-2 text-xs text-slate-600">
                            <h5 className="flex items-center gap-1.5 text-[10px] font-extrabold tracking-wider text-slate-800 uppercase">
                                <CreditCard className="h-3.5 w-3.5 text-blue-500" />
                                Cara membayar:
                            </h5>
                            <ol className="list-decimal space-y-1 pl-4 leading-relaxed font-medium">
                                <li>Buka popup pembayaran Midtrans.</li>
                                <li>Pilih metode pembayaran yang tersedia.</li>
                                <li>Ikuti instruksi sesuai metode pembayaran.</li>
                                <li>Pastikan nominal sesuai total transaksi.</li>
                            </ol>
                        </div>
                    </div>

                    <div className="space-y-3 pt-2">
                        <button
                            type="button"
                            onClick={() => {
                                if (guardPurchaseByRole(role)) {
                                    return;
                                }
                                if (snapToken && window.snap) {
                                    window.snap.pay(snapToken);
                                    return;
                                }
                                form.post(`/wisata/booking/${booking.encrypted_id}/payment`, {
                                    onError: (errors) =>
                                        Swal.fire({ icon: 'error', title: 'Gagal', text: errors.payment ?? 'Tidak dapat memproses pembayaran.' }),
                                });
                            }}
                            className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-blue-600 py-3.5 text-xs font-extrabold tracking-wider text-white uppercase shadow-md transition-all hover:bg-blue-700 hover:shadow-lg disabled:opacity-50"
                            disabled={form.processing}
                        >
                            {form.processing ? (
                                <>
                                    <RefreshCw className="h-4 w-4 animate-spin" />
                                    Memproses...
                                </>
                            ) : snapToken ? (
                                <>
                                    <CreditCard className="h-4 w-4" />
                                    Buka Pembayaran
                                </>
                            ) : (
                                <>
                                    <CreditCard className="h-4 w-4" />
                                    Lanjutkan Pembayaran
                                </>
                            )}
                        </button>
                    </div>

                    <div className="flex items-start gap-2.5 rounded-xl border border-amber-100 bg-amber-50 p-3 text-left text-[10px] font-medium text-amber-800">
                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                        <p>
                            Selesaikan pembayaran sebelum batas waktu agar
                            booking tidak dibatalkan otomatis. Konfirmasi tiket
                            akan dikirim setelah pembayaran berhasil.
                        </p>
                    </div>
                </section>
            </main>
        </PublicLayout>
    );
}
