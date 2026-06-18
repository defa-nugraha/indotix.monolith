import { Head, Link } from '@inertiajs/react';
import type { ReactNode } from 'react';
import AffiliateLayout from '@/layouts/affiliate-layout';

type CommissionItem = {
    id: number;
    commission_amount: number;
    status: string;
    created_at: string;
    booking?: {
        id: number;
        booking_code?: string;
        total_price?: number;
        destination?: { destination_name?: string | null };
    } | null;
};

export default function AffiliateCommissions({
    items,
    filters,
}: {
    items: { data: CommissionItem[]; links: any };
    filters: { status?: string | null };
}) {
    return (
        <>
            <Head title="Riwayat Komisi" />
            <div className="space-y-6">
                <div>
                    <p className="text-xs font-semibold uppercase text-sky-600">Riwayat Komisi</p>
                    <h1 className="mt-2 text-2xl font-semibold text-slate-900">Komisi dari penjualan wisata</h1>
                </div>

                <div className="flex flex-wrap gap-2">
                    {['', 'pending', 'approved', 'cancelled'].map((status) => (
                        <Link
                            key={status || 'all'}
                            href={`/affiliate/commissions${status ? `?status=${status}` : ''}`}
                            className={`rounded-full px-4 py-1 text-xs font-semibold ${
                                (filters.status ?? '') === status
                                    ? 'bg-sky-600 text-white'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                        >
                            {status === '' ? 'Semua' : status}
                        </Link>
                    ))}
                </div>

                <div className="space-y-3">
                    {items.data.map((item) => (
                        <div key={item.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <div>
                                    <p className="text-sm font-semibold text-slate-900">
                                        {item.booking?.destination?.destination_name ?? 'Booking Wisata'}
                                    </p>
                                    <p className="text-xs text-slate-500">
                                        {item.created_at ? new Date(item.created_at).toLocaleDateString('id-ID') : '-'}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-semibold text-slate-900">
                                        Rp {item.commission_amount.toLocaleString('id-ID')}
                                    </p>
                                    <span className="text-xs font-semibold capitalize text-slate-500">{item.status}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                    {items.data.length === 0 && (
                        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center text-sm text-slate-500">
                            Belum ada komisi yang tercatat.
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

AffiliateCommissions.layout = (page: ReactNode) => <AffiliateLayout active="commissions">{page}</AffiliateLayout>;
