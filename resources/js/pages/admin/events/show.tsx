import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/form-field';
import { Badge } from '@/components/ui/badge';

type EventDetail = {
    id: number;
    title: string;
    status: string;
    status_reason?: string | null;
    capacity_total: number;
    capacity_sold: number;
    sales_stopped: boolean;
    organizer?: { name?: string | null };
    tickets?: Array<{ id: number; name: string; price: number; is_active: boolean }>;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Event', href: '/admin/events' },
    { title: 'Manajemen Event', href: '/admin/events' },
    { title: 'Detail', href: '#' },
];

export default function EventShow({ event }: { event: EventDetail }) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Detail Event" />
            <div className="flex flex-1 flex-col gap-6 bg-[#f6fbff] px-6 py-8">
                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <div className="flex items-start justify-between gap-6">
                        <div>
                            <h1 className="text-2xl font-semibold text-slate-900">{event.title}</h1>
                            <p className="text-sm text-slate-500">EO: {event.organizer?.name ?? '-'}</p>
                        </div>
                        <div className="flex flex-wrap items-center justify-end gap-2">
                            <Badge className="bg-slate-100 text-slate-600">{event.status}</Badge>
                            <Link href={`/admin/events/${event.id}/edit`}>
                                <Button variant="outline">Edit</Button>
                            </Link>
                            <Button
                                variant="destructive"
                                onClick={() => {
                                    if (confirm('Hapus event ini?')) {
                                        router.delete(`/admin/events/${event.id}`);
                                    }
                                }}
                            >
                                Hapus
                            </Button>
                        </div>
                    </div>
                    {event.status_reason && (
                        <p className="mt-3 text-sm text-slate-500">Alasan: {event.status_reason}</p>
                    )}
                </section>

                <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                    <div className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                        <h2 className="text-lg font-semibold text-slate-900">Update Status</h2>
                        <div className="mt-4 flex flex-wrap gap-2">
                            {['draft', 'pending_review', 'published', 'postponed', 'cancelled', 'completed'].map((status) => (
                                <Button
                                    key={status}
                                    type="button"
                                    variant={status === 'published' ? 'default' : 'outline'}
                                    className={status === 'published' ? 'bg-sky-600 text-white hover:bg-sky-700' : ''}
                                    onClick={() => router.post(`/admin/events/${event.id}/status`, { status })}
                                >
                                    {status}
                                </Button>
                            ))}
                        </div>
                    </div>
                    <div className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                        <h2 className="text-lg font-semibold text-slate-900">Kontrol Kapasitas</h2>
                        <form
                            className="mt-4 grid gap-3"
                            onSubmit={(e) => {
                                e.preventDefault();
                                const data = new FormData(e.currentTarget);
                                router.post(`/admin/events/${event.id}/capacity`, Object.fromEntries(data.entries()));
                            }}
                        >
                            <FormField label="Total kapasitas">
                                <input
                                    name="capacity_total"
                                    defaultValue={event.capacity_total}
                                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                />
                            </FormField>
                            <label className="flex items-center gap-2 text-sm text-slate-600">
                                <input type="checkbox" name="sales_stopped" defaultChecked={event.sales_stopped} />
                                Emergency stop selling
                            </label>
                            <Button type="submit" className="bg-sky-600 text-white hover:bg-sky-700">
                                Simpan
                            </Button>
                        </form>
                        <p className="mt-2 text-xs text-slate-500">
                            Terjual: {event.capacity_sold} / {event.capacity_total}
                        </p>
                    </div>
                </section>

                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <h2 className="text-lg font-semibold text-slate-900">Produk Tiket</h2>
                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                        {event.tickets?.map((ticket) => (
                            <div key={ticket.id} className="rounded-2xl border border-slate-100 p-4">
                                <div className="font-semibold text-slate-900">{ticket.name}</div>
                                                <div className="text-xs text-slate-500">Rp {ticket.price.toLocaleString('id-ID')}</div>
                                <Badge className={ticket.is_active ? 'mt-2 bg-emerald-50 text-emerald-700' : 'mt-2 bg-rose-50 text-rose-700'}>
                                    {ticket.is_active ? 'Aktif' : 'Nonaktif'}
                                </Badge>
                            </div>
                        ))}
                        {(!event.tickets || event.tickets.length === 0) && (
                            <div className="text-sm text-slate-500">Belum ada tiket.</div>
                        )}
                    </div>
                </section>
            </div>
        </AppLayout>
    );
}
