import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
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

type PaymentOption = { id: string; label: string };

export default function WisataBookingPayment({ booking, paymentOptions }: { booking: Booking; paymentOptions: PaymentOption[] }) {
    const { auth } = usePage().props as { auth?: { user?: { role?: string } } };
    const [remaining, setRemaining] = useState<string | null>(null);
    const form = useForm({ payment_type: '' });
    const instruction = booking.payment?.payload;
    const vaNumbers = instruction?.va_numbers ?? [];
    const permataVa = instruction?.permata_va_number;
    const qrisAction = instruction?.actions?.find((action: any) => action?.name?.includes('qr-code'))?.url;

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

    const handlePay = () => {
        if (!form.data.payment_type) {
            Swal.fire({ icon: 'warning', title: 'Pilih metode', text: 'Silakan pilih metode pembayaran.' });
            return;
        }
        form.post(`/wisata/booking/${booking.encrypted_id}/payment`, {
            onError: (errors) =>
                Swal.fire({ icon: 'error', title: 'Gagal', text: errors.payment ?? 'Tidak dapat memproses pembayaran.' }),
        });
    };

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
                        <img src="/logo.png" alt="Indotix" className="h-8" />
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
                            <Link href="/notifications" className="hover:text-sky-600">Notifikasi</Link>
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
                            <h2 className="text-sm font-semibold text-slate-700">Metode Pembayaran</h2>
                            <div className="mt-3 grid gap-3">
                                {paymentOptions.map((option) => (
                                    <label key={option.id} className="flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm">
                                        <input
                                            type="radio"
                                            name="payment_type"
                                            checked={form.data.payment_type === option.id}
                                            onChange={() => form.setData('payment_type', option.id)}
                                        />
                                        <span>{option.label}</span>
                                    </label>
                                ))}
                            </div>
                            <button
                                type="button"
                                onClick={handlePay}
                                className="mt-6 w-full rounded-full bg-sky-600 px-6 py-2 text-sm font-semibold text-white"
                            >
                                Lanjutkan Pembayaran
                            </button>
                            {instruction && (
                                <div className="mt-6 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-600">
                                    <div className="font-semibold text-slate-900">Instruksi Pembayaran</div>
                                    {qrisAction && (
                                        <div className="mt-3">
                                            <img src={qrisAction} alt="QRIS" className="h-40 w-40 rounded-xl object-contain" />
                                        </div>
                                    )}
                                    {permataVa && (
                                        <p className="mt-2">Permata VA: <span className="font-semibold">{permataVa}</span></p>
                                    )}
                                    {vaNumbers.length > 0 && (
                                        <div className="mt-2 space-y-1">
                                            {vaNumbers.map((va: any, index: number) => (
                                                <p key={index}>
                                                    {va.bank?.toUpperCase()}: <span className="font-semibold">{va.va_number}</span>
                                                </p>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
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
