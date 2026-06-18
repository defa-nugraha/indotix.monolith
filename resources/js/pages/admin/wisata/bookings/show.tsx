import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Badge } from '@/components/ui/badge';

type Booking = {
    id: number;
    booking_code: string;
    visit_date: string;
    status: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    destination?: { destination_name?: string | null; city_code?: string | null };
    ticket?: { name?: string | null };
    user?: { name?: string; email?: string };
    scans?: Array<{
        id: number;
        scanned_at: string;
        officer_name?: string | null;
        location?: string | null;
        is_anomaly: boolean;
    }>;
};

type Props = {
    booking: Booking;
    cityName?: string | null;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Wisata', href: '/admin/wisata/destinations' },
    { title: 'Monitoring Booking', href: '/admin/wisata/bookings' },
    { title: 'Detail Booking', href: '#' },
];

const statusTone = (status?: string) => {
    if (status === 'paid') return 'bg-emerald-50 text-emerald-700';
    if (status === 'pending_payment') return 'bg-amber-50 text-amber-700';
    if (status === 'cancelled') return 'bg-red-50 text-red-700';
    if (status === 'expired') return 'bg-slate-100 text-slate-600';
    if (status === 'completed') return 'bg-blue-50 text-blue-700';
    return 'bg-slate-50 text-slate-600';
};

export default function AdminWisataBookingShow({ booking, cityName }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Detail Booking ${booking.booking_code}`} />
            <div className="flex flex-1 flex-col gap-6 bg-[#f6fbff] px-6 py-8">
                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <p className="text-xs font-semibold uppercase text-sky-600">
                                Booking Tiket
                            </p>
                            <h1 className="mt-2 text-2xl font-semibold text-slate-900">{booking.booking_code}</h1>
                            <p className="text-sm text-slate-500">
                                {booking.user?.name ?? 'Guest'} · {booking.user?.email ?? '-'}
                            </p>
                        </div>
                        <Badge className={statusTone(booking.status)}>{booking.status}</Badge>
                    </div>
                </section>

                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <h2 className="text-lg font-semibold text-slate-900">Detail Booking</h2>
                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                        <div>
                            <p className="text-xs uppercase text-slate-400">Destinasi</p>
                            <p className="text-sm font-semibold text-slate-900">
                                {booking.destination?.destination_name ?? '-'}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs uppercase text-slate-400">Kota</p>
                            <p className="text-sm font-semibold text-slate-900">
                                {cityName ?? booking.destination?.city_code ?? '-'}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs uppercase text-slate-400">Produk Tiket</p>
                            <p className="text-sm font-semibold text-slate-900">{booking.ticket?.name ?? '-'}</p>
                        </div>
                        <div>
                            <p className="text-xs uppercase text-slate-400">Tanggal Kunjungan</p>
                            <p className="text-sm font-semibold text-slate-900">{booking.visit_date}</p>
                        </div>
                        <div>
                            <p className="text-xs uppercase text-slate-400">Jumlah</p>
                            <p className="text-sm font-semibold text-slate-900">{booking.quantity} tiket</p>
                        </div>
                        <div>
                            <p className="text-xs uppercase text-slate-400">Harga / tiket</p>
                            <p className="text-sm font-semibold text-slate-900">
                                Rp {booking.unit_price.toLocaleString('id-ID')}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs uppercase text-slate-400">Total</p>
                            <p className="text-sm font-semibold text-slate-900">
                                Rp {booking.total_price.toLocaleString('id-ID')}
                            </p>
                        </div>
                    </div>
                </section>

                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <h2 className="text-lg font-semibold text-slate-900">Riwayat Scan</h2>
                    <div className="mt-4 overflow-hidden rounded-2xl border border-slate-100">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                                <tr>
                                    <th className="px-4 py-3 text-left">Waktu Scan</th>
                                    <th className="px-4 py-3 text-left">Petugas</th>
                                    <th className="px-4 py-3 text-left">Lokasi</th>
                                    <th className="px-4 py-3 text-left">Anomali</th>
                                </tr>
                            </thead>
                            <tbody>
                                {booking.scans?.map((scan) => (
                                    <tr key={scan.id} className="border-t border-slate-100">
                                        <td className="px-4 py-3">{scan.scanned_at}</td>
                                        <td className="px-4 py-3">{scan.officer_name ?? '-'}</td>
                                        <td className="px-4 py-3">{scan.location ?? '-'}</td>
                                        <td className="px-4 py-3">
                                            <Badge className={scan.is_anomaly ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}>
                                                {scan.is_anomaly ? 'Double Scan' : 'Normal'}
                                            </Badge>
                                        </td>
                                    </tr>
                                ))}
                                {(!booking.scans || booking.scans.length === 0) && (
                                    <tr>
                                        <td colSpan={4} className="px-4 py-6 text-center text-sm text-slate-500">
                                            Belum ada data scan.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
        </AppLayout>
    );
}
