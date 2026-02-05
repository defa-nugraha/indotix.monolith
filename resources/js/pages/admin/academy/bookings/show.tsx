import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Swal from 'sweetalert2';

type BookingDetail = {
    id: number;
    booking_code: string;
    quantity: number;
    total_price: number;
    status: string;
    academy_class?: { title?: string | null };
    ticket?: { name?: string | null };
    user?: { name?: string | null; email?: string | null };
    attendees?: Array<{ id: number; name: string; attendance_status: string }>;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Eljohn Academy', href: '/admin/academy/classes' },
    { title: 'Booking', href: '/admin/academy/bookings' },
    { title: 'Detail', href: '#' },
];

export default function AcademyBookingShow({ booking }: { booking: BookingDetail }) {
    const requestRefund = async () => {
        const result = await Swal.fire({
            title: 'Refund booking?',
            input: 'number',
            inputLabel: 'Nominal refund',
            showCancelButton: true,
            confirmButtonText: 'Refund',
        });
        if (!result.isConfirmed) return;
        router.post(`/admin/academy/bookings/${booking.id}/refund`, {
            amount: Number(result.value || 0),
        }, {
            onSuccess: () => Swal.fire({ icon: 'success', title: 'Refund dibuat' }),
            onError: () => Swal.fire({ icon: 'error', title: 'Gagal refund' }),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Detail Booking Academy" />
            <div className="flex flex-1 flex-col gap-6 bg-[#f6fbff] px-6 py-8">
                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <div className="flex items-start justify-between gap-6">
                        <div>
                            <h1 className="text-2xl font-semibold text-slate-900">{booking.booking_code}</h1>
                            <p className="text-sm text-slate-500">{booking.academy_class?.title ?? '-'}</p>
                        </div>
                        <Badge className="bg-slate-100 text-slate-700">{booking.status}</Badge>
                    </div>
                    <div className="mt-4 grid gap-4 md:grid-cols-3">
                        <div className="rounded-2xl border border-slate-100 p-4">
                            <p className="text-xs uppercase text-slate-500">Tiket</p>
                            <p className="mt-2 text-sm font-semibold text-slate-900">{booking.ticket?.name ?? '-'}</p>
                        </div>
                        <div className="rounded-2xl border border-slate-100 p-4">
                            <p className="text-xs uppercase text-slate-500">Jumlah</p>
                            <p className="mt-2 text-sm font-semibold text-slate-900">{booking.quantity}</p>
                        </div>
                        <div className="rounded-2xl border border-slate-100 p-4">
                            <p className="text-xs uppercase text-slate-500">Total</p>
                            <p className="mt-2 text-sm font-semibold text-slate-900">
                                Rp {booking.total_price.toLocaleString('id-ID')}
                            </p>
                        </div>
                    </div>
                    <div className="mt-4 flex gap-2">
                        <Button variant="outline" onClick={requestRefund}>Refund</Button>
                    </div>
                </section>
                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <h2 className="text-lg font-semibold text-slate-900">Peserta</h2>
                    <div className="mt-3 grid gap-2">
                        {booking.attendees?.map((attendee) => (
                            <div key={attendee.id} className="rounded-xl border border-slate-100 px-3 py-2 text-sm">
                                <div className="font-semibold text-slate-900">{attendee.name}</div>
                                <Badge className="mt-2 bg-slate-100 text-slate-700">{attendee.attendance_status}</Badge>
                            </div>
                        ))}
                        {(!booking.attendees || booking.attendees.length === 0) && (
                            <div className="text-sm text-slate-500">Belum ada peserta.</div>
                        )}
                    </div>
                </section>
            </div>
        </AppLayout>
    );
}
