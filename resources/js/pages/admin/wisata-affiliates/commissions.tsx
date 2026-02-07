import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import Swal from 'sweetalert2';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

type Commission = {
    id: number;
    scope_type: string;
    wisata_id?: number | null;
    campaign_id?: number | null;
    type: string;
    value: number;
    source: string;
    start_date?: string | null;
    end_date?: string | null;
};

type Option = { id: number; name: string };

type Props = {
    commissions: Commission[];
    destinations: Option[];
    campaigns: Option[];
};

export default function WisataAffiliateCommissions({ commissions, destinations, campaigns }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Wisata', href: '/admin/wisata/destinations' },
        { title: 'Afiliasi Wisata', href: '/admin/wisata/affiliates' },
        { title: 'Skema Komisi', href: '/admin/wisata/affiliates/commissions' },
    ];

    const [form, setForm] = useState({
        scope_type: 'global',
        wisata_id: '',
        campaign_id: '',
        type: 'percentage',
        value: '',
        source: 'platform',
        start_date: '',
        end_date: '',
    });

    const submit = (event: React.FormEvent) => {
        event.preventDefault();
        router.post('/admin/wisata/affiliates/commissions', {
            ...form,
            wisata_id: form.wisata_id ? Number(form.wisata_id) : null,
            campaign_id: form.campaign_id ? Number(form.campaign_id) : null,
            value: Number(form.value || 0),
        }, {
            onSuccess: () => Swal.fire({ icon: 'success', title: 'Komisi tersimpan', timer: 1000, showConfirmButton: false }),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Skema Komisi Afiliasi" />
            <div className="space-y-6">
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h2 className="text-lg font-semibold text-slate-900">Atur Skema Komisi</h2>
                    <form onSubmit={submit} className="mt-4 grid gap-4 md:grid-cols-3">
                        <select className="h-10 rounded-lg border border-slate-200 px-3 text-sm" value={form.scope_type} onChange={(e) => setForm({ ...form, scope_type: e.target.value })}>
                            <option value="global">Global</option>
                            <option value="wisata">Per Wisata</option>
                            <option value="campaign">Per Campaign</option>
                        </select>
                        <select className="h-10 rounded-lg border border-slate-200 px-3 text-sm" value={form.wisata_id} onChange={(e) => setForm({ ...form, wisata_id: e.target.value })}>
                            <option value="">Pilih Wisata (opsional)</option>
                            {destinations.map((item) => (
                                <option key={item.id} value={item.id}>{item.name}</option>
                            ))}
                        </select>
                        <select className="h-10 rounded-lg border border-slate-200 px-3 text-sm" value={form.campaign_id} onChange={(e) => setForm({ ...form, campaign_id: e.target.value })}>
                            <option value="">Pilih Campaign (opsional)</option>
                            {campaigns.map((item) => (
                                <option key={item.id} value={item.id}>{item.name}</option>
                            ))}
                        </select>
                        <select className="h-10 rounded-lg border border-slate-200 px-3 text-sm" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                            <option value="percentage">Persentase</option>
                            <option value="nominal">Nominal</option>
                        </select>
                        <input className="h-10 rounded-lg border border-slate-200 px-3 text-sm" placeholder="Nilai" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} />
                        <select className="h-10 rounded-lg border border-slate-200 px-3 text-sm" value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })}>
                            <option value="platform">Platform</option>
                            <option value="subsidi_promo">Subsidi Promo</option>
                        </select>
                        <input type="date" className="h-10 rounded-lg border border-slate-200 px-3 text-sm" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
                        <input type="date" className="h-10 rounded-lg border border-slate-200 px-3 text-sm" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
                        <button className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white md:col-span-3">Simpan Komisi</button>
                    </form>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-slate-900">Daftar Komisi</h3>
                    <div className="mt-4 overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="text-left text-xs uppercase text-slate-500">
                                <tr>
                                    <th className="py-2">Scope</th>
                                    <th>Tipe</th>
                                    <th>Nilai</th>
                                    <th>Sumber</th>
                                    <th>Periode</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {commissions.map((item) => (
                                    <tr key={item.id}>
                                        <td className="py-3 capitalize">{item.scope_type}</td>
                                        <td>{item.type}</td>
                                        <td>{item.value}</td>
                                        <td>{item.source}</td>
                                        <td>{item.start_date ?? '-'} - {item.end_date ?? '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {commissions.length === 0 && <div className="py-6 text-center text-sm text-slate-500">Belum ada komisi.</div>}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
