import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import Swal from 'sweetalert2';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

type Affiliate = { id: number; name: string };

type Payout = {
    id: number;
    affiliate?: Affiliate;
    period_start?: string | null;
    period_end?: string | null;
    total_commission: number;
    status: string;
    bank_name?: string | null;
};

type Props = {
    payouts: Payout[];
    affiliates: Affiliate[];
};

export default function WisataAffiliatePayouts({ payouts, affiliates }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Wisata', href: '/admin/wisata/destinations' },
        { title: 'Afiliasi Wisata', href: '/admin/wisata/affiliates' },
        { title: 'Payout Afiliasi', href: '/admin/wisata/affiliates/payouts' },
    ];

    const [form, setForm] = useState({
        affiliate_id: '',
        period_start: '',
        period_end: '',
        total_commission: '',
        status: 'pending',
        bank_name: '',
        bank_account_number: '',
        bank_account_name: '',
        notes: '',
    });

    const submit = (event: React.FormEvent) => {
        event.preventDefault();
        router.post('/admin/wisata/affiliates/payouts', {
            ...form,
            affiliate_id: Number(form.affiliate_id),
            total_commission: Number(form.total_commission || 0),
        }, {
            onSuccess: () => Swal.fire({ icon: 'success', title: 'Payout dibuat', timer: 1000, showConfirmButton: false }),
        });
    };

    const updateStatus = (id: number, status: string) => {
        router.post(`/admin/wisata/affiliates/payouts/${id}/status`, { status }, {
            preserveScroll: true,
            onSuccess: () => Swal.fire({ icon: 'success', title: 'Status payout diperbarui', timer: 1000, showConfirmButton: false }),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Payout Afiliasi" />
            <div className="space-y-6">
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h2 className="text-lg font-semibold text-slate-900">Generate Payout</h2>
                    <form onSubmit={submit} className="mt-4 grid gap-4 md:grid-cols-3">
                        <select className="h-10 rounded-lg border border-slate-200 px-3 text-sm" value={form.affiliate_id} onChange={(e) => setForm({ ...form, affiliate_id: e.target.value })} required>
                            <option value="">Pilih Afiliasi</option>
                            {affiliates.map((item) => (
                                <option key={item.id} value={item.id}>{item.name}</option>
                            ))}
                        </select>
                        <input type="date" className="h-10 rounded-lg border border-slate-200 px-3 text-sm" value={form.period_start} onChange={(e) => setForm({ ...form, period_start: e.target.value })} />
                        <input type="date" className="h-10 rounded-lg border border-slate-200 px-3 text-sm" value={form.period_end} onChange={(e) => setForm({ ...form, period_end: e.target.value })} />
                        <input className="h-10 rounded-lg border border-slate-200 px-3 text-sm" placeholder="Total komisi" value={form.total_commission} onChange={(e) => setForm({ ...form, total_commission: e.target.value })} />
                        <select className="h-10 rounded-lg border border-slate-200 px-3 text-sm" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                            <option value="pending">pending</option>
                            <option value="approved">approved</option>
                            <option value="rejected">rejected</option>
                            <option value="paid">paid</option>
                        </select>
                        <input className="h-10 rounded-lg border border-slate-200 px-3 text-sm" placeholder="Bank" value={form.bank_name} onChange={(e) => setForm({ ...form, bank_name: e.target.value })} />
                        <input className="h-10 rounded-lg border border-slate-200 px-3 text-sm" placeholder="Nomor rekening" value={form.bank_account_number} onChange={(e) => setForm({ ...form, bank_account_number: e.target.value })} />
                        <input className="h-10 rounded-lg border border-slate-200 px-3 text-sm" placeholder="Nama pemilik" value={form.bank_account_name} onChange={(e) => setForm({ ...form, bank_account_name: e.target.value })} />
                        <textarea className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm md:col-span-3" placeholder="Catatan" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                        <button className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white md:col-span-3">Simpan Payout</button>
                    </form>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-slate-900">Daftar Payout</h3>
                    <div className="mt-4 overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="text-left text-xs uppercase text-slate-500">
                                <tr>
                                    <th className="py-2">Afiliasi</th>
                                    <th>Periode</th>
                                    <th>Total</th>
                                    <th>Status</th>
                                    <th>Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {payouts.map((item) => (
                                    <tr key={item.id}>
                                        <td className="py-3">{item.affiliate?.name ?? '-'}</td>
                                        <td>{item.period_start ?? '-'} - {item.period_end ?? '-'}</td>
                                        <td>Rp {item.total_commission.toLocaleString('id-ID')}</td>
                                        <td>{item.status}</td>
                                        <td>
                                            <select
                                                className="h-8 rounded-md border border-slate-200 px-2 text-xs"
                                                value={item.status}
                                                onChange={(e) => updateStatus(item.id, e.target.value)}
                                            >
                                                <option value="pending">pending</option>
                                                <option value="approved">approved</option>
                                                <option value="rejected">rejected</option>
                                                <option value="paid">paid</option>
                                            </select>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {payouts.length === 0 && <div className="py-6 text-center text-sm text-slate-500">Belum ada payout.</div>}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
