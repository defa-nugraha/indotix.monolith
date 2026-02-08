import { Head, usePage } from '@inertiajs/react';
import type { ReactNode } from 'react';
import AffiliateLayout from '@/layouts/affiliate-layout';

type Props = {
    affiliate: { id: number; name: string; status: string };
    stats: {
        total_clicks: number;
        total_bookings: number;
        conversion_rate: number;
        total_commission: number;
        approved_commission: number;
        pending_commission: number;
    };
};

export default function AffiliateDashboard({ affiliate, stats }: Props) {
    const { auth } = usePage().props as { auth?: { user?: { name?: string } } };

    return (
        <>
            <Head title="Dashboard Afiliasi" />
            <div className="space-y-6">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-600">Dashboard Afiliasi</p>
                    <h1 className="mt-2 text-2xl font-semibold text-slate-900">
                        Halo {auth?.user?.name ?? affiliate.name}
                    </h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Pantau performa link afiliasimu dan status komisi secara real-time.
                    </p>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    {[
                        { label: 'Total Klik', value: stats.total_clicks },
                        { label: 'Total Booking', value: stats.total_bookings },
                        { label: 'Konversi', value: `${stats.conversion_rate}%` },
                    ].map((item) => (
                        <div key={item.label} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-5">
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{item.label}</p>
                            <p className="mt-2 text-2xl font-semibold text-slate-900">{item.value}</p>
                        </div>
                    ))}
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    {[
                        { label: 'Total Komisi', value: stats.total_commission },
                        { label: 'Komisi Disetujui', value: stats.approved_commission },
                        { label: 'Komisi Pending', value: stats.pending_commission },
                    ].map((item) => (
                        <div key={item.label} className="rounded-2xl border border-slate-200 bg-white px-4 py-5 shadow-sm">
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{item.label}</p>
                            <p className="mt-2 text-2xl font-semibold text-slate-900">
                                Rp {item.value.toLocaleString('id-ID')}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
}

AffiliateDashboard.layout = (page: ReactNode) => <AffiliateLayout active="dashboard">{page}</AffiliateLayout>;
