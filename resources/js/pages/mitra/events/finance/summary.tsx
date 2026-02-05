import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

type Props = {
    summary: {
        gross: number;
        commission: number;
        net: number;
        bookings_count: number;
    };
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard Mitra', href: '/mitra/dashboard' },
    { title: 'Keuangan', href: '/mitra/events/finance/summary' },
];

export default function MitraEventFinanceSummary({ summary }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Ringkasan Penjualan Event" />
            <div className="flex flex-1 flex-col gap-6 bg-[#f6fbff] px-6 py-8">
                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-600">Keuangan</p>
                    <h1 className="mt-2 text-2xl font-semibold text-slate-900">Ringkasan Penjualan</h1>
                    <div className="mt-6 grid gap-4 md:grid-cols-3">
                        <div className="rounded-2xl border border-slate-100 p-4">
                            <p className="text-xs uppercase text-slate-500">Pendapatan Kotor</p>
                            <p className="mt-2 text-lg font-semibold text-slate-900">
                                Rp {summary.gross.toLocaleString('id-ID')}
                            </p>
                        </div>
                        <div className="rounded-2xl border border-slate-100 p-4">
                            <p className="text-xs uppercase text-slate-500">Komisi Platform</p>
                            <p className="mt-2 text-lg font-semibold text-slate-900">
                                Rp {summary.commission.toLocaleString('id-ID')}
                            </p>
                        </div>
                        <div className="rounded-2xl border border-slate-100 p-4">
                            <p className="text-xs uppercase text-slate-500">Estimasi Net</p>
                            <p className="mt-2 text-lg font-semibold text-slate-900">
                                Rp {summary.net.toLocaleString('id-ID')}
                            </p>
                        </div>
                    </div>
                    <p className="mt-4 text-sm text-slate-500">
                        Total booking: {summary.bookings_count}
                    </p>
                </section>
            </div>
        </AppLayout>
    );
}
