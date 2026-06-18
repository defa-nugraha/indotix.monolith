import { Head } from '@inertiajs/react';
import type { ReactNode } from 'react';
import AffiliateLayout from '@/layouts/affiliate-layout';

export default function AffiliateTerms() {
    return (
        <>
            <Head title="Ketentuan Afiliasi" />
            <div className="space-y-6">
                <div>
                    <p className="text-xs font-semibold uppercase text-sky-600">Ketentuan</p>
                    <h1 className="mt-2 text-2xl font-semibold text-slate-900">Syarat & ketentuan afiliasi</h1>
                </div>
                <div className="space-y-3 text-sm text-slate-600">
                    <p>
                        Dengan menjadi afiliator INDOTIX, kamu setuju untuk mempromosikan produk wisata secara
                        profesional dan tidak melakukan manipulasi trafik.
                    </p>
                    <p>
                        Komisi akan dihitung dari tiket yang terjual menggunakan referral link atau kode afiliasi.
                        Komisi bisa dibatalkan jika transaksi dibatalkan atau refund.
                    </p>
                    <p>
                        Payout diproses setelah status komisi disetujui admin dan saldo memenuhi minimum payout.
                    </p>
                </div>
            </div>
        </>
    );
}

AffiliateTerms.layout = (page: ReactNode) => <AffiliateLayout active="terms">{page}</AffiliateLayout>;
