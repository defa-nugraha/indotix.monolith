import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Badge } from '@/components/ui/badge';

type BookingRow = {
    id: number;
    booking_code: string;
    quantity: number;
    total_price: number;
    status: string;
    event?: { id?: number; title?: string | null };
    ticket?: { id?: number; name?: string | null };
    user?: { name?: string | null; email?: string | null };
};

type Props = {
    bookings: { data: BookingRow[]; links: Array<{ url: string | null; label: string; active: boolean }> };
    filters: { status?: string; date?: string };
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard Mitra', href: '/mitra/dashboard' },
    { title: 'Booking Event', href: '/mitra/events/bookings' },
];

export default function MitraEventBookingsIndex({ bookings, filters }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Booking Event" />
            <div className="flex flex-1 flex-col gap-6 bg-[#f6fbff] px-6 py-8">
                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <p className="text-xs font-semibold uppercase text-sky-600">Booking</p>
                            <h1 className="mt-2 text-2xl font-semibold text-slate-900">Monitoring Booking Event</h1>
                            <p className="text-sm text-slate-500">Pantau status booking peserta.</p>
                        </div>
                        <form
                            className="flex flex-wrap gap-2"
                            onSubmit={(event) => {
                                event.preventDefault();
                                const data = new FormData(event.currentTarget);
                                router.get('/mitra/events/bookings', Object.fromEntries(data.entries()), {
                                    preserveState: true,
                                });
                            }}
                        >
                            <input
                                type="date"
                                name="date"
                                defaultValue={filters.date ?? ''}
                                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                            />
                            <select
                                name="status"
                                defaultValue={filters.status ?? ''}
                                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                            >
                                <option value="">Semua Status</option>
                                <option value="pending_payment">pending_payment</option>
                                <option value="paid">paid</option>
                                <option value="cancelled">cancelled</option>
                                <option value="expired">expired</option>
                                <option value="completed">completed</option>
                            </select>
                            <button className="rounded-lg bg-sky-600 px-4 py-2 text-sm text-white">Filter</button>
                        </form>
                    </div>
                </section>

                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <div className="overflow-hidden rounded-2xl border border-slate-100">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                                <tr>
                                    <th className="px-4 py-3 text-left">Kode</th>
                                    <th className="px-4 py-3 text-left">Event</th>
                                    <th className="px-4 py-3 text-left">Tiket</th>
                                    <th className="px-4 py-3 text-left">User</th>
                                    <th className="px-4 py-3 text-left">Total</th>
                                    <th className="px-4 py-3 text-left">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {bookings.data.map((booking) => (
                                    <tr
                                        key={booking.id}
                                        className="border-t border-slate-100 cursor-pointer hover:bg-slate-50"
                                        onClick={() => router.get(`/mitra/events/bookings/${booking.id}`)}
                                    >
                                        <td className="px-4 py-3 font-medium text-slate-900">{booking.booking_code}</td>
                                        <td className="px-4 py-3 text-slate-600">{booking.event?.title ?? '-'}</td>
                                        <td className="px-4 py-3 text-slate-600">{booking.ticket?.name ?? '-'}</td>
                                        <td className="px-4 py-3 text-slate-600">{booking.user?.name ?? '-'}</td>
                                        <td className="px-4 py-3 text-slate-600">
                                            Rp {booking.total_price.toLocaleString('id-ID')}
                                        </td>
                                        <td className="px-4 py-3">
                                            <Badge className="bg-slate-100 text-slate-700">{booking.status}</Badge>
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
