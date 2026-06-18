import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

type Props = {
    destination: { id: number; destination_name: string | null };
    summary: {
        gross: number;
        commission: number;
        net: number;
        bookings_count: number;
    };
    commission_rule?: { type: string; value: number } | null;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard Mitra', href: '/mitra/dashboard' },
    { title: 'Ringkasan Pendapatan', href: '/mitra/wisata/finance/summary' },
];

export default function MitraWisataFinanceSummary({ destination, summary, commission_rule }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Ringkasan Pendapatan Wisata" />
            <div className="flex flex-1 flex-col gap-6 bg-[#f6fbff] px-6 py-8">
                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <p className="text-xs font-semibold uppercase text-sky-600">Keuangan</p>
                    <h1 className="mt-2 text-2xl font-semibold text-slate-900">
                        Ringkasan Pendapatan {destination.destination_name ?? ''}
                    </h1>
                    <p className="text-sm text-slate-500">
                        Total booking berbayar, komisi platform, dan pendapatan bersih.
                    </p>
                </section>

                <section className="grid gap-4 md:grid-cols-3">
                    <div className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                        <p className="text-xs uppercase text-slate-500">Total Booking</p>
                        <p className="mt-2 text-2xl font-semibold text-slate-900">
                            {summary.bookings_count}
                        </p>
                    </div>
                    <div className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                        <p className="text-xs uppercase text-slate-500">Pendapatan Kotor</p>
                        <p className="mt-2 text-2xl font-semibold text-slate-900">
                            Rp {summary.gross.toLocaleString('id-ID')}
                        </p>
                    </div>
                    <div className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                        <p className="text-xs uppercase text-slate-500">Pendapatan Bersih</p>
                        <p className="mt-2 text-2xl font-semibold text-emerald-600">
                            Rp {summary.net.toLocaleString('id-ID')}
                        </p>
                    </div>
                </section>

                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <h2 className="text-lg font-semibold text-slate-900">Detail Komisi</h2>
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
                        <span>
                            Komisi Platform: Rp {summary.commission.toLocaleString('id-ID')}
                        </span>
                        <span>
                            Skema: {commission_rule ? `${commission_rule.type} (${commission_rule.value})` : 'Belum diatur'}
                        </span>
                    </div>
                </section>
            </div>
        </AppLayout>
    );
}
