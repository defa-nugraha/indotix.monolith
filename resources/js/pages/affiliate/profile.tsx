import { Head, useForm } from '@inertiajs/react';
import type { ReactNode } from 'react';
import AffiliateLayout from '@/layouts/affiliate-layout';

type Affiliate = {
    name: string;
    email?: string | null;
    phone?: string | null;
    type?: string | null;
    platform?: string | null;
    status?: string | null;
    bank_name?: string | null;
    bank_account_number?: string | null;
    bank_account_name?: string | null;
};

export default function AffiliateProfile({ affiliate }: { affiliate: Affiliate }) {
    const form = useForm({
        phone: affiliate.phone ?? '',
        platform: affiliate.platform ?? '',
        bank_name: affiliate.bank_name ?? '',
        bank_account_number: affiliate.bank_account_number ?? '',
        bank_account_name: affiliate.bank_account_name ?? '',
    });

    const submit = (event: React.FormEvent) => {
        event.preventDefault();
        form.put('/affiliate/profile');
    };

    return (
        <>
            <Head title="Profil Afiliasi" />
            <div className="space-y-6">
                <div>
                    <p className="text-xs font-semibold uppercase text-sky-600">Profil Afiliator</p>
                    <h1 className="mt-2 text-2xl font-semibold text-slate-900">Data Afiliasi</h1>
                    <p className="mt-1 text-sm text-slate-500">Pastikan data rekening dan kontak selalu terbaru.</p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                        <p className="text-xs font-semibold uppercase text-slate-400">Nama</p>
                        <p className="mt-1 text-base font-semibold text-slate-900">{affiliate.name}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                        <p className="text-xs font-semibold uppercase text-slate-400">Email</p>
                        <p className="mt-1 text-base font-semibold text-slate-900">{affiliate.email ?? '-'}</p>
                    </div>
                </div>

                <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
                    <label className="space-y-2">
                        <span className="text-sm font-semibold text-slate-700">Nomor HP</span>
                        <input
                            value={form.data.phone}
                            onChange={(event) => form.setData('phone', event.target.value)}
                            className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm focus:border-sky-400 focus:outline-none"
                        />
                        {form.errors.phone && <p className="text-xs text-rose-500">{form.errors.phone}</p>}
                    </label>
                    <label className="space-y-2">
                        <span className="text-sm font-semibold text-slate-700">Platform Promosi</span>
                        <input
                            value={form.data.platform}
                            onChange={(event) => form.setData('platform', event.target.value)}
                            className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm focus:border-sky-400 focus:outline-none"
                            placeholder="Instagram / TikTok / Blog"
                        />
                    </label>

                    <label className="space-y-2">
                        <span className="text-sm font-semibold text-slate-700">Nama Bank</span>
                        <input
                            value={form.data.bank_name}
                            onChange={(event) => form.setData('bank_name', event.target.value)}
                            className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm focus:border-sky-400 focus:outline-none"
                        />
                    </label>
                    <label className="space-y-2">
                        <span className="text-sm font-semibold text-slate-700">Nomor Rekening</span>
                        <input
                            value={form.data.bank_account_number}
                            onChange={(event) => form.setData('bank_account_number', event.target.value)}
                            className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm focus:border-sky-400 focus:outline-none"
                        />
                    </label>
                    <label className="space-y-2 md:col-span-2">
                        <span className="text-sm font-semibold text-slate-700">Nama Pemilik Rekening</span>
                        <input
                            value={form.data.bank_account_name}
                            onChange={(event) => form.setData('bank_account_name', event.target.value)}
                            className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm focus:border-sky-400 focus:outline-none"
                        />
                    </label>

                    <div className="md:col-span-2">
                        <button
                            type="submit"
                            disabled={form.processing}
                            className="h-11 rounded-xl bg-sky-600 px-6 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:opacity-60"
                        >
                            Simpan Perubahan
                        </button>
                    </div>
                </form>
            </div>
        </>
    );
}

AffiliateProfile.layout = (page: ReactNode) => <AffiliateLayout active="profile">{page}</AffiliateLayout>;
