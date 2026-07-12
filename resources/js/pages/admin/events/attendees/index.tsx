import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';

type Attendee = {
    id: number;
    name: string;
    email?: string | null;
    phone?: string | null;
    checked_in: boolean;
    booking?: { event?: { title?: string | null }; ticket?: { name?: string | null } };
};

type Props = {
    attendees: { data: Attendee[] };
    events: Array<{ id: number; title: string }>;
    filters: { event_id?: number | null };
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Event', href: '/admin/events' },
    { title: 'Data Peserta', href: '/admin/events/attendees' },
];

export default function EventAttendeesIndex({ attendees, events, filters }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Data Peserta Event" />
            <div className="flex flex-1 flex-col gap-6 bg-[#f6fbff] px-6 py-8">
                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <h1 className="text-2xl font-semibold text-slate-900">Data Peserta</h1>
                    <p className="text-sm text-slate-500">Monitoring peserta dan status check-in.</p>
                    <form
                        className="mt-6 flex flex-wrap gap-3"
                        onSubmit={(event) => {
                            event.preventDefault();
                            const data = new FormData(event.currentTarget);
                            router.get('/admin/events/attendees', Object.fromEntries(data.entries()), { preserveState: true });
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
                                    <th className="px-4 py-3 text-left">Nama</th>
                                    <th className="px-4 py-3 text-left">Event</th>
                                    <th className="px-4 py-3 text-left">Tiket</th>
                                    <th className="px-4 py-3 text-left">Check-in</th>
                                </tr>
                            </thead>
                            <tbody>
                                {attendees.data.map((item) => (
                                    <tr key={item.id} className="border-t border-slate-100">
                                        <td className="px-4 py-3">{item.name}</td>
                                        <td className="px-4 py-3">{item.booking?.event?.title ?? '-'}</td>
                                        <td className="px-4 py-3">{item.booking?.ticket?.name ?? '-'}</td>
                                        <td className="px-4 py-3">{item.checked_in ? 'Sudah' : 'Belum'}</td>
                                    </tr>
                                ))}
                                {attendees.data.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="px-4 py-8 text-center text-sm text-slate-500">
                                            Belum ada peserta.
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
