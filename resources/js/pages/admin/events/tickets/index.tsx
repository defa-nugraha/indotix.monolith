import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

type Ticket = {
    id: number;
    name: string;
    price: number;
    is_active: boolean;
    max_per_user: number;
    quota: number;
    event?: { title?: string | null };
};

type Props = {
    tickets: { data: Ticket[] };
    events: Array<{ id: number; title: string }>;
    filters: { event_id?: number | null };
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Event', href: '/admin/events' },
    { title: 'Produk Tiket', href: '/admin/events/tickets' },
];

export default function EventTicketsIndex({ tickets, events, filters }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Produk Tiket Event" />
            <div className="flex flex-1 flex-col gap-6 bg-[#f6fbff] px-6 py-8">
                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <h1 className="text-2xl font-semibold text-slate-900">Produk Tiket Event</h1>
                    <p className="text-sm text-slate-500">Aktif/nonaktif dan batas pembelian per user.</p>
                    <form
                        className="mt-6 flex flex-wrap gap-3"
                        onSubmit={(event) => {
                            event.preventDefault();
                            const data = new FormData(event.currentTarget);
                            router.get('/admin/events/tickets', Object.fromEntries(data.entries()), { preserveState: true });
                        }}
                    >
                        <select name="event_id" defaultValue={filters.event_id ?? ''} className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
                            <option value="">Semua event</option>
                            {events.map((item) => (
                                <option key={item.id} value={item.id}>
                                    {item.title}
                                </option>
                            ))}
                        </select>
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
                                    <th className="px-4 py-3 text-left">Tiket</th>
                                    <th className="px-4 py-3 text-left">Event</th>
                                    <th className="px-4 py-3 text-left">Harga</th>
                                    <th className="px-4 py-3 text-left">Max/User</th>
                                    <th className="px-4 py-3 text-left">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tickets.data.map((ticket) => (
                                    <tr key={ticket.id} className="border-t border-slate-100">
                                        <td className="px-4 py-3 font-semibold text-slate-900">{ticket.name}</td>
                                        <td className="px-4 py-3">{ticket.event?.title ?? '-'}</td>
                                        <td className="px-4 py-3">Rp {ticket.price}</td>
                                        <td className="px-4 py-3">
                                            <form
                                                onSubmit={(e) => {
                                                    e.preventDefault();
                                                    const data = new FormData(e.currentTarget);
                                                    router.post(`/admin/events/tickets/${ticket.id}`, Object.fromEntries(data.entries()), { preserveScroll: true });
                                                }}
                                                className="flex items-center gap-2"
                                            >
                                                <input
                                                    name="max_per_user"
                                                    defaultValue={ticket.max_per_user}
                                                    className="w-20 rounded-md border border-slate-200 px-2 py-1 text-xs"
                                                />
                                                <input name="quota" defaultValue={ticket.quota} className="w-20 rounded-md border border-slate-200 px-2 py-1 text-xs" />
                                                <select name="is_active" defaultValue={ticket.is_active ? '1' : '0'} className="rounded-md border border-slate-200 px-2 py-1 text-xs">
                                                    <option value="1">Aktif</option>
                                                    <option value="0">Nonaktif</option>
                                                </select>
                                                <Button type="submit" variant="outline" className="h-7 px-3 text-xs">
                                                    Simpan
                                                </Button>
                                            </form>
                                        </td>
                                        <td className="px-4 py-3">
                                            <Badge className={ticket.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}>
                                                {ticket.is_active ? 'Aktif' : 'Nonaktif'}
                                            </Badge>
                                        </td>
                                    </tr>
                                ))}
                                {tickets.data.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-500">
                                            Belum ada tiket event.
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
