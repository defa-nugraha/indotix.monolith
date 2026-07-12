import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

type BookingRow = {
    id: number;
    booking_code: string;
    status: string;
    quantity: number;
    total_price: number;
    event?: { title?: string | null };
    ticket?: { name?: string | null };
    user?: { name?: string | null };
};

type Props = {
    bookings: { data: BookingRow[]; links: Array<{ url: string | null; label: string; active: boolean }> };
    events: Array<{ id: number; title: string }>;
    filters: { status?: string; event_id?: number | null; date?: string };
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Event', href: '/admin/events' },
    { title: 'Booking Event', href: '/admin/events/bookings' },
];

export default function EventBookingsIndex({ bookings, events, filters }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Booking Event" />
            <div className="flex flex-1 flex-col gap-6 bg-[#f6fbff] px-6 py-8">
                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <h1 className="text-2xl font-semibold text-slate-900">Monitoring Booking Event</h1>
                    <p className="text-sm text-slate-500">Filter berdasarkan event, status, dan tanggal.</p>
                    <form
                        className="mt-6 grid gap-3 md:grid-cols-3"
                        onSubmit={(event) => {
                            event.preventDefault();
                            const data = new FormData(event.currentTarget);
                            router.get('/admin/events/bookings', Object.fromEntries(data.entries()), { preserveState: true });
                        }}
                    >
                        <label className="grid gap-1 text-xs font-medium text-slate-600">
                            <span>Event</span>
                            <select name="event_id" defaultValue={filters.event_id ?? ''} className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
                                <option value="">Semua event</option>
                                {events.map((item) => (
                                    <option key={item.id} value={item.id}>
                                        {item.title}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <label className="grid gap-1 text-xs font-medium text-slate-600">
                            <span>Status</span>
                            <select name="status" defaultValue={filters.status ?? ''} className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
                                <option value="">Semua status</option>
                                <option value="pending_payment">Pending</option>
                                <option value="paid">Paid</option>
                                <option value="cancelled">Cancelled</option>
                                <option value="expired">Expired</option>
                                <option value="completed">Completed</option>
                            </select>
                        </label>
                        <label className="grid gap-1 text-xs font-medium text-slate-600">
                            <span>Tanggal</span>
                            <input type="date" name="date" defaultValue={filters.date ?? ''} className="rounded-lg border border-slate-200 px-3 py-2 text-sm" />
                        </label>
                        <Button type="submit" className="bg-sky-600 text-white hover:bg-sky-700 md:col-span-3">
                            Filter
                        </Button>
                    </form>
                </section>

                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <div className="overflow-hidden rounded-2xl border border-slate-100">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                                <tr>
                                    <th className="px-4 py-3 text-left">Kode</th>
                                    <th className="px-4 py-3 text-left">Event</th>
                                    <th className="px-4 py-3 text-left">Tiket</th>
                                    <th className="px-4 py-3 text-left">Qty</th>
                                    <th className="px-4 py-3 text-left">Status</th>
                                    <th className="px-4 py-3 text-left">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {bookings.data.map((item) => (
                                    <tr key={item.id} className="border-t border-slate-100">
                                        <td className="px-4 py-3">{item.booking_code}</td>
                                        <td className="px-4 py-3">{item.event?.title ?? '-'}</td>
                                        <td className="px-4 py-3">{item.ticket?.name ?? '-'}</td>
                                        <td className="px-4 py-3">{item.quantity}</td>
                                        <td className="px-4 py-3">
                                            <Badge className="bg-slate-100 text-slate-600">{item.status}</Badge>
                                        </td>
                                        <td className="px-4 py-3">
                                            <Link href={`/admin/events/bookings/${item.id}`} className="text-sky-600 hover:underline">
                                                Detail
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                                {bookings.data.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-500">
                                            Belum ada booking event.
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
