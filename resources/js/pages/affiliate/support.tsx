import { Head } from '@inertiajs/react';
import type { ReactNode } from 'react';
import AffiliateLayout from '@/layouts/affiliate-layout';

export default function AffiliateSupport() {
    return (
        <>
            <Head title="Bantuan Afiliasi" />
            <div className="space-y-6">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-600">Bantuan</p>
                    <h1 className="mt-2 text-2xl font-semibold text-slate-900">Butuh bantuan?</h1>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-6 py-6 text-sm text-slate-600">
                    <p>Silakan hubungi tim support kami:</p>
                    <ul className="mt-3 space-y-1">
                        <li>Email: support@indotix.co.id</li>
                        <li>WhatsApp: +62 812-9205-9888</li>
                    </ul>
                </div>
            </div>
        </>
    );
}

AffiliateSupport.layout = (page: ReactNode) => <AffiliateLayout active="support">{page}</AffiliateLayout>;
