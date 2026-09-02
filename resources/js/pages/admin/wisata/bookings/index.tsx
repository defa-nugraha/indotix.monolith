import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Swal from 'sweetalert2';

type Option = { id: string | number; label: string };

type BookingRow = {
    id: number;
    booking_code: string;
    visit_date: string;
    status: string;
    quantity: number;
    total_price: number;
    destination?: { id?: number; destination_name?: string | null; city_code?: string | null };
    ticket?: { id?: number; name?: string | null };
    user?: { id?: number; name?: string; email?: string };
};

type Props = {
    bookings: {
        data: BookingRow[];
        links: Array<{ url: string | null; label: string; active: boolean }>;
    };
    destinations: Option[];
    filters: {
        visit_date?: string;
        destination?: string;
        status?: string;
    };
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Wisata', href: '/admin/wisata/destinations' },
    { title: 'Monitoring Booking', href: '/admin/wisata/bookings' },
];

const statusTone = (status?: string) => {
    if (status === 'paid') return 'bg-emerald-50 text-emerald-700';
    if (status === 'pending_payment') return 'bg-amber-50 text-amber-700';
    if (status === 'cancelled') return 'bg-red-50 text-red-700';
    if (status === 'expired') return 'bg-slate-100 text-slate-600';
    if (status === 'completed') return 'bg-blue-50 text-blue-700';
    return 'bg-slate-50 text-slate-600';
};

export default function AdminWisataBookingsIndex({ bookings, destinations, filters }: Props) {
    const submitFilters = (form: HTMLFormElement) => {
        const data = new FormData(form);
        router.get('/admin/wisata/bookings', Object.fromEntries(data.entries()), {
            preserveState: true,
        });
    };

    const cancelBooking = async (booking: BookingRow) => {
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
            <Head title="Monitoring Booking Tiket" />
            <div className="flex flex-1 flex-col gap-6 bg-[#f6fbff] px-6 py-8">
                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <h1 className="text-2xl font-semibold text-slate-900">Monitoring Booking Tiket</h1>
                    <p className="text-sm text-slate-500">Pantau transaksi tiket wisata yang masuk.</p>
                    <form
                        className="mt-6 grid gap-3 md:grid-cols-4"
                        onSubmit={(event) => {
                            event.preventDefault();
                            submitFilters(event.currentTarget);
                        }}
                    >
                        <label className="grid gap-1 text-xs font-medium text-slate-600">
                            <span>Tanggal kunjungan</span>
                            <input
                                name="visit_date"
                                type="date"
                                defaultValue={filters.visit_date ?? ''}
                                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                            />
                        </label>
                        <label className="grid gap-1 text-xs font-medium text-slate-600">
                            <span>Destinasi</span>
                            <select
                                name="destination"
                                defaultValue={filters.destination ?? ''}
                                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                            >
                                <option value="">Semua destinasi</option>
                                {destinations.map((item) => (
                                    <option key={item.id} value={item.id}>
                                        {item.label}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <label className="grid gap-1 text-xs font-medium text-slate-600">
                            <span>Status</span>
                            <select
                                name="status"
                                defaultValue={filters.status ?? ''}
                                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                            >
                                <option value="">Semua status</option>
                                <option value="pending_payment">Pending Payment</option>
                                <option value="paid">Paid</option>
                                <option value="cancelled">Cancelled</option>
                                <option value="expired">Expired</option>
                                <option value="completed">Completed</option>
                            </select>
                        </label>
                        <Button type="submit" className="bg-sky-600 text-white hover:bg-sky-700">
                            Filter
                        </Button>
                    </form>
                </section>

                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <div className="overflow-hidden rounded-2xl border border-slate-100">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                                <tr>
                                    <th className="px-4 py-3 text-left">Booking</th>
                                    <th className="px-4 py-3 text-left">Destinasi</th>
                                    <th className="px-4 py-3 text-left">Tanggal Kunjungan</th>
                                    <th className="px-4 py-3 text-left">Status</th>
                                    <th className="px-4 py-3 text-left">Total</th>
                                    <th className="px-4 py-3 text-left">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {bookings.data.map((row) => (
                                    <tr key={row.id} className="border-t border-slate-100">
                                        <td className="px-4 py-3">
                                            <div className="font-semibold text-slate-900">{row.booking_code}</div>
                                            <div className="text-xs text-slate-500">{row.user?.name ?? 'Guest'}</div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="text-slate-900">{row.destination?.destination_name ?? '-'}</div>
                                            <div className="text-xs text-slate-500">{row.ticket?.name ?? '-'}</div>
                                        </td>
                                        <td className="px-4 py-3">{row.visit_date}</td>
                                        <td className="px-4 py-3">
                                            <Badge className={statusTone(row.status)}>{row.status}</Badge>
                                        </td>
                                        <td className="px-4 py-3">Rp {row.total_price.toLocaleString('id-ID')}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <Link
                                                    href={`/admin/wisata/bookings/${row.id}`}
                                                    className="text-sm font-semibold text-sky-600 hover:underline"
                                                >
                                                    Detail
                                                </Link>
                                                {['pending', 'pending_payment'].includes(row.status) && (
                                                    <button
                                                        type="button"
                                                        onClick={() => cancelBooking(row)}
                                                        className="text-sm font-semibold text-rose-600 hover:underline"
                                                    >
                                                        Cancel
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {bookings.data.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-500">
                                            Belum ada booking tiket.
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
