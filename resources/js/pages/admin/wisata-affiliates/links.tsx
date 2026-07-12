import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import Swal from 'sweetalert2';
import { FormField } from '@/components/form-field';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

type Affiliate = { id: number; name: string };

type LinkItem = {
    id: number;
    code: string;
    token: string;
    status: string;
    landing_url?: string | null;
    attribution_model: string;
    cookie_days: number;
    affiliate?: Affiliate;
};

type Props = {
    links: LinkItem[];
    affiliates: Affiliate[];
};

export default function WisataAffiliateLinks({ links, affiliates }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Wisata', href: '/admin/wisata/destinations' },
        { title: 'Afiliasi Wisata', href: '/admin/wisata/affiliates' },
        { title: 'Referral Link', href: '/admin/wisata/affiliates/links' },
    ];

    const [open, setOpen] = useState(false);
    const [form, setForm] = useState({
        affiliate_id: '',
        landing_url: '',
        attribution_model: 'last_click',
        cookie_days: '7',
    });

    const submit = (event: React.FormEvent) => {
        event.preventDefault();
        router.post('/admin/wisata/affiliates/links', {
            ...form,
            affiliate_id: Number(form.affiliate_id),
            cookie_days: Number(form.cookie_days),
        }, {
            onSuccess: () => {
                Swal.fire({ icon: 'success', title: 'Link dibuat', timer: 1000, showConfirmButton: false });
                setOpen(false);
            },
        });
    };

    const updateStatus = (id: number, status: string) => {
        router.post(`/admin/wisata/affiliates/links/${id}/status`, { status }, {
            preserveScroll: true,
            onSuccess: () => Swal.fire({ icon: 'success', title: 'Status diperbarui', timer: 900, showConfirmButton: false }),
        });
    };

    const regenerate = (id: number) => {
        router.post(`/admin/wisata/affiliates/links/${id}/regenerate`, {}, {
            preserveScroll: true,
            onSuccess: () => Swal.fire({ icon: 'success', title: 'Token diperbarui', timer: 900, showConfirmButton: false }),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Referral Link Afiliasi" />
            <div className="space-y-6 px-4 md:px-8">
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-semibold text-slate-900">Generate Referral Link</h2>
                            <p className="text-sm text-slate-500">Buat link tracking afiliasi.</p>
                        </div>
                        <Dialog open={open} onOpenChange={setOpen}>
                            <DialogTrigger asChild>
                                <button className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white">Tambah Link</button>
                            </DialogTrigger>
                            <DialogContent className="max-h-[90vh] w-[95vw] max-w-3xl overflow-y-auto">
                                <DialogHeader>
                                    <DialogTitle>Buat Referral Link</DialogTitle>
                                </DialogHeader>
                                <form onSubmit={submit} className="mt-4 grid gap-4 md:grid-cols-4">
                                    <FormField label="Afiliasi">
                                        <select className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" value={form.affiliate_id} onChange={(e) => setForm({ ...form, affiliate_id: e.target.value })} required>
                                            <option value="">Pilih Afiliasi</option>
                                            {affiliates.map((item) => (
                                                <option key={item.id} value={item.id}>{item.name}</option>
                                            ))}
                                        </select>
                                    </FormField>
                                    <FormField label="Landing URL">
                                        <input className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" value={form.landing_url} onChange={(e) => setForm({ ...form, landing_url: e.target.value })} />
                                    </FormField>
                                    <FormField label="Model atribusi">
                                        <select className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" value={form.attribution_model} onChange={(e) => setForm({ ...form, attribution_model: e.target.value })}>
                                            <option value="last_click">Last Click</option>
                                            <option value="first_click">First Click</option>
                                        </select>
                                    </FormField>
                                    <FormField label="Durasi cookie">
                                        <input className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" value={form.cookie_days} onChange={(e) => setForm({ ...form, cookie_days: e.target.value })} />
                                    </FormField>
                                    <button className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white md:col-span-4">Buat Link</button>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-slate-900">Daftar Referral Link</h3>
                    <div className="mt-4 overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="text-left text-xs uppercase text-slate-500">
                                <tr>
                                    <th className="py-2">Afiliasi</th>
                                    <th>Kode</th>
                                    <th>Token</th>
                                    <th>Status</th>
                                    <th>Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {links.map((link) => (
                                    <tr key={link.id}>
                                        <td className="py-3">{link.affiliate?.name ?? '-'}</td>
                                        <td>{link.code}</td>
                                        <td className="text-xs">{link.token}</td>
                                        <td>{link.status}</td>
                                        <td className="space-x-2">
                                            <button onClick={() => regenerate(link.id)} className="rounded-md border border-slate-200 px-3 py-1 text-xs">Regenerate</button>
                                            <label className="grid gap-1 text-xs font-medium text-slate-600">
                                                <span>Status</span>
                                                <select
                                                    className="h-8 rounded-md border border-slate-200 px-2 text-xs"
                                                    value={link.status}
                                                    onChange={(e) => updateStatus(link.id, e.target.value)}
                                                >
                                                    <option value="active">active</option>
                                                    <option value="disabled">disabled</option>
                                                </select>
                                            </label>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {links.length === 0 && <div className="py-6 text-center text-sm text-slate-500">Belum ada link.</div>}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
