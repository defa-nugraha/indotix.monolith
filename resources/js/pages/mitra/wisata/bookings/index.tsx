import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

type BookingRow = {
    id: number;
    booking_code: string;
    visit_date: string;
    quantity: number;
    total_price: number;
    status: string;
    ticket?: { id?: number; name?: string | null };
    user?: { id?: number; name?: string | null; email?: string | null };
};

type Props = {
    destination: { id: number; destination_name: string | null };
    bookings: {
        data: BookingRow[];
        links: Array<{ url: string | null; label: string; active: boolean }>;
    };
    filters: { visit_date?: string; status?: string };
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard Mitra', href: '/mitra/dashboard' },
    { title: 'Booking Wisata', href: '/mitra/wisata/bookings' },
];

const statusLabel: Record<string, string> = {
    pending_payment: 'Pending Payment',
    paid: 'Paid',
    cancelled: 'Cancelled',
    expired: 'Expired',
    completed: 'Completed',
};

export default function MitraWisataBookingsIndex({ destination, bookings, filters }: Props) {
    const submitFilters = (form: HTMLFormElement) => {
        const data = new FormData(form);
        router.get('/mitra/wisata/bookings', Object.fromEntries(data.entries()), {
            preserveState: true,
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Booking Tiket Wisata" />
            <div className="workspace-page">
                <section className="workspace-panel">
                    <div>
                        <p className="text-xs font-semibold uppercase text-sky-600">
                            Booking Wisata
                        </p>
                        <h1 className="mt-2 text-2xl font-semibold text-slate-900">
                            Monitoring Booking {destination.destination_name ?? ''}
                        </h1>
                        <p className="text-sm text-slate-500">
                            Pantau booking tiket masuk dan statusnya.
                        </p>
                    </div>
                    <form
                        className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3"
                        onSubmit={(event) => {
                            event.preventDefault();
                            submitFilters(event.currentTarget);
                        }}
                    >
                        <label className="grid gap-1 text-xs font-medium text-slate-600">
                            <span>Tanggal kunjungan</span>
                            <input
                                type="date"
                                name="visit_date"
                                defaultValue={filters.visit_date ?? ''}
                                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                            />
                        </label>
                        <label className="grid gap-1 text-xs font-medium text-slate-600">
                            <span>Status</span>
                            <select
                                name="status"
                                defaultValue={filters.status ?? ''}
                                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                            >
                            <option value="">Semua status</option>
                            <option value="pending_payment">Pending</option>
                            <option value="paid">Paid</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                            <option value="expired">Expired</option>
                            </select>
                        </label>
                        <Button type="submit" className="bg-sky-600 text-white hover:bg-sky-700">
                            Filter
                        </Button>
                    </form>
                </section>

                <section className="workspace-panel">
                    <div className="workspace-table-wrap">
                        <table className="workspace-table">
                            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                                <tr>
                                    <th className="px-4 py-3 text-left">Kode</th>
                                    <th className="px-4 py-3 text-left">Tanggal</th>
                                    <th className="px-4 py-3 text-left">Tiket</th>
                                    <th className="px-4 py-3 text-left">Pemesan</th>
                                    <th className="px-4 py-3 text-left">Status</th>
                                    <th className="px-4 py-3 text-left">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {bookings.data.map((booking) => (
                                    <tr key={booking.id} className="border-t border-slate-100">
                                        <td className="px-4 py-3 font-semibold text-slate-900">
                                            {booking.booking_code}
                                        </td>
                                        <td className="px-4 py-3">{booking.visit_date}</td>
                                        <td className="px-4 py-3">{booking.ticket?.name ?? '-'}</td>
                                        <td className="px-4 py-3">
                                            {booking.user?.name ?? 'Guest'}<br />
                                            <span className="text-xs text-slate-500">{booking.user?.email ?? ''}</span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <Badge className="bg-slate-50 text-slate-600">
                                                {statusLabel[booking.status] ?? booking.status}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3">
                                            <Link
                                                href={`/mitra/wisata/bookings/${booking.id}`}
                                                className="text-xs font-semibold text-sky-600"
                                            >
                                                Detail
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                                {bookings.data.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-500">
                                            Belum ada booking.
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
