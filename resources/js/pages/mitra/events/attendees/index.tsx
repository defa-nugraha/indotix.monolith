import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Badge } from '@/components/ui/badge';

type AttendeeRow = {
    id: number;
    name: string;
    email: string | null;
    phone: string | null;
    checked_in: boolean;
    booking?: { event?: { title?: string | null }; ticket?: { name?: string | null } };
};

type Props = {
    attendees: { data: AttendeeRow[] };
    filters: { checked_in?: string };
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard Mitra', href: '/mitra/dashboard' },
    { title: 'Peserta', href: '/mitra/events/attendees' },
];

export default function MitraEventAttendeesIndex({ attendees, filters }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Peserta Event" />
            <div className="flex flex-1 flex-col gap-6 bg-[#f6fbff] px-6 py-8">
                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <p className="text-xs font-semibold uppercase text-sky-600">Peserta</p>
                            <h1 className="mt-2 text-2xl font-semibold text-slate-900">Data Peserta Event</h1>
                            <p className="text-sm text-slate-500">Pantau status check-in peserta.</p>
                        </div>
                        <form
                            onSubmit={(event) => {
                                event.preventDefault();
                                const data = new FormData(event.currentTarget);
                                router.get('/mitra/events/attendees', Object.fromEntries(data.entries()), {
                                    preserveState: true,
                                });
                            }}
                        >
                            <select
                                name="checked_in"
                                defaultValue={filters.checked_in ?? ''}
                                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                            >
                                <option value="">Semua</option>
                                <option value="yes">Sudah Check-in</option>
                                <option value="no">Belum Check-in</option>
                            </select>
                        </form>
                    </div>
                </section>

                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <div className="overflow-hidden rounded-2xl border border-slate-100">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                                <tr>
                                    <th className="px-4 py-3 text-left">Nama</th>
                                    <th className="px-4 py-3 text-left">Event</th>
                                    <th className="px-4 py-3 text-left">Tiket</th>
                                    <th className="px-4 py-3 text-left">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {attendees.data.map((attendee) => (
                                    <tr key={attendee.id} className="border-t border-slate-100">
                                        <td className="px-4 py-3 font-medium text-slate-900">{attendee.name}</td>
                                        <td className="px-4 py-3 text-slate-600">{attendee.booking?.event?.title ?? '-'}</td>
                                        <td className="px-4 py-3 text-slate-600">{attendee.booking?.ticket?.name ?? '-'}</td>
                                        <td className="px-4 py-3">
                                            <Badge className={attendee.checked_in ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-700'}>
                                                {attendee.checked_in ? 'Checked-in' : 'Belum'}
                                            </Badge>
                                        </td>
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
