import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Badge } from '@/components/ui/badge';

type PayoutRow = {
    id: number;
    period_start: string | null;
    period_end: string | null;
    gross: number;
    commission: number;
    net: number;
    status: string;
};

type Props = {
    destination: { id: number; destination_name: string | null };
    payouts: PayoutRow[];
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard Mitra', href: '/mitra/dashboard' },
    { title: 'Riwayat Payout', href: '/mitra/wisata/finance/payouts' },
];

export default function MitraWisataPayouts({ destination, payouts }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Riwayat Payout Wisata" />
            <div className="flex flex-1 flex-col gap-6 bg-[#f6fbff] px-6 py-8">
                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-600">Keuangan</p>
                    <h1 className="mt-2 text-2xl font-semibold text-slate-900">
                        Riwayat Payout {destination.destination_name ?? ''}
                    </h1>
                    <p className="text-sm text-slate-500">
                        Payout dibuat oleh admin. Mitra hanya dapat melihat status.
                    </p>
                </section>

                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <div className="overflow-hidden rounded-2xl border border-slate-100">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                                <tr>
                                    <th className="px-4 py-3 text-left">Periode</th>
                                    <th className="px-4 py-3 text-left">Gross</th>
                                    <th className="px-4 py-3 text-left">Komisi</th>
                                    <th className="px-4 py-3 text-left">Net</th>
                                    <th className="px-4 py-3 text-left">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {payouts.map((row) => (
                                    <tr key={row.id} className="border-t border-slate-100">
                                        <td className="px-4 py-3">
                                            {row.period_start} - {row.period_end}
                                        </td>
                                        <td className="px-4 py-3">
                                            Rp {row.gross.toLocaleString('id-ID')}
                                        </td>
                                        <td className="px-4 py-3">
                                            Rp {row.commission.toLocaleString('id-ID')}
                                        </td>
                                        <td className="px-4 py-3">
                                            Rp {row.net.toLocaleString('id-ID')}
                                        </td>
                                        <td className="px-4 py-3">
                                            <Badge className="bg-slate-50 text-slate-600">{row.status}</Badge>
                                        </td>
                                    </tr>
                                ))}
                                {payouts.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-500">
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
