import { Head, Link, router } from '@inertiajs/react';
import { CheckCircle2, DollarSign, Filter, PlusCircle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Keuangan & Monetisasi', href: '/admin/finance/payouts' },
    { title: 'Payout Mitra', href: '/admin/finance/payouts' },
];

type PayoutRow = {
    id: number;
    hotel_name?: string | null;
    vendor_name?: string | null;
    period_start?: string | null;
    period_end?: string | null;
    total_bookings?: number | null;
    gmv?: number | null;
    commission_total?: number | null;
    net_payout?: number | null;
    status: string;
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
        hotel_id?: string;
        date_from?: string;
        date_to?: string;
    };
    statusOptions: string[];
    hotelOptions: Array<{ id: number; label: string }>;
};

const statusTone = (status: string) => {
    switch (status) {
        case 'approved':
            return 'bg-emerald-50 text-emerald-700';
        case 'pending':
            return 'bg-amber-50 text-amber-700';
        case 'transferred':
            return 'bg-sky-50 text-sky-700';
        case 'rejected':
            return 'bg-rose-50 text-rose-700';
        default:
            return 'bg-slate-100 text-slate-600';
    }
};

export default function PayoutIndex({ payouts, filters, statusOptions, hotelOptions }: Props) {
    const applyFilters = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        router.get('/admin/finance/payouts', Object.fromEntries(form.entries()), { preserveState: true });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Payout Mitra" />
            <div className="flex flex-1 flex-col gap-6 bg-[#f6fbff] px-6 py-8 text-slate-900">
                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <p className="text-xs font-semibold uppercase text-sky-600">
                                Payout Mitra
                            </p>
                            <h1 className="text-2xl font-semibold text-slate-900">
                                Generate & review payout
                            </h1>
                            <p className="text-sm text-slate-500">
                                Hitung total booking, komisi, dan payout bersih.
                            </p>
                        </div>
                        <Button asChild className="bg-sky-600 text-white hover:bg-sky-700">
                            <Link href="/admin/finance/payouts/create">
                                <PlusCircle className="mr-2 size-4" />
                                Generate payout
                            </Link>
                        </Button>
                    </div>
                </section>

                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <form onSubmit={applyFilters} className="grid gap-4 md:grid-cols-5">
                        <div className="grid gap-2 md:col-span-2">
                            <label className="text-xs font-semibold uppercase text-slate-400">
                                Hotel
                            </label>
                            <select
                                name="hotel_id"
                                defaultValue={filters.hotel_id ?? ''}
                                className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs"
                            >
                                <option value="">Semua hotel</option>
                                {hotelOptions.map((hotel) => (
                                    <option key={hotel.id} value={hotel.id}>
                                        {hotel.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="grid gap-2">
                            <label className="text-xs font-semibold uppercase text-slate-400">
                                Status
                            </label>
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
                            <label className="text-xs font-semibold uppercase text-slate-400">
                                Dari tanggal
                            </label>
                            <input type="date" name="date_from" defaultValue={filters.date_from ?? ''} className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs" />
                        </div>
                        <div className="grid gap-2">
                            <label className="text-xs font-semibold uppercase text-slate-400">
                                Sampai tanggal
                            </label>
                            <input type="date" name="date_to" defaultValue={filters.date_to ?? ''} className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs" />
                        </div>
                        <div className="flex items-end gap-3 md:col-span-2">
                            <Button type="submit" className="bg-sky-600 text-white hover:bg-sky-700">
                                <Filter className="mr-2 size-4" />
                                Terapkan
                            </Button>
                            <Button type="button" variant="outline" onClick={() => router.get('/admin/finance/payouts')}>
                                <RotateCcw className="mr-2 size-4" />
                                Reset
                            </Button>
                        </div>
                    </form>
                </section>

                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-left text-sm">
                            <thead className="text-xs uppercase text-slate-400">
                                <tr>
                                    <th className="py-3 pr-4">Hotel</th>
                                    <th className="py-3 pr-4">Periode</th>
                                    <th className="py-3 pr-4">GMV</th>
                                    <th className="py-3 pr-4">Komisi</th>
                                    <th className="py-3 pr-4">Net Payout</th>
                                    <th className="py-3 pr-4">Status</th>
                                    <th className="py-3 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {payouts.data.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="py-8 text-center text-slate-500">
                                            Belum ada data payout.
                                        </td>
                                    </tr>
                                )}
                                {payouts.data.map((payout) => (
                                    <tr key={payout.id}>
                                        <td className="py-4 pr-4">
                                            <div className="font-semibold text-slate-900">{payout.hotel_name ?? '-'}</div>
                                            <div className="text-xs text-slate-500">{payout.vendor_name ?? '-'}</div>
                                        </td>
                                        <td className="py-4 pr-4 text-slate-600">
                                            {payout.period_start ?? '-'} → {payout.period_end ?? '-'}
                                        </td>
                                        <td className="py-4 pr-4 text-slate-600">
                                            Rp {payout.gmv?.toLocaleString('id-ID') ?? '-'}
                                        </td>
                                        <td className="py-4 pr-4 text-slate-600">
                                            Rp {payout.commission_total?.toLocaleString('id-ID') ?? '-'}
                                        </td>
                                        <td className="py-4 pr-4 text-slate-600">
                                            Rp {payout.net_payout?.toLocaleString('id-ID') ?? '-'}
                                        </td>
                                        <td className="py-4 pr-4">
                                            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusTone(payout.status)}`}>
                                                {payout.status}
                                            </span>
                                        </td>
                                        <td className="py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                {payout.status === 'pending' && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                                                        onClick={() => router.post(`/admin/finance/payouts/${payout.id}/approve`)}
                                                    >
                                                        <CheckCircle2 className="mr-1 size-3" />
                                                        Approve
                                                    </Button>
                                                )}
                                                {payout.status === 'approved' && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="border-sky-200 text-sky-600 hover:bg-sky-50"
                                                        onClick={() => router.post(`/admin/finance/payouts/${payout.id}/transfer`)}
                                                    >
                                                        <DollarSign className="mr-1 size-3" />
                                                        Tandai transfer
                                                    </Button>
                                                )}
                                            </div>
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
