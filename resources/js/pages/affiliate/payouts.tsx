import { Head, useForm } from '@inertiajs/react';
import type { ReactNode } from 'react';
import AffiliateLayout from '@/layouts/affiliate-layout';
import Swal from 'sweetalert2';

type Payout = {
    id: number;
    total_commission: number;
    status: string;
    created_at: string;
};

export default function AffiliatePayouts({
    payouts,
    available,
    min_payout,
    affiliate,
}: {
    payouts: Payout[];
    available: number;
    min_payout: number;
    affiliate: { bank_name?: string | null; bank_account_number?: string | null; bank_account_name?: string | null };
}) {
    const form = useForm({});

    const requestPayout = () => {
        form.post('/affiliate/payouts', {
            onSuccess: () => Swal.fire({ icon: 'success', title: 'Permintaan terkirim', text: 'Payout akan diproses admin.' }),
            onError: () => Swal.fire({ icon: 'error', title: 'Gagal', text: 'Saldo belum memenuhi minimum payout.' }),
        });
    };

    return (
        <>
            <Head title="Payout Afiliator" />
            <div className="space-y-6">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-600">Payout</p>
                    <h1 className="mt-2 text-2xl font-semibold text-slate-900">Riwayat pencairan komisi</h1>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Saldo bisa ditarik</p>
                        <p className="mt-2 text-2xl font-semibold text-slate-900">Rp {available.toLocaleString('id-ID')}</p>
                        <p className="mt-1 text-xs text-slate-500">Minimum payout: Rp {min_payout.toLocaleString('id-ID')}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Rekening</p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">{affiliate.bank_name ?? '-'}</p>
                        <p className="text-xs text-slate-500">{affiliate.bank_account_number ?? '-'}</p>
                        <p className="text-xs text-slate-500">{affiliate.bank_account_name ?? '-'}</p>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={requestPayout}
                    className="h-11 rounded-xl bg-sky-600 px-6 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-60"
                    disabled={available < min_payout || form.processing}
                >
                    Ajukan Payout
                </button>

                <div className="space-y-3">
                    {payouts.map((payout) => (
                        <div key={payout.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-semibold text-slate-900">Payout #{payout.id}</p>
                                    <p className="text-xs text-slate-500">
                                        {new Date(payout.created_at).toLocaleDateString('id-ID')}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-semibold text-slate-900">
                                        Rp {payout.total_commission.toLocaleString('id-ID')}
                                    </p>
                                    <span className="text-xs font-semibold capitalize text-slate-500">{payout.status}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                    {payouts.length === 0 && (
                        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center text-sm text-slate-500">
                            Belum ada payout yang diajukan.
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

AffiliatePayouts.layout = (page: ReactNode) => <AffiliateLayout active="payouts">{page}</AffiliateLayout>;
