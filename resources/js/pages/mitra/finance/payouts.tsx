import { Head, router } from '@inertiajs/react';
import { CalendarDays, Coins } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import type { BreadcrumbItem } from '@/types';

type PayoutRow = {
    id: number;
    hotel_name?: string | null;
    period_start?: string | null;
    period_end?: string | null;
    total_bookings?: number | null;
    gmv?: number | null;
    commission_total?: number | null;
    net_payout?: number | null;
    status?: string | null;
    transfer_status?: string | null;
};

type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

type Props = {
    payouts: {
        data: PayoutRow[];
        links: PaginationLink[];
    };
    filters: {
        status?: string;
        date_from?: string;
        date_to?: string;
    };
    statusOptions: string[];
};

const statusBadge = (status?: string | null) => {
    switch (status) {
        case 'pending':
            return 'bg-amber-50 text-amber-700';
        case 'approved':
            return 'bg-emerald-50 text-emerald-700';
        case 'transferred':
            return 'bg-sky-50 text-sky-700';
        case 'rejected':
            return 'bg-rose-50 text-rose-700';
        default:
            return 'bg-slate-100 text-slate-600';
    }
};

export default function MitraPayouts({ payouts, filters, statusOptions }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard Mitra', href: '/mitra/dashboard' },
        { title: 'Riwayat Payout', href: '/mitra/finance/payouts' },
    ];

    const applyFilters = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        router.get('/mitra/finance/payouts', Object.fromEntries(form.entries()), { preserveState: true });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Riwayat Payout" />
            <div className="relative flex flex-1 flex-col gap-6 overflow-hidden bg-[#f6fbff] px-6 py-8 font-['Plus_Jakarta_Sans'] text-slate-900">
                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-600">Keuangan Mitra</p>
                            <h1 className="mt-2 text-2xl font-semibold text-slate-900">Riwayat payout</h1>
                            <p className="text-sm text-slate-500">Pantau transfer pendapatan ke rekening Anda.</p>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                            <Coins className="size-4 text-sky-500" />
                            {payouts.data.length} payout ditampilkan
                        </div>
                    </div>
                </section>

                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <form onSubmit={applyFilters} className="grid gap-4 md:grid-cols-4">
                        <div className="grid gap-2">
                            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Status</label>
                            <select
                                name="status"
                                defaultValue={filters.status ?? ''}
                                className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs"
                            >
                                <option value="">Semua</option>
                                {statusOptions.map((status) => (
                                    <option key={status} value={status}>
                                        {status}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="grid gap-2">
                            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Dari</label>
                            <input
                                type="date"
                                name="date_from"
                                defaultValue={filters.date_from ?? ''}
                                className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs"
                            />
                        </div>
                        <div className="grid gap-2">
                            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Sampai</label>
                            <input
                                type="date"
                                name="date_to"
                                defaultValue={filters.date_to ?? ''}
                                className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs"
                            />
                        </div>
                        <div className="flex items-end">
                            <Button type="submit" className="bg-sky-600 text-white hover:bg-sky-700">
                                <CalendarDays className="mr-2 size-4" />
                                Terapkan
                            </Button>
                        </div>
                    </form>
                </section>

                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-left text-sm">
                            <thead className="text-xs uppercase tracking-wider text-slate-400">
                                <tr>
                                    <th className="py-3 pr-4">Hotel</th>
                                    <th className="py-3 pr-4">Periode</th>
                                    <th className="py-3 pr-4">Total Booking</th>
                                    <th className="py-3 pr-4">Net Payout</th>
                                    <th className="py-3">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {payouts.data.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="py-6 text-center text-slate-500">
                                            Belum ada payout.
                                        </td>
                                    </tr>
                                )}
                                {payouts.data.map((payout) => (
                                    <tr key={payout.id}>
                                        <td className="py-3 pr-4 text-slate-600">{payout.hotel_name ?? '-'}</td>
                                        <td className="py-3 pr-4 text-slate-600">
                                            {payout.period_start ?? '-'} → {payout.period_end ?? '-'}
                                        </td>
                                        <td className="py-3 pr-4 text-slate-600">{payout.total_bookings ?? 0}</td>
                                        <td className="py-3 pr-4 text-slate-600">
                                            Rp {(payout.net_payout ?? 0).toLocaleString('id-ID')}
                                        </td>
                                        <td className="py-3">
                                            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusBadge(payout.status)}`}>
                                                {payout.status ?? '-'}
                                            </span>
                                            {payout.transfer_status && (
                                                <div className="mt-1 text-xs text-slate-500">
                                                    Transfer: {payout.transfer_status}
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
        </AppLayout>
    );
}
