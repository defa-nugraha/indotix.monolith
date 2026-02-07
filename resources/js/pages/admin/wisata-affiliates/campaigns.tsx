import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import Swal from 'sweetalert2';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

type Campaign = {
    id: number;
    name: string;
    description?: string | null;
    start_date?: string | null;
    end_date?: string | null;
    status: string;
    bonus_type?: string | null;
    bonus_value?: number | null;
    leaderboard_enabled?: boolean;
};

type Props = {
    campaigns: Campaign[];
};

export default function WisataAffiliateCampaigns({ campaigns }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Wisata', href: '/admin/wisata/destinations' },
        { title: 'Afiliasi Wisata', href: '/admin/wisata/affiliates' },
        { title: 'Campaign Afiliasi', href: '/admin/wisata/affiliates/campaigns' },
    ];

    const [form, setForm] = useState({
        name: '',
        description: '',
        start_date: '',
        end_date: '',
        status: 'draft',
        bonus_type: 'percentage',
        bonus_value: '',
        leaderboard_enabled: false,
    });

    const submit = (event: React.FormEvent) => {
        event.preventDefault();
        router.post('/admin/wisata/affiliates/campaigns', {
            ...form,
            bonus_value: form.bonus_value ? Number(form.bonus_value) : null,
        }, {
            onSuccess: () => Swal.fire({ icon: 'success', title: 'Campaign dibuat', timer: 1000, showConfirmButton: false }),
        });
    };

    const updateStatus = (id: number, status: string) => {
        router.post(`/admin/wisata/affiliates/campaigns/${id}/status`, { status }, {
            preserveScroll: true,
            onSuccess: () => Swal.fire({ icon: 'success', title: 'Status diperbarui', timer: 900, showConfirmButton: false }),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Campaign Afiliasi" />
            <div className="space-y-6">
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h2 className="text-lg font-semibold text-slate-900">Buat Campaign</h2>
                    <form onSubmit={submit} className="mt-4 grid gap-4 md:grid-cols-3">
                        <input className="h-10 rounded-lg border border-slate-200 px-3 text-sm" placeholder="Nama campaign" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                        <input type="date" className="h-10 rounded-lg border border-slate-200 px-3 text-sm" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
                        <input type="date" className="h-10 rounded-lg border border-slate-200 px-3 text-sm" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
                        <select className="h-10 rounded-lg border border-slate-200 px-3 text-sm" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                            <option value="draft">draft</option>
                            <option value="active">active</option>
                            <option value="paused">paused</option>
                            <option value="ended">ended</option>
                        </select>
                        <select className="h-10 rounded-lg border border-slate-200 px-3 text-sm" value={form.bonus_type} onChange={(e) => setForm({ ...form, bonus_type: e.target.value })}>
                            <option value="percentage">Persentase</option>
                            <option value="nominal">Nominal</option>
                        </select>
                        <input className="h-10 rounded-lg border border-slate-200 px-3 text-sm" placeholder="Bonus" value={form.bonus_value} onChange={(e) => setForm({ ...form, bonus_value: e.target.value })} />
                        <textarea className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm md:col-span-3" placeholder="Deskripsi" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                        <label className="flex items-center gap-2 text-sm text-slate-600 md:col-span-3">
                            <input type="checkbox" checked={form.leaderboard_enabled} onChange={(e) => setForm({ ...form, leaderboard_enabled: e.target.checked })} />
                            Aktifkan leaderboard
                        </label>
                        <button className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white md:col-span-3">Simpan Campaign</button>
                    </form>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-slate-900">Daftar Campaign</h3>
                    <div className="mt-4 overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="text-left text-xs uppercase text-slate-500">
                                <tr>
                                    <th className="py-2">Nama</th>
                                    <th>Periode</th>
                                    <th>Status</th>
                                    <th>Bonus</th>
                                    <th>Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {campaigns.map((item) => (
                                    <tr key={item.id}>
                                        <td className="py-3">{item.name}</td>
                                        <td>{item.start_date ?? '-'} - {item.end_date ?? '-'}</td>
                                        <td>{item.status}</td>
                                        <td>{item.bonus_type ?? '-'} {item.bonus_value ?? ''}</td>
                                        <td>
                                            <select className="h-8 rounded-md border border-slate-200 px-2 text-xs" value={item.status} onChange={(e) => updateStatus(item.id, e.target.value)}>
                                                <option value="draft">draft</option>
                                                <option value="active">active</option>
                                                <option value="paused">paused</option>
                                                <option value="ended">ended</option>
                                            </select>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {campaigns.length === 0 && <div className="py-6 text-center text-sm text-slate-500">Belum ada campaign.</div>}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
