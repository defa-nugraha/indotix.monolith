import { Head, Link } from '@inertiajs/react';

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
    guest_name?: string | null;
    guest_email?: string | null;
    guest_phone?: string | null;
    rooms: { room_type?: string | null; rooms_count: number }[];
    payment?: { status?: string | null; payment_type?: string | null } | null;
};

export default function BookingShow({ booking }: { booking: Booking }) {
    return (
        <div className="min-h-screen bg-[#f4f6f8] text-slate-900">
            <Head title="Detail Booking" />
            <div className="mx-auto w-full max-w-4xl px-4 py-8">
                <div className="rounded-2xl bg-white p-6 shadow-sm">
                    <h1 className="text-2xl font-semibold text-slate-900">Detail Booking</h1>
                    <div className="mt-3 text-sm text-slate-600">Status: {booking.status}</div>
                    <div className="mt-4 text-sm text-slate-600">{booking.hotel.name}</div>
                    <div className="text-sm text-slate-600">{booking.check_in} → {booking.check_out} · {booking.nights} malam</div>
                    <div className="text-sm text-slate-600">{booking.rooms_count} kamar · {booking.guests_count} tamu</div>
                    <div className="mt-4 text-lg font-semibold text-sky-600">Rp {booking.total.toLocaleString('id-ID')}</div>

                    {booking.status === 'pending_payment' && (
                        <Link
                            href={`/booking/${booking.id}/payment`}
                            className="mt-4 inline-block rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white"
                        >
                            Lanjutkan Pembayaran
                        </Link>
                    )}
                </div>
            </div>
        </div>
    );
}
