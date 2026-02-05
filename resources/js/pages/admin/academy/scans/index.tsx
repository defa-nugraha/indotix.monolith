import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Badge } from '@/components/ui/badge';

type ScanRow = {
    id: number;
    scanned_at: string;
    officer_name?: string | null;
    device?: string | null;
    is_anomaly: boolean;
    booking?: { academy_class?: { title?: string | null }; booking_code?: string | null };
    ticket?: { name?: string | null };
};

type Props = {
    scans: { data: ScanRow[] };
    classes: Array<{ id: number; title: string }>;
    filters: { class_id?: number | null; date?: string };
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Eljohn Academy', href: '/admin/academy/classes' },
    { title: 'Monitoring QR', href: '/admin/academy/scans' },
];

export default function AcademyScansIndex({ scans, classes, filters }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Monitoring QR Academy" />
            <div className="flex flex-1 flex-col gap-6 bg-[#f6fbff] px-6 py-8">
                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-600">Academy</p>
                            <h1 className="mt-2 text-2xl font-semibold text-slate-900">Monitoring QR</h1>
                        </div>
                        <form
                            className="flex flex-wrap gap-2"
                            onSubmit={(event) => {
                                event.preventDefault();
                                const data = new FormData(event.currentTarget);
                                router.get('/admin/academy/scans', Object.fromEntries(data.entries()));
                            }}
                        >
                            <input
                                type="date"
                                name="date"
                                defaultValue={filters.date ?? ''}
                                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                            />
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
                                    <th className="px-4 py-3 text-left">Kelas</th>
                                    <th className="px-4 py-3 text-left">Tiket</th>
                                    <th className="px-4 py-3 text-left">Waktu</th>
                                    <th className="px-4 py-3 text-left">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {scans.data.map((scan) => (
                                    <tr key={scan.id} className="border-t border-slate-100">
                                        <td className="px-4 py-3 font-medium text-slate-900">{scan.booking?.booking_code ?? '-'}</td>
                                        <td className="px-4 py-3 text-slate-600">{scan.booking?.academy_class?.title ?? '-'}</td>
                                        <td className="px-4 py-3 text-slate-600">{scan.ticket?.name ?? '-'}</td>
                                        <td className="px-4 py-3 text-slate-600">{scan.scanned_at}</td>
                                        <td className="px-4 py-3">
                                            <Badge className={scan.is_anomaly ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'}>
                                                {scan.is_anomaly ? 'Anomali' : 'Valid'}
                                            </Badge>
                                        </td>
                                    </tr>
                                ))}
                                {scans.data.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-500">
                                            Belum ada scan.
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
