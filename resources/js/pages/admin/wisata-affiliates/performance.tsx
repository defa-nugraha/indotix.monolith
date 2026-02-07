import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

type Props = {
    stats: {
        total_clicks: number;
        total_commission: number;
        total_approved: number;
        total_pending: number;
    };
    affiliates: Array<{ id: number; name: string; links_count: number }>;
};

export default function WisataAffiliatePerformance({ stats, affiliates }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Wisata', href: '/admin/wisata/destinations' },
        { title: 'Afiliasi Wisata', href: '/admin/wisata/affiliates' },
        { title: 'Monitoring Kinerja', href: '/admin/wisata/affiliates/performance' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Monitoring Kinerja Afiliasi" />
            <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-4">
                    {[
                        { label: 'Klik', value: stats.total_clicks },
                        { label: 'Total Komisi', value: stats.total_commission },
                        { label: 'Komisi Approved', value: stats.total_approved },
                        { label: 'Komisi Pending', value: stats.total_pending },
                    ].map((item) => (
                        <div key={item.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                            <div className="text-xs uppercase text-slate-400">{item.label}</div>
                            <div className="mt-2 text-xl font-semibold text-slate-900">Rp {Number(item.value).toLocaleString('id-ID')}</div>
                        </div>
                    ))}
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-slate-900">Top Afiliasi</h3>
                    <div className="mt-4 space-y-2 text-sm">
                        {affiliates.map((item) => (
                            <div key={item.id} className="flex items-center justify-between border-b border-slate-100 pb-2">
                                <span className="font-semibold">{item.name}</span>
                                <span className="text-xs text-slate-500">Link {item.links_count}</span>
                            </div>
                        ))}
                        {affiliates.length === 0 && <div className="text-sm text-slate-500">Belum ada data.</div>}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
