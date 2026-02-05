import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Badge } from '@/components/ui/badge';

type AttendeeRow = {
    id: number;
    name: string;
    attendance_status: string;
    booking?: { academy_class?: { title?: string | null }; ticket?: { name?: string | null } };
};

type Props = {
    attendees: { data: AttendeeRow[] };
    classes: Array<{ id: number; title: string }>;
    filters: { class_id?: number | null; checked_in?: string };
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Eljohn Academy', href: '/admin/academy/classes' },
    { title: 'Peserta', href: '/admin/academy/attendees' },
];

export default function AcademyAttendeesIndex({ attendees, classes, filters }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Peserta Academy" />
            <div className="flex flex-1 flex-col gap-6 bg-[#f6fbff] px-6 py-8">
                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-600">Academy</p>
                            <h1 className="mt-2 text-2xl font-semibold text-slate-900">Peserta</h1>
                        </div>
                        <form
                            className="flex flex-wrap gap-2"
                            onSubmit={(event) => {
                                event.preventDefault();
                                const data = new FormData(event.currentTarget);
                                router.get('/admin/academy/attendees', Object.fromEntries(data.entries()));
                            }}
                        >
                            <select
                                name="class_id"
                                defaultValue={filters.class_id ?? ''}
                                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                            >
                                <option value="">Semua Kelas</option>
                                {classes.map((item) => (
                                    <option key={item.id} value={item.id}>
                                        {item.title}
                                    </option>
                                ))}
                            </select>
                            <select
                                name="checked_in"
                                defaultValue={filters.checked_in ?? ''}
                                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                            >
                                <option value="">Semua</option>
                                <option value="yes">Hadir</option>
                                <option value="no">Tidak Hadir</option>
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
                                    <th className="px-4 py-3 text-left">Nama</th>
                                    <th className="px-4 py-3 text-left">Kelas</th>
                                    <th className="px-4 py-3 text-left">Tiket</th>
                                    <th className="px-4 py-3 text-left">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {attendees.data.map((item) => (
                                    <tr key={item.id} className="border-t border-slate-100">
                                        <td className="px-4 py-3 font-medium text-slate-900">{item.name}</td>
                                        <td className="px-4 py-3 text-slate-600">{item.booking?.academy_class?.title ?? '-'}</td>
                                        <td className="px-4 py-3 text-slate-600">{item.booking?.ticket?.name ?? '-'}</td>
                                        <td className="px-4 py-3">
                                            <Badge className="bg-slate-100 text-slate-700">{item.attendance_status}</Badge>
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
