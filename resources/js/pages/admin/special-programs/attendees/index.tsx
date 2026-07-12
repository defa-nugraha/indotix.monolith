import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

type Attendee = {
    id: number;
    name: string;
    email?: string | null;
    phone?: string | null;
    attendance_status: 'present' | 'absent';
    checked_in_at?: string | null;
    booking?: {
        program?: { name?: string | null };
        variant?: { name?: string | null };
        visit_date?: string | null;
    };
};

type Props = {
    attendees: { data: Attendee[] };
    programs: Array<{ id: number; name: string }>;
    filters: { program_id?: number | null; status?: string };
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Special Program', href: '/admin/special-programs' },
    { title: 'Data Peserta', href: '/admin/special-programs/attendees' },
];

export default function SpecialProgramAttendeesIndex({
    attendees,
    programs,
    filters,
}: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Data Peserta Special Program" />
            <div className="flex flex-1 flex-col gap-6 bg-[#f6fbff] px-6 py-8">
                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <h1 className="text-2xl font-semibold text-slate-900">Data Peserta</h1>
                    <p className="text-sm text-slate-500">
                        Pantau peserta special program dan status kehadirannya.
                    </p>
                    <form
                        className="mt-6 flex flex-wrap gap-3"
                        onSubmit={(event) => {
                            event.preventDefault();
                            const data = new FormData(event.currentTarget);
                            router.get('/admin/special-programs/attendees', Object.fromEntries(data.entries()), {
                                preserveState: true,
                            });
                        }}
                    >
                        <label className="grid gap-1 text-xs font-medium text-slate-600">
                            <span>Program</span>
                            <select
                                name="program_id"
                                defaultValue={filters.program_id ?? ''}
                                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                            >
                                <option value="">Semua program</option>
                                {programs.map((item) => (
                                    <option key={item.id} value={item.id}>
                                        {item.name}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <label className="grid gap-1 text-xs font-medium text-slate-600">
                            <span>Status kehadiran</span>
                            <select
                                name="status"
                                defaultValue={filters.status ?? ''}
                                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                            >
                                <option value="">Semua status</option>
                                <option value="present">Sudah hadir</option>
                                <option value="absent">Belum hadir</option>
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
                                    <th className="px-4 py-3 text-left">Kontak</th>
                                    <th className="px-4 py-3 text-left">Special Program</th>
                                    <th className="px-4 py-3 text-left">Tiket/Paket</th>
                                    <th className="px-4 py-3 text-left">Tanggal</th>
                                    <th className="px-4 py-3 text-left">Kehadiran</th>
                                </tr>
                            </thead>
                            <tbody>
                                {attendees.data.map((item) => (
                                    <tr key={item.id} className="border-t border-slate-100">
                                        <td className="px-4 py-3 font-medium text-slate-900">{item.name}</td>
                                        <td className="px-4 py-3 text-xs text-slate-500">
                                            <div>{item.email ?? '-'}</div>
                                            <div>{item.phone ?? '-'}</div>
                                        </td>
                                        <td className="px-4 py-3">{item.booking?.program?.name ?? '-'}</td>
                                        <td className="px-4 py-3">{item.booking?.variant?.name ?? '-'}</td>
                                        <td className="px-4 py-3">{item.booking?.visit_date ?? '-'}</td>
                                        <td className="px-4 py-3">
                                            <Badge
                                                className={
                                                    item.attendance_status === 'present'
                                                        ? 'bg-emerald-50 text-emerald-700'
                                                        : 'bg-slate-100 text-slate-700'
                                                }
                                            >
                                                {item.attendance_status === 'present' ? 'Sudah hadir' : 'Belum hadir'}
                                            </Badge>
                                            {item.checked_in_at && (
                                                <div className="mt-1 text-xs text-slate-500">{item.checked_in_at}</div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {attendees.data.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-500">
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
