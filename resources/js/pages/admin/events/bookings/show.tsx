import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Badge } from '@/components/ui/badge';

type BookingDetail = {
    id: number;
    booking_code: string;
    status: string;
    quantity: number;
    total_price: number;
    guest_name?: string | null;
    guest_email?: string | null;
    guest_phone?: string | null;
    event?: { title?: string | null };
    ticket?: { name?: string | null };
    scans?: Array<{ id: number; scanned_at?: string | null; officer_name?: string | null; location?: string | null; is_anomaly: boolean }>;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Event', href: '/admin/events' },
    { title: 'Booking Event', href: '/admin/events/bookings' },
    { title: 'Detail', href: '#' },
];

export default function EventBookingShow({ booking }: { booking: BookingDetail }) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Detail Booking Event" />
            <div className="flex flex-1 flex-col gap-6 bg-[#f6fbff] px-6 py-8">
                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-semibold text-slate-900">{booking.booking_code}</h1>
                            <p className="text-sm text-slate-500">{booking.event?.title ?? '-'}</p>
                        </div>
                        <Badge className="bg-slate-100 text-slate-600">{booking.status}</Badge>
                    </div>
                </section>

                <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                    <div className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                        <h2 className="text-lg font-semibold text-slate-900">Data Pemesan</h2>
                        <div className="mt-3 space-y-2 text-sm text-slate-600">
                            <div>Nama: {booking.guest_name ?? '-'}</div>
                            <div>Email: {booking.guest_email ?? '-'}</div>
                            <div>Telepon: {booking.guest_phone ?? '-'}</div>
                        </div>
                    </div>
                    <div className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                        <h2 className="text-lg font-semibold text-slate-900">Ringkasan Tiket</h2>
                        <div className="mt-3 space-y-2 text-sm text-slate-600">
                            <div>Tiket: {booking.ticket?.name ?? '-'}</div>
                            <div>Qty: {booking.quantity}</div>
                                <div>Total: Rp {booking.total_price.toLocaleString('id-ID')}</div>
                        </div>
                    </div>
                </section>

                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <h2 className="text-lg font-semibold text-slate-900">Riwayat Scan</h2>
                    <div className="mt-4 space-y-2 text-sm text-slate-600">
                        {booking.scans?.map((scan) => (
                            <div key={scan.id} className="flex items-center justify-between rounded-lg border border-slate-100 px-4 py-2">
                                <div>
                                    <div>Waktu: {scan.scanned_at ?? '-'}</div>
                                    <div className="text-xs text-slate-400">Petugas: {scan.officer_name ?? '-'}</div>
                                </div>
                                <Badge className={scan.is_anomaly ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-700'}>
                                    {scan.is_anomaly ? 'Double' : 'Normal'}
                                </Badge>
                            </div>
                        ))}
                        {(!booking.scans || booking.scans.length === 0) && (
                            <div className="text-sm text-slate-500">Belum ada scan.</div>
                        )}
                    </div>
                </section>
            </div>
        </AppLayout>
    );
}
