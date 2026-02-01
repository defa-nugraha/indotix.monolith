import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Badge } from '@/components/ui/badge';

type Dispute = { id: number; subject: string; status: string; description: string };

type Props = {
    destination: { id: number; destination_name: string | null };
    booking: {
        id: number;
        booking_code: string;
        visit_date: string;
        quantity: number;
        unit_price: number;
        total_price: number;
        status: string;
        ticket?: { id?: number; name?: string | null };
        user?: { id?: number; name?: string | null; email?: string | null };
        disputes: Dispute[];
    };
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Booking Wisata', href: '/mitra/wisata/bookings' },
    { title: 'Detail Booking', href: '#' },
];

export default function MitraWisataBookingShow({ destination, booking }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Detail Booking Wisata" />
            <div className="flex flex-1 flex-col gap-6 bg-[#f6fbff] px-6 py-8">
                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-600">Booking</p>
                        <h1 className="mt-2 text-2xl font-semibold text-slate-900">
                            {booking.booking_code}
                        </h1>
                        <p className="text-sm text-slate-500">
                            Destinasi {destination.destination_name ?? '-'}
                        </p>
                    </div>
                </section>

                <section className="grid gap-6 md:grid-cols-3">
                    <div className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm md:col-span-2">
                        <h2 className="text-lg font-semibold text-slate-900">Detail Booking</h2>
                        <div className="mt-4 grid gap-3 text-sm text-slate-600">
                            <div className="flex justify-between">
                                <span>Tiket</span>
                                <span className="font-semibold text-slate-900">{booking.ticket?.name ?? '-'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Tanggal kunjungan</span>
                                <span className="font-semibold text-slate-900">{booking.visit_date}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Jumlah tiket</span>
                                <span className="font-semibold text-slate-900">{booking.quantity}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Harga per tiket</span>
                                <span className="font-semibold text-slate-900">
                                    Rp {booking.unit_price.toLocaleString('id-ID')}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span>Total</span>
                                <span className="font-semibold text-slate-900">
                                    Rp {booking.total_price.toLocaleString('id-ID')}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                        <h2 className="text-lg font-semibold text-slate-900">Status</h2>
                        <Badge className="mt-3 bg-slate-50 text-slate-600">{booking.status}</Badge>
                        <div className="mt-4 text-sm text-slate-600">
                            <p className="font-semibold text-slate-900">Pemesan</p>
                            <p>{booking.user?.name ?? 'Guest'}</p>
                            <p className="text-xs text-slate-500">{booking.user?.email ?? '-'}</p>
                        </div>
                    </div>
                </section>

                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <h2 className="text-lg font-semibold text-slate-900">Riwayat Dispute</h2>
                    {booking.disputes.length === 0 && (
                        <p className="mt-2 text-sm text-slate-500">Belum ada laporan masalah.</p>
                    )}
                    {booking.disputes.length > 0 && (
                        <div className="mt-4 grid gap-3">
                            {booking.disputes.map((dispute) => (
                                <div key={dispute.id} className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                                    <div className="flex items-center justify-between">
                                        <span className="font-semibold text-slate-900">{dispute.subject}</span>
                                        <Badge className="bg-slate-200 text-slate-700">{dispute.status}</Badge>
                                    </div>
                                    <p className="mt-2 text-sm text-slate-600">{dispute.description}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </AppLayout>
    );
}
