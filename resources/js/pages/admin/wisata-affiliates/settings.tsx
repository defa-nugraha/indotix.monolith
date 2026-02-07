import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import Swal from 'sweetalert2';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

type Setting = {
    cookie_days: number;
    attribution_model: string;
    min_payout: number;
    payout_cutoff_days: number;
};

type Props = {
    setting?: Setting | null;
};

export default function WisataAffiliateSettings({ setting }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Wisata', href: '/admin/wisata/destinations' },
        { title: 'Afiliasi Wisata', href: '/admin/wisata/affiliates' },
        { title: 'Konfigurasi', href: '/admin/wisata/affiliates/system/settings' },
    ];

    const [form, setForm] = useState({
        cookie_days: setting?.cookie_days ?? 7,
        attribution_model: setting?.attribution_model ?? 'last_click',
        min_payout: setting?.min_payout ?? 0,
        payout_cutoff_days: setting?.payout_cutoff_days ?? 7,
    });

    const submit = (event: React.FormEvent) => {
        event.preventDefault();
        router.post('/admin/wisata/affiliates/system/settings', form, {
            onSuccess: () => Swal.fire({ icon: 'success', title: 'Konfigurasi disimpan', timer: 1000, showConfirmButton: false }),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Konfigurasi Afiliasi" />
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-900">Konfigurasi Sistem Afiliasi</h2>
                <form onSubmit={submit} className="mt-4 grid gap-4 md:grid-cols-2">
                    <input className="h-10 rounded-lg border border-slate-200 px-3 text-sm" type="number" value={form.cookie_days} onChange={(e) => setForm({ ...form, cookie_days: Number(e.target.value) })} />
                    <select className="h-10 rounded-lg border border-slate-200 px-3 text-sm" value={form.attribution_model} onChange={(e) => setForm({ ...form, attribution_model: e.target.value })}>
                        <option value="last_click">Last Click</option>
                        <option value="first_click">First Click</option>
                    </select>
                    <input className="h-10 rounded-lg border border-slate-200 px-3 text-sm" type="number" value={form.min_payout} onChange={(e) => setForm({ ...form, min_payout: Number(e.target.value) })} />
                    <input className="h-10 rounded-lg border border-slate-200 px-3 text-sm" type="number" value={form.payout_cutoff_days} onChange={(e) => setForm({ ...form, payout_cutoff_days: Number(e.target.value) })} />
                    <button className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white md:col-span-2">Simpan</button>
                </form>
            </div>
        </AppLayout>
    );
}
