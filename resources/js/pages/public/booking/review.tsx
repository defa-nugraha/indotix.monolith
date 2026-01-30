import { Head, useForm } from '@inertiajs/react';
import Swal from 'sweetalert2';

export default function BookingReview({ draft, hotel, roomType, pricing }: any) {
    const form = useForm({
        guest_name: '',
        guest_email: '',
        guest_phone: '',
        special_request: '',
    });

    return (
        <div className="min-h-screen bg-[#f4f6f8] text-slate-900">
            <Head title="Review Booking" />
            <div className="mx-auto w-full max-w-4xl px-4 py-8">
                <div className="rounded-2xl bg-white p-6 shadow-sm">
                    <h1 className="text-2xl font-semibold text-slate-900">Review Booking</h1>
                    <div className="mt-2 text-xs text-slate-500">Step 3/4 · Review</div>
                    <div className="mt-4 grid gap-2 text-sm text-slate-600">
                        <div>{hotel.name} · {hotel.city_name}</div>
                        <div>{draft.check_in} → {draft.check_out} · {pricing.nights} malam</div>
                        <div>{roomType.name} · {draft.rooms} kamar · {draft.guests} tamu</div>
                    </div>
                    <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm">
                        <div className="flex items-center justify-between">
                            <span>Total</span>
                            <span className="font-semibold text-slate-900">Rp {pricing.subtotal.toLocaleString('id-ID')}</span>
                        </div>
                    </div>
                </div>

                <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm">
                    <h2 className="text-lg font-semibold text-slate-900">Data Tamu</h2>
                    <form
                        className="mt-4 grid gap-3"
                        onSubmit={(event) => {
                            event.preventDefault();
                            form.post('/booking/confirm', {
                                onSuccess: () =>
                                    Swal.fire({ title: 'Berhasil', text: 'Booking dibuat. Lanjutkan pembayaran.', icon: 'success' }),
                                onError: () =>
                                    Swal.fire({ title: 'Gagal', text: 'Booking gagal diproses.', icon: 'error' }),
                            });
                        }}
                    >
                        <input
                            className="h-11 rounded-lg border border-slate-200 px-3 text-sm"
                            placeholder="Nama tamu"
                            value={form.data.guest_name}
                            onChange={(event) => form.setData('guest_name', event.target.value)}
                        />
                        <input
                            className="h-11 rounded-lg border border-slate-200 px-3 text-sm"
                            placeholder="Email"
                            value={form.data.guest_email}
                            onChange={(event) => form.setData('guest_email', event.target.value)}
                        />
                        <input
                            className="h-11 rounded-lg border border-slate-200 px-3 text-sm"
                            placeholder="Nomor telepon"
                            value={form.data.guest_phone}
                            onChange={(event) => form.setData('guest_phone', event.target.value)}
                        />
                        <textarea
                            className="min-h-[90px] rounded-lg border border-slate-200 px-3 py-2 text-sm"
                            placeholder="Permintaan khusus (opsional)"
                            value={form.data.special_request}
                            onChange={(event) => form.setData('special_request', event.target.value)}
                        />
                        <button className="h-11 rounded-lg bg-sky-600 text-sm font-semibold text-white">
                            Konfirmasi Booking
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
