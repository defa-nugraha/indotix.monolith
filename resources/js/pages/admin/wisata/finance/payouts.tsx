import { Head, router, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

type Option = { id: number; label: string };

type Payout = {
    id: number;
    period_start: string;
    period_end: string;
    total_gmv: number;
    commission_amount: number;
    net_payout: number;
    status: string;
    destination?: string | null;
};

type Props = {
    payouts: { data: Payout[] };
    destinations: Option[];
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Wisata', href: '/admin/wisata/destinations' },
    { title: 'Payout Mitra', href: '/admin/wisata/finance/payouts' },
];

const statusTone = (status?: string) => {
    if (status === 'paid') return 'bg-emerald-50 text-emerald-700';
    if (status === 'approved') return 'bg-blue-50 text-blue-700';
    if (status === 'rejected') return 'bg-red-50 text-red-700';
    return 'bg-amber-50 text-amber-700';
};

export default function AdminWisataPayouts({ payouts, destinations }: Props) {
    const form = useForm({
        mitra_wisata_onboarding_id: '',
        period_start: '',
        period_end: '',
    });

    const updateStatus = (payoutId: number, status: string) => {
        router.post(`/admin/wisata/finance/payouts/${payoutId}`, { status });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Payout Mitra Wisata" />
            <div className="flex flex-1 flex-col gap-6 bg-[#f6fbff] px-6 py-8">
                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <h1 className="text-2xl font-semibold text-slate-900">Generate Payout</h1>
                    <form
                        className="mt-6 grid gap-4 md:grid-cols-3"
                        onSubmit={(event) => {
                            event.preventDefault();
                            form.post('/admin/wisata/finance/payouts');
                        }}
                    >
                        <label className="grid gap-1 text-xs font-medium text-slate-600">
                            <span>Destinasi</span>
                            <select
                                value={form.data.mitra_wisata_onboarding_id}
                                onChange={(event) => form.setData('mitra_wisata_onboarding_id', event.target.value)}
                                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                            >
                                <option value="">Pilih destinasi</option>
                                {destinations.map((item) => (
                                    <option key={item.id} value={item.id}>
                                        {item.label}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <label className="grid gap-1 text-xs font-medium text-slate-600">
                            <span>Periode mulai</span>
                            <input
                                type="date"
                                value={form.data.period_start}
                                onChange={(event) => form.setData('period_start', event.target.value)}
                                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                            />
                        </label>
                        <label className="grid gap-1 text-xs font-medium text-slate-600">
                            <span>Periode selesai</span>
                            <input
                                type="date"
                                value={form.data.period_end}
                                onChange={(event) => form.setData('period_end', event.target.value)}
                                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                            />
                        </label>
                        <Button type="submit" className="bg-sky-600 text-white hover:bg-sky-700">
                            Generate
                        </Button>
                    </form>
                </section>

                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <h2 className="text-lg font-semibold text-slate-900">Daftar Payout</h2>
                    <div className="mt-4 overflow-hidden rounded-2xl border border-slate-100">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                                <tr>
                                    <th className="px-4 py-3 text-left">Destinasi</th>
                                    <th className="px-4 py-3 text-left">Periode</th>
                                    <th className="px-4 py-3 text-left">GMV</th>
                                    <th className="px-4 py-3 text-left">Net</th>
                                    <th className="px-4 py-3 text-left">Status</th>
                                    <th className="px-4 py-3 text-left">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {payouts.data.map((item) => (
                                    <tr key={item.id} className="border-t border-slate-100">
                                        <td className="px-4 py-3">{item.destination ?? '-'}</td>
                                        <td className="px-4 py-3">
                                            {item.period_start} → {item.period_end}
                                        </td>
                                        <td className="px-4 py-3">Rp {item.total_gmv.toLocaleString('id-ID')}</td>
                                        <td className="px-4 py-3">Rp {item.net_payout.toLocaleString('id-ID')}</td>
                                        <td className="px-4 py-3">
                                            <Badge className={statusTone(item.status)}>{item.status}</Badge>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex flex-wrap gap-2">
                                                <Button size="sm" variant="outline" onClick={() => updateStatus(item.id, 'approved')}>
                                                    Approve
                                                </Button>
                                                <Button size="sm" variant="outline" onClick={() => updateStatus(item.id, 'paid')}>
                                                    Paid
                                                </Button>
                                                <Button size="sm" variant="outline" onClick={() => updateStatus(item.id, 'rejected')}>
                                                    Reject
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {payouts.data.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-6 text-center text-sm text-slate-500">
                                            Belum ada payout.
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
