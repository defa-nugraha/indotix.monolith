import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

type Props = {
    summary: {
        gmv: number;
        revenue: number;
        refund_total: number;
        outstanding: number;
    };
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Event', href: '/admin/events' },
    { title: 'Laporan Event', href: '/admin/events/finance/reports' },
];

export default function EventReports({ summary }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Laporan Keuangan Event" />
            <div className="flex flex-1 flex-col gap-6 bg-[#f6fbff] px-6 py-8">
                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <h1 className="text-2xl font-semibold text-slate-900">Laporan Keuangan Event</h1>
                    <div className="mt-6 grid gap-4 md:grid-cols-4">
                        <div className="rounded-2xl border border-slate-100 p-4">
                            <div className="text-xs text-slate-500">GMV Tiket</div>
                            <div className="text-lg font-semibold text-slate-900">Rp {summary.gmv}</div>
                        </div>
                        <div className="rounded-2xl border border-slate-100 p-4">
                            <div className="text-xs text-slate-500">Revenue Platform</div>
                            <div className="text-lg font-semibold text-slate-900">Rp {summary.revenue}</div>
                        </div>
                        <div className="rounded-2xl border border-slate-100 p-4">
                            <div className="text-xs text-slate-500">Refund Total</div>
                            <div className="text-lg font-semibold text-slate-900">Rp {summary.refund_total}</div>
                        </div>
                        <div className="rounded-2xl border border-slate-100 p-4">
                            <div className="text-xs text-slate-500">Outstanding Payout</div>
                            <div className="text-lg font-semibold text-slate-900">Rp {summary.outstanding}</div>
                        </div>
                    </div>
                </section>
            </div>
        </AppLayout>
    );
}
