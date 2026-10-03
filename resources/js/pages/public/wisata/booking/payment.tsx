import { Head, useForm, usePage } from '@inertiajs/react';
import { AlertCircle, Clock, CreditCard, RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';
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
    items?: Array<{
        ticket_id: number;
        name: string;
        quantity: number;
        unit_price: number;
        subtotal: number;
    }>;
    destination: { id: number; name: string; address?: string | null };
    guest: { name: string; email: string; phone: string };
    payment?: {
        provider?: string;
        status?: string;
        internal_status?: string;
        payment_type?: string;
        payment_url?: string | null;
        payload?: { redirect_url?: string; token?: string };
    } | null;
};

export default function WisataBookingPayment({ booking }: { booking: Booking }) {
    const { auth, unread_notifications, souvenir_cart_count } = usePage()
        .props as {
        auth?: { user?: { role?: string } };
        unread_notifications?: number;
        souvenir_cart_count?: number;
    };
    const role = auth?.user?.role;
    const [remaining, setRemaining] = useState<string | null>(null);
    const [isExpired, setIsExpired] = useState(() =>
        booking.payment_deadline
            ? new Date(booking.payment_deadline).getTime() <= Date.now()
            : booking.status !== 'pending_payment',
    );
    const form = useForm({});
    const paymentUrl =
        booking.payment?.payment_url ?? booking.payment?.payload?.redirect_url;

    useEffect(() => {
        if (!booking.payment_deadline) return;
        const deadline = new Date(booking.payment_deadline).getTime();
        const updateCountdown = () => {
            const diff = deadline - Date.now();
            if (diff <= 0) {
                setRemaining('00:00');
                setIsExpired(true);
                return true;
            }

            const minutes = Math.floor(diff / 60000);
            const seconds = Math.floor((diff % 60000) / 1000);
            setRemaining(
                `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`,
            );
            setIsExpired(false);
            return false;
        };

        updateCountdown();
        const interval = setInterval(() => {
            if (updateCountdown()) {
                clearInterval(interval);
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [booking.payment_deadline]);

    return (
        <PublicLayout>
            <Head title="Pembayaran Tiket Wisata" />
            <main className="mx-auto w-full max-w-7xl px-4 py-8 font-sans text-slate-800 sm:px-6 lg:px-8">
                <div className="mx-auto w-full max-w-3xl">
                    <div className="relative z-0 flex items-center justify-between">
                        <div className="absolute top-1/2 right-0 left-0 z-0 h-1 -translate-y-1/2 bg-slate-200" />
                        <div className="absolute top-1/2 left-0 z-0 h-1 w-3/4 -translate-y-1/2 bg-sky-600" />
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
                                    className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] ${
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

                <section className="border-slate-150 mx-auto mt-10 max-w-xl space-y-6 rounded-3xl border bg-white p-6 text-center shadow-lg sm:p-10">
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
                            <span className="block text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                                Kode Booking
                            </span>
                            <span className="mt-0.5 block font-mono text-base font-black tracking-tight text-slate-800 sm:text-lg">
                                {booking.booking_code}
                            </span>
                        </div>

                        <div className="border-b border-slate-200/60 pb-3">
                            <span className="block text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                                Total yang harus dibayar
                            </span>
                            <span className="mt-0.5 block text-lg font-black tracking-tight text-blue-600 sm:text-xl">
                                Rp {booking.total.toLocaleString('id-ID')}
                            </span>
                        </div>

                        <div className="space-y-2 text-xs text-slate-600">
                            <h5 className="flex items-center gap-1.5 text-[11px] font-extrabold tracking-wider text-slate-800 uppercase">
                                <CreditCard className="h-3.5 w-3.5 text-blue-500" />
                                Cara membayar:
                            </h5>
                            <ol className="list-decimal space-y-1 pl-4 leading-relaxed font-medium">
                                <li>Buka halaman pembayaran aman.</li>
                                <li>Pilih metode pembayaran yang tersedia.</li>
                                <li>
                                    Ikuti instruksi sesuai metode pembayaran.
                                </li>
                                <li>
                                    Pastikan nominal sesuai total transaksi.
                                </li>
                            </ol>
                        </div>
                    </div>

                    <div className="space-y-3 pt-2">
                        {isExpired && (
                            <div className="rounded-xl border border-red-100 bg-red-50 p-3 text-center text-xs font-semibold text-red-700">
                                Waktu pembayaran telah habis. Booking ini tidak dapat digunakan untuk membuka pembayaran kembali.
                            </div>
                        )}
                        <button
                            type="button"
                            onClick={() => {
                                if (isExpired) {
                                    return;
                                }
                                if (guardPurchaseByRole(role)) {
                                    return;
                                }
                                if (paymentUrl) {
                                    window.location.assign(paymentUrl);
                                    return;
                                }
                                form.post(
                                    `/wisata/booking/${booking.encrypted_id}/payment`,
                                    {
                                        onError: (errors) =>
                                            Swal.fire({
                                                icon: 'error',
                                                title: 'Gagal',
                                                text:
                                                    errors.payment ??
                                                    'Tidak dapat memproses pembayaran.',
                                            }),
                                    },
                                );
                            }}
                            className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-blue-600 min-h-11 py-3 text-xs font-extrabold tracking-wider text-white uppercase shadow-md transition-all hover:bg-blue-700 hover:shadow-lg disabled:opacity-50"
                            disabled={form.processing || isExpired}
                        >
                            {form.processing ? (
                                <>
                                    <RefreshCw className="h-4 w-4 animate-spin" />
                                    Memproses...
                                </>
                            ) : isExpired ? (
                                <>
                                    <Clock className="h-4 w-4" />
                                    Pembayaran Kedaluwarsa
                                </>
                            ) : paymentUrl ? (
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

                    <div className="flex items-start gap-2.5 rounded-xl border border-amber-100 bg-amber-50 p-3 text-left text-[11px] font-medium text-amber-800">
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
