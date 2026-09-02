import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Swal from 'sweetalert2';

type Booking = {
    id: number;
    booking_code: string;
    visit_date: string;
    status: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    destination?: {
        destination_name?: string | null;
        city_code?: string | null;
    };
    ticket?: { name?: string | null };
    items?: Array<{
        wisata_ticket_id?: number;
        ticket_name?: string | null;
        quantity: number;
        unit_price: number;
        subtotal: number;
        ticket?: { name?: string | null };
    }>;
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
    const ticketItems =
        booking.items && booking.items.length > 0
            ? booking.items.map((item) => ({
                  ticket_id: item.wisata_ticket_id ?? 0,
                  name: item.ticket_name ?? item.ticket?.name ?? 'Tiket Wisata',
                  quantity: item.quantity,
                  unit_price: item.unit_price,
                  subtotal: item.subtotal,
              }))
            : [
                  {
                      ticket_id: 0,
                      name: booking.ticket?.name ?? 'Tiket Wisata',
                      quantity: booking.quantity,
                      unit_price: booking.unit_price,
                      subtotal: booking.total_price,
                  },
              ];
    const canCancel = ['pending', 'pending_payment'].includes(booking.status);
    const cancelBooking = async () => {
        const result = await Swal.fire({
            title: 'Batalkan booking?',
            input: 'textarea',
            inputLabel: 'Alasan pembatalan',
            inputPlaceholder: 'Tulis alasan pembatalan...',
            showCancelButton: true,
            confirmButtonText: 'Batalkan booking',
            cancelButtonText: 'Tutup',
            inputValidator: (value) => {
                if (!value) return 'Alasan pembatalan wajib diisi.';
                return null;
            },
        });

        if (!result.isConfirmed) return;

        router.post(
            `/admin/wisata/bookings/${booking.id}/cancel`,
            { reason: result.value },
            {
                preserveScroll: true,
                onSuccess: () =>
                    Swal.fire({
                        title: 'Berhasil',
                        text: 'Booking dibatalkan.',
                        icon: 'success',
                    }),
                onError: () =>
                    Swal.fire({
                        title: 'Gagal',
                        text: 'Booking tidak dapat dibatalkan.',
                        icon: 'error',
                    }),
            },
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Detail Booking ${booking.booking_code}`} />
            <div className="flex flex-1 flex-col gap-6 bg-[#f6fbff] px-6 py-8">
                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <p className="text-xs font-semibold text-sky-600 uppercase">
                                Booking Tiket
                            </p>
                            <h1 className="mt-2 text-2xl font-semibold text-slate-900">
                                {booking.booking_code}
                            </h1>
                            <p className="text-sm text-slate-500">
                                {booking.user?.name ?? 'Guest'} ·{' '}
                                {booking.user?.email ?? '-'}
                            </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <Badge className={statusTone(booking.status)}>
                                {booking.status}
                            </Badge>
                            {canCancel && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="border-rose-200 text-rose-600 hover:bg-rose-50"
                                    onClick={cancelBooking}
                                >
                                    Cancel Booking
                                </Button>
                            )}
                        </div>
                    </div>
                </section>

                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <h2 className="text-lg font-semibold text-slate-900">
                        Detail Booking
                    </h2>
                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                        <div>
                            <p className="text-xs text-slate-400 uppercase">
                                Destinasi
                            </p>
                            <p className="text-sm font-semibold text-slate-900">
                                {booking.destination?.destination_name ?? '-'}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-400 uppercase">
                                Kota
                            </p>
                            <p className="text-sm font-semibold text-slate-900">
                                {cityName ??
                                    booking.destination?.city_code ??
                                    '-'}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-400 uppercase">
                                Produk Tiket
                            </p>
                            <p className="text-sm font-semibold text-slate-900">
                                {ticketItems.length} jenis tiket
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-400 uppercase">
                                Tanggal Kunjungan
                            </p>
                            <p className="text-sm font-semibold text-slate-900">
                                {booking.visit_date}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-400 uppercase">
                                Jumlah
                            </p>
                            <p className="text-sm font-semibold text-slate-900">
                                {booking.quantity} tiket
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-400 uppercase">
                                Harga / tiket
                            </p>
                            <p className="text-sm font-semibold text-slate-900">
                                {ticketItems.length === 1
                                    ? `Rp ${ticketItems[0].unit_price.toLocaleString('id-ID')}`
                                    : 'Beragam'}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-400 uppercase">
                                Total
                            </p>
                            <p className="text-sm font-semibold text-slate-900">
                                Rp {booking.total_price.toLocaleString('id-ID')}
                            </p>
                        </div>
                    </div>
                    <div className="mt-6 rounded-2xl border border-slate-100">
                        {ticketItems.map((item) => (
                            <div
                                key={item.ticket_id}
                                className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 text-sm last:border-b-0"
                            >
                                <div>
                                    <div className="font-semibold text-slate-900">
                                        {item.name}
                                    </div>
                                    <div className="text-xs text-slate-500">
                                        {item.quantity} x Rp{' '}
                                        {item.unit_price.toLocaleString(
                                            'id-ID',
                                        )}
                                    </div>
                                </div>
                                <div className="font-semibold text-slate-900">
                                    Rp {item.subtotal.toLocaleString('id-ID')}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <h2 className="text-lg font-semibold text-slate-900">
                        Riwayat Scan
                    </h2>
                    <div className="mt-4 overflow-hidden rounded-2xl border border-slate-100">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 text-xs text-slate-500 uppercase">
                                <tr>
                                    <th className="px-4 py-3 text-left">
                                        Waktu Scan
                                    </th>
                                    <th className="px-4 py-3 text-left">
                                        Petugas
                                    </th>
                                    <th className="px-4 py-3 text-left">
                                        Lokasi
                                    </th>
                                    <th className="px-4 py-3 text-left">
                                        Anomali
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {booking.scans?.map((scan) => (
                                    <tr
                                        key={scan.id}
                                        className="border-t border-slate-100"
                                    >
                                        <td className="px-4 py-3">
                                            {scan.scanned_at}
                                        </td>
                                        <td className="px-4 py-3">
                                            {scan.officer_name ?? '-'}
                                        </td>
                                        <td className="px-4 py-3">
                                            {scan.location ?? '-'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <Badge
                                                className={
                                                    scan.is_anomaly
                                                        ? 'bg-red-50 text-red-700'
                                                        : 'bg-emerald-50 text-emerald-700'
                                                }
                                            >
                                                {scan.is_anomaly
                                                    ? 'Double Scan'
                                                    : 'Normal'}
                                            </Badge>
                                        </td>
                                    </tr>
                                ))}
                                {(!booking.scans ||
                                    booking.scans.length === 0) && (
                                    <tr>
                                        <td
                                            colSpan={4}
                                            className="px-4 py-6 text-center text-sm text-slate-500"
                                        >
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
