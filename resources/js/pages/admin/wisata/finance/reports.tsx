import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

type Props = {
    metrics: {
        gmv: number;
        revenue: number;
        refund: number;
        outstanding: number;
    };
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Wisata', href: '/admin/wisata/destinations' },
    { title: 'Laporan Keuangan', href: '/admin/wisata/finance/reports' },
];

export default function AdminWisataFinanceReports({ metrics }: Props) {
    const cards = [
        { label: 'GMV tiket wisata', value: metrics.gmv },
        { label: 'Revenue platform', value: metrics.revenue },
        { label: 'Refund total', value: metrics.refund },
        { label: 'Outstanding payout', value: metrics.outstanding },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Laporan Keuangan Wisata" />
            <div className="flex flex-1 flex-col gap-6 bg-[#f6fbff] px-6 py-8">
                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <h1 className="text-2xl font-semibold text-slate-900">Laporan Keuangan Wisata</h1>
                    <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        {cards.map((card) => (
                            <div key={card.label} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                                <p className="text-xs uppercase tracking-wider text-slate-400">{card.label}</p>
                                <p className="mt-2 text-xl font-semibold text-slate-900">
                                    Rp {card.value.toLocaleString('id-ID')}
                                </p>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </AppLayout>
    );
}
