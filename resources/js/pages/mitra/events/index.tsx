import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

type EventRow = {
    id: number;
    title: string;
    status: string;
    start_at?: string | null;
    end_at?: string | null;
    capacity_total: number;
    capacity_sold: number;
};

type Props = {
    organizer: { id: number; name?: string | null };
    events: { data: EventRow[] };
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard Mitra', href: '/mitra/dashboard' },
    { title: 'Event', href: '/mitra/events' },
];

export default function MitraEventsIndex({ organizer, events }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Manajemen Event" />
            <div className="flex flex-1 flex-col gap-6 bg-[#f6fbff] px-6 py-8">
                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-600">Event</p>
                            <h1 className="mt-2 text-2xl font-semibold text-slate-900">
                                Event EO {organizer.name ?? ''}
                            </h1>
                            <p className="text-sm text-slate-500">Kelola event dan ajukan review ke admin.</p>
                        </div>
                        <Button asChild className="bg-sky-600 text-white hover:bg-sky-700">
                            <Link href="/mitra/events/create">Buat Event</Link>
                        </Button>
                    </div>
                </section>

                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <div className="overflow-hidden rounded-2xl border border-slate-100">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                                <tr>
                                    <th className="px-4 py-3 text-left">Judul</th>
                                    <th className="px-4 py-3 text-left">Jadwal</th>
                                    <th className="px-4 py-3 text-left">Kapasitas</th>
                                    <th className="px-4 py-3 text-left">Status</th>
                                    <th className="px-4 py-3 text-left">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {events.data.map((event) => (
                                    <tr key={event.id} className="border-t border-slate-100">
                                        <td className="px-4 py-3 font-medium text-slate-900">{event.title}</td>
                                        <td className="px-4 py-3 text-slate-600">
                                            {event.start_at ?? '-'} <span className="text-slate-400">→</span> {event.end_at ?? '-'}
                                        </td>
                                        <td className="px-4 py-3 text-slate-600">
                                            {event.capacity_sold}/{event.capacity_total}
                                        </td>
                                        <td className="px-4 py-3">
                                            <Badge className="bg-slate-100 text-slate-700">{event.status}</Badge>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex flex-wrap gap-2">
                                                <Button size="sm" variant="outline" asChild>
                                                    <Link href={`/mitra/events/${event.id}`}>Detail</Link>
                                                </Button>
                                                <Button size="sm" variant="outline" asChild>
                                                    <Link href={`/mitra/events/${event.id}/edit`}>Edit</Link>
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {events.data.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-500">
                                            Belum ada event.
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
