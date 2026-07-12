import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import Swal from 'sweetalert2';
import { FormField } from '@/components/form-field';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

type Affiliate = { id: number; name: string; status: string };

type Props = {
    affiliates: Affiliate[];
};

export default function WisataAffiliateExceptions({ affiliates }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Wisata', href: '/admin/wisata/destinations' },
        { title: 'Afiliasi Wisata', href: '/admin/wisata/affiliates' },
        { title: 'Dispute & Penalti', href: '/admin/wisata/affiliates/exceptions' },
    ];

    const [open, setOpen] = useState(false);
    const [form, setForm] = useState({
        affiliate_id: '',
        action: 'suspend',
        reason: '',
    });

    const submit = (event: React.FormEvent) => {
        event.preventDefault();
        router.post('/admin/wisata/affiliates/exceptions', {
            ...form,
            affiliate_id: Number(form.affiliate_id),
        }, {
            onSuccess: () => {
                Swal.fire({ icon: 'success', title: 'Aksi tersimpan', timer: 1000, showConfirmButton: false });
                setOpen(false);
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dispute & Penalti Afiliasi" />
            <div className="space-y-6 px-4 md:px-8">
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-semibold text-slate-900">Penalti / Suspend</h2>
                            <p className="text-sm text-slate-500">Catat tindakan dan alasan.</p>
                        </div>
                        <Dialog open={open} onOpenChange={setOpen}>
                            <DialogTrigger asChild>
                                <button className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white">Tambah Aksi</button>
                            </DialogTrigger>
                            <DialogContent className="max-h-[90vh] w-[95vw] max-w-3xl overflow-y-auto">
                                <DialogHeader>
                                    <DialogTitle>Tambah Penalti</DialogTitle>
                                </DialogHeader>
                                <form onSubmit={submit} className="mt-4 grid gap-4 md:grid-cols-3">
                                    <FormField label="Afiliasi">
                                        <select className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" value={form.affiliate_id} onChange={(e) => setForm({ ...form, affiliate_id: e.target.value })} required>
                                            <option value="">Pilih Afiliasi</option>
                                            {affiliates.map((item) => (
                                                <option key={item.id} value={item.id}>{item.name}</option>
                                            ))}
                                        </select>
                                    </FormField>
                                    <FormField label="Tindakan">
                                        <select className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" value={form.action} onChange={(e) => setForm({ ...form, action: e.target.value })}>
                                            <option value="suspend">Suspend</option>
                                            <option value="terminate">Blacklist</option>
                                            <option value="hold_payout">Hold Payout</option>
                                            <option value="release_payout">Release Payout</option>
                                        </select>
                                    </FormField>
                                    <FormField label="Alasan">
                                        <input className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} required />
                                    </FormField>
                                    <button className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white md:col-span-3">Simpan Aksi</button>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-slate-900">Status Afiliasi</h3>
                    <div className="mt-4 grid gap-3 md:grid-cols-3">
                        {affiliates.map((item) => (
                            <div key={item.id} className="rounded-xl border border-slate-100 p-4 text-sm">
                                <div className="font-semibold text-slate-900">{item.name}</div>
                                <div className="text-xs text-slate-500">Status: {item.status}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
