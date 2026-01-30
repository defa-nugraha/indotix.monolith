import { Head, useForm } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import Swal from 'sweetalert2';

type PaymentOption = { id: string; label: string };

type Booking = {
    id: number;
    status: string;
    payment_status?: string | null;
    payment_deadline?: string | null;
    hotel: { name?: string | null; address?: string | null };
    check_in: string;
    check_out: string;
    nights: number;
    rooms_count: number;
    guests_count: number;
    total: number;
    payment?: { status?: string | null; payment_type?: string | null; payload?: any } | null;
};

export default function BookingPayment({ booking, paymentOptions }: { booking: Booking; paymentOptions: PaymentOption[] }) {
    const form = useForm({ payment_type: paymentOptions[0]?.id ?? '' });
    const [remaining, setRemaining] = useState<number | null>(null);

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

    const instruction = booking.payment?.payload;
    const vaNumbers = instruction?.va_numbers ?? [];
    const permataVa = instruction?.permata_va_number;

    return (
        <div className="min-h-screen bg-[#f4f6f8] text-slate-900">
            <Head title="Pembayaran" />
            <div className="mx-auto w-full max-w-4xl px-4 py-8">
                <div className="rounded-2xl bg-white p-6 shadow-sm">
                    <h1 className="text-2xl font-semibold text-slate-900">Pembayaran</h1>
                    <div className="mt-2 text-xs text-slate-500">Step 4/4 · Pembayaran</div>
                    <p className="mt-2 text-sm text-slate-500">Selesaikan pembayaran sebelum {countdown}</p>
                    <div className="mt-4 grid gap-2 text-sm text-slate-600">
                        <div>{booking.hotel.name}</div>
                        <div>{booking.check_in} → {booking.check_out} · {booking.nights} malam</div>
                        <div>{booking.rooms_count} kamar · {booking.guests_count} tamu</div>
                    </div>
                    <div className="mt-4 text-lg font-semibold text-sky-600">Rp {booking.total.toLocaleString('id-ID')}</div>
                </div>

                <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm">
                    <h2 className="text-lg font-semibold text-slate-900">Pilih Metode Pembayaran</h2>
                    <form
                        className="mt-4 grid gap-3"
                        onSubmit={(event) => {
                            event.preventDefault();
                            form.post(`/booking/${booking.id}/payment`, {
                                onSuccess: () =>
                                    Swal.fire({ title: 'Berhasil', text: 'Instruksi pembayaran dibuat.', icon: 'success' }),
                                onError: () =>
                                    Swal.fire({ title: 'Gagal', text: 'Pembayaran gagal dibuat.', icon: 'error' }),
                            });
                        }}
                    >
                        <select
                            className="h-11 rounded-lg border border-slate-200 px-3 text-sm"
                            value={form.data.payment_type}
                            onChange={(event) => form.setData('payment_type', event.target.value)}
                        >
                            {paymentOptions.map((option) => (
                                <option key={option.id} value={option.id}>{option.label}</option>
                            ))}
                        </select>
                        <button className="h-11 rounded-lg bg-sky-600 text-sm font-semibold text-white">Buat Instruksi Pembayaran</button>
                    </form>

                    {instruction && (
                        <div className="mt-6 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
                            <div className="font-semibold text-slate-900">Instruksi Pembayaran</div>
                            {vaNumbers.length > 0 && (
                                <div className="mt-2 space-y-1 text-sm">
                                    {vaNumbers.map((va: any) => (
                                        <div key={`${va.bank}-${va.va_number}`}>
                                            {va.bank?.toUpperCase()} VA: <span className="font-semibold">{va.va_number}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {permataVa && (
                                <div className="mt-2 text-sm">
                                    PERMATA VA: <span className="font-semibold">{permataVa}</span>
                                </div>
                            )}
                            {!vaNumbers.length && !permataVa && (
                                <pre className="mt-2 overflow-auto text-xs">{JSON.stringify(instruction, null, 2)}</pre>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
