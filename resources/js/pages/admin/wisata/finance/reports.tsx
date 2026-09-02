import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';

type Props = {
    metrics: {
        gmv: number;
        revenue: number;
        refund: number;
        outstanding: number;
    };
    filters?: {
        start_date?: string;
        end_date?: string;
    };
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Wisata', href: '/admin/wisata/destinations' },
    { title: 'Laporan Keuangan', href: '/admin/wisata/finance/reports' },
];

export default function AdminWisataFinanceReports({ metrics, filters = {} }: Props) {
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
                    <form
                        className="mt-5 grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto_auto]"
                        onSubmit={(event) => {
                            event.preventDefault();
                            router.get(
                                '/admin/wisata/finance/reports',
                                Object.fromEntries(new FormData(event.currentTarget).entries()),
                                { preserveState: true },
                            );
                        }}
                    >
                        <label className="grid gap-1 text-xs font-medium text-slate-600">
                            <span>Start Date</span>
                            <input
                                type="date"
                                name="start_date"
                                defaultValue={filters.start_date ?? ''}
                                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                            />
                        </label>
                        <label className="grid gap-1 text-xs font-medium text-slate-600">
                            <span>End Date</span>
                            <input
                                type="date"
                                name="end_date"
                                defaultValue={filters.end_date ?? ''}
                                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                            />
                        </label>
                        <Button type="submit" className="self-end bg-sky-600 text-white hover:bg-sky-700">
                            Apply
                        </Button>
                        <Button type="button" variant="outline" className="self-end border-slate-200 text-slate-600" asChild>
                            <Link href="/admin/wisata/finance/reports">Reset</Link>
                        </Button>
                    </form>
                    <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        {cards.map((card) => (
                            <div key={card.label} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                                <p className="text-xs uppercase text-slate-400">{card.label}</p>
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
