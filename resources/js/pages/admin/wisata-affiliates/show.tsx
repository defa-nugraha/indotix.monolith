import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

type Affiliate = {
    id: number;
    name: string;
    email?: string | null;
    phone?: string | null;
    type: string;
    platform?: string | null;
    status: string;
    notes?: string | null;
    bank_name?: string | null;
    bank_account_number?: string | null;
    bank_account_name?: string | null;
    links?: Array<{ id: number; code: string; token: string; status: string }>;
    commission_items?: Array<{ id: number; commission_amount: number; status: string }>;
    payouts?: Array<{ id: number; total_commission: number; status: string }>;
};

export default function WisataAffiliateShow({ affiliate }: { affiliate: Affiliate }) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Wisata', href: '/admin/wisata/destinations' },
        { title: 'Afiliasi Wisata', href: '/admin/wisata/affiliates' },
        { title: affiliate.name, href: `/admin/wisata/affiliates/${affiliate.id}` },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Afiliasi - ${affiliate.name}`} />
            <div className="space-y-6">
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h2 className="text-lg font-semibold text-slate-900">Profil Afiliasi</h2>
                    <div className="mt-4 grid gap-4 md:grid-cols-3 text-sm text-slate-600">
                        <div>
                            <div className="text-xs uppercase text-slate-400">Nama</div>
                            <div className="font-semibold text-slate-900">{affiliate.name}</div>
                        </div>
                        <div>
                            <div className="text-xs uppercase text-slate-400">Email</div>
                            <div>{affiliate.email ?? '-'}</div>
                        </div>
                        <div>
                            <div className="text-xs uppercase text-slate-400">HP</div>
                            <div>{affiliate.phone ?? '-'}</div>
                        </div>
                        <div>
                            <div className="text-xs uppercase text-slate-400">Tipe</div>
                            <div className="capitalize">{affiliate.type}</div>
                        </div>
                        <div>
                            <div className="text-xs uppercase text-slate-400">Platform</div>
                            <div>{affiliate.platform ?? '-'}</div>
                        </div>
                        <div>
                            <div className="text-xs uppercase text-slate-400">Status</div>
                            <div className="font-semibold text-slate-900">{affiliate.status}</div>
                        </div>
                    </div>
                    <div className="mt-4 grid gap-4 md:grid-cols-3 text-sm text-slate-600">
                        <div>
                            <div className="text-xs uppercase text-slate-400">Bank</div>
                            <div>{affiliate.bank_name ?? '-'}</div>
                        </div>
                        <div>
                            <div className="text-xs uppercase text-slate-400">No Rekening</div>
                            <div>{affiliate.bank_account_number ?? '-'}</div>
                        </div>
                        <div>
                            <div className="text-xs uppercase text-slate-400">Nama Pemilik</div>
                            <div>{affiliate.bank_account_name ?? '-'}</div>
                        </div>
                    </div>
                    {affiliate.notes && (
                        <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-600">
                            {affiliate.notes}
                        </div>
                    )}
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <h3 className="text-sm font-semibold text-slate-900">Referral Link</h3>
                        <div className="mt-3 space-y-2 text-sm text-slate-600">
                            {(affiliate.links ?? []).map((link) => (
                                <div key={link.id} className="flex items-center justify-between">
                                    <span className="font-semibold">{link.code}</span>
                                    <span className="text-xs uppercase">{link.status}</span>
                                </div>
                            ))}
                            {(affiliate.links ?? []).length === 0 && <div className="text-xs text-slate-400">Belum ada link</div>}
                        </div>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <h3 className="text-sm font-semibold text-slate-900">Komisi</h3>
                        <div className="mt-3 space-y-2 text-sm text-slate-600">
                            {(affiliate.commission_items ?? []).slice(0, 5).map((item) => (
                                <div key={item.id} className="flex items-center justify-between">
                                    <span>Rp {item.commission_amount.toLocaleString('id-ID')}</span>
                                    <span className="text-xs uppercase">{item.status}</span>
                                </div>
                            ))}
                            {(affiliate.commission_items ?? []).length === 0 && <div className="text-xs text-slate-400">Belum ada komisi</div>}
                        </div>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <h3 className="text-sm font-semibold text-slate-900">Payout</h3>
                        <div className="mt-3 space-y-2 text-sm text-slate-600">
                            {(affiliate.payouts ?? []).slice(0, 5).map((item) => (
                                <div key={item.id} className="flex items-center justify-between">
                                    <span>Rp {item.total_commission.toLocaleString('id-ID')}</span>
                                    <span className="text-xs uppercase">{item.status}</span>
                                </div>
                            ))}
                            {(affiliate.payouts ?? []).length === 0 && <div className="text-xs text-slate-400">Belum ada payout</div>}
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
