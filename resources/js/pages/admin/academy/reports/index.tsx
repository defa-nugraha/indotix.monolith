import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

type Props = {
    summary: { classes: number; bookings: number; gross: number };
    classes: Array<{ id: number; title: string; bookings_count: number }>;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Eljohn Academy', href: '/admin/academy/classes' },
    { title: 'Laporan', href: '/admin/academy/reports' },
];

export default function AcademyReports({ summary, classes }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Laporan Academy" />
            <div className="flex flex-1 flex-col gap-6 bg-[#f6fbff] px-6 py-8">
                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <h1 className="text-2xl font-semibold text-slate-900">Laporan & Analitik</h1>
                    <div className="mt-4 grid gap-4 md:grid-cols-3">
                        <div className="rounded-2xl border border-slate-100 p-4">
                            <p className="text-xs uppercase text-slate-500">Total Kelas</p>
                            <p className="mt-2 text-lg font-semibold text-slate-900">{summary.classes}</p>
                        </div>
                        <div className="rounded-2xl border border-slate-100 p-4">
                            <p className="text-xs uppercase text-slate-500">Total Booking</p>
                            <p className="mt-2 text-lg font-semibold text-slate-900">{summary.bookings}</p>
                        </div>
                        <div className="rounded-2xl border border-slate-100 p-4">
                            <p className="text-xs uppercase text-slate-500">Pendapatan</p>
                            <p className="mt-2 text-lg font-semibold text-slate-900">
                                Rp {summary.gross.toLocaleString('id-ID')}
                            </p>
                        </div>
                    </div>
                </section>

                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <h2 className="text-lg font-semibold text-slate-900">Penjualan per Kelas</h2>
                    <div className="mt-4 grid gap-3">
                        {classes.map((item) => (
                            <div key={item.id} className="rounded-2xl border border-slate-100 p-4">
                                <div className="text-sm font-semibold text-slate-900">{item.title}</div>
                                <div className="text-xs text-slate-500">Booking: {item.bookings_count}</div>
                            </div>
                        ))}
                        {classes.length === 0 && (
                            <div className="text-sm text-slate-500">Belum ada data.</div>
                        )}
                    </div>
                </section>
            </div>
        </AppLayout>
    );
}
