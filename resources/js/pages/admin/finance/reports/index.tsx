import { Head, router } from '@inertiajs/react';
import { Banknote, DollarSign, TrendingUp, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Keuangan & Monetisasi', href: '/admin/finance/reports' },
    { title: 'Laporan Keuangan', href: '/admin/finance/reports' },
];

type Props = {
    filters: {
        date_from?: string | null;
        date_to?: string | null;
    };
    summary: {
        gmv: number;
        revenue: number;
        payout_outstanding: number;
        refund: number;
    };
};

export default function FinanceReportIndex({ filters, summary }: Props) {
    const applyFilters = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        router.get('/admin/finance/reports', Object.fromEntries(form.entries()), {
            preserveState: true,
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Laporan Keuangan" />
            <div className="flex flex-1 flex-col gap-6 bg-[#f6fbff] px-6 py-8 text-slate-900">
                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <div className="space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-600">
                            Laporan Keuangan
                        </p>
                        <h1 className="text-2xl font-semibold text-slate-900">
                            Ringkasan GMV & revenue
                        </h1>
                        <p className="text-sm text-slate-500">
                            Pantau performa pendapatan dan payout outstanding.
                        </p>
                    </div>
                </section>

                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <form onSubmit={applyFilters} className="grid gap-4 md:grid-cols-4">
                        <div className="grid gap-2">
                            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                Dari tanggal
                            </label>
                            <input
                                type="date"
                                name="date_from"
                                defaultValue={filters.date_from ?? ''}
                                className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs"
                            />
                        </div>
                        <div className="grid gap-2">
                            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                Sampai tanggal
                            </label>
                            <input
                                type="date"
                                name="date_to"
                                defaultValue={filters.date_to ?? ''}
                                className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs"
                            />
                        </div>
                        <div className="flex items-end gap-3 md:col-span-2">
                            <Button type="submit" className="bg-sky-600 text-white hover:bg-sky-700">
                                Terapkan
                            </Button>
                        </div>
                    </form>
                </section>

                <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs uppercase tracking-wider text-slate-400">GMV</p>
                                <p className="mt-2 text-xl font-semibold text-slate-900">
                                    Rp {summary.gmv.toLocaleString('id-ID')}
                                </p>
                            </div>
                            <TrendingUp className="size-8 text-sky-500" />
                        </div>
                    </div>
                    <div className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs uppercase tracking-wider text-slate-400">Revenue Platform</p>
                                <p className="mt-2 text-xl font-semibold text-slate-900">
                                    Rp {summary.revenue.toLocaleString('id-ID')}
                                </p>
                            </div>
                            <DollarSign className="size-8 text-emerald-500" />
                        </div>
                    </div>
                    <div className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs uppercase tracking-wider text-slate-400">Payout Outstanding</p>
                                <p className="mt-2 text-xl font-semibold text-slate-900">
                                    Rp {summary.payout_outstanding.toLocaleString('id-ID')}
                                </p>
                            </div>
                            <Wallet className="size-8 text-amber-500" />
                        </div>
                    </div>
                    <div className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs uppercase tracking-wider text-slate-400">Refund</p>
                                <p className="mt-2 text-xl font-semibold text-slate-900">
                                    Rp {summary.refund.toLocaleString('id-ID')}
                                </p>
                            </div>
                            <Banknote className="size-8 text-rose-500" />
                        </div>
                    </div>
                </section>
            </div>
        </AppLayout>
    );
}
