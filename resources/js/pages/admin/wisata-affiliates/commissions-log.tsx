import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

type Item = {
    id: number;
    commission_amount: number;
    status: string;
    reason?: string | null;
    affiliate?: { name: string };
};

type Props = {
    items: { data: Item[] };
};

export default function WisataAffiliateCommissionLog({ items }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Wisata', href: '/admin/wisata/destinations' },
        { title: 'Afiliasi Wisata', href: '/admin/wisata/affiliates' },
        { title: 'Rekap Komisi', href: '/admin/wisata/affiliates/commission-items' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Rekap Komisi Afiliasi" />
            <div className="px-4 md:px-8">
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-slate-900">Rekap Komisi</h3>
                    <div className="mt-4 overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="text-left text-xs uppercase text-slate-500">
                                <tr>
                                    <th className="py-2">Afiliasi</th>
                                    <th>Komisi</th>
                                    <th>Status</th>
                                    <th>Catatan</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {items.data.map((item) => (
                                    <tr key={item.id}>
                                        <td className="py-3">{item.affiliate?.name ?? '-'}</td>
                                        <td>Rp {item.commission_amount.toLocaleString('id-ID')}</td>
                                        <td>{item.status}</td>
                                        <td>{item.reason ?? '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {items.data.length === 0 && <div className="py-6 text-center text-sm text-slate-500">Belum ada komisi.</div>}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
