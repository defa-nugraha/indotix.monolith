import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Badge } from '@/components/ui/badge';

type BookingDetail = {
    id: number;
    booking_code: string;
    quantity: number;
    total_price: number;
    status: string;
    event?: { title?: string | null };
    ticket?: { name?: string | null };
    user?: { name?: string | null; email?: string | null };
    attendees?: Array<{ id: number; name: string; email?: string | null; phone?: string | null; checked_in: boolean }>;
    scans?: Array<{ id: number; scanned_at?: string | null; officer_name?: string | null; is_anomaly: boolean }>;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard Mitra', href: '/mitra/dashboard' },
    { title: 'Booking Event', href: '/mitra/events/bookings' },
    { title: 'Detail', href: '#' },
];

export default function MitraEventBookingShow({ booking }: { booking: BookingDetail }) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Detail Booking Event" />
            <div className="flex flex-1 flex-col gap-6 bg-[#f6fbff] px-6 py-8">
                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-semibold text-slate-900">{booking.booking_code}</h1>
                            <p className="text-sm text-slate-500">{booking.event?.title ?? '-'}</p>
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
                </section>

                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <h2 className="text-lg font-semibold text-slate-900">Data Pemesan</h2>
                    <div className="mt-3 text-sm text-slate-600">
                        {booking.user?.name ?? '-'} • {booking.user?.email ?? '-'}
                    </div>
                </section>

                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <h2 className="text-lg font-semibold text-slate-900">Peserta</h2>
                    <div className="mt-3 grid gap-2">
                        {booking.attendees?.map((attendee) => (
                            <div key={attendee.id} className="rounded-xl border border-slate-100 px-3 py-2 text-sm">
                                <div className="font-semibold text-slate-900">{attendee.name}</div>
                                <div className="text-xs text-slate-500">{attendee.email ?? '-'}</div>
                                <Badge className={attendee.checked_in ? 'mt-2 bg-emerald-50 text-emerald-700' : 'mt-2 bg-slate-100 text-slate-700'}>
                                    {attendee.checked_in ? 'Checked-in' : 'Belum Check-in'}
                                </Badge>
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
