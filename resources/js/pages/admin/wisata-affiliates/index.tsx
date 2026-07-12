import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import Swal from 'sweetalert2';
import { FormField } from '@/components/form-field';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

type Affiliate = {
    id: number;
    wisata_id?: number | null;
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
};

type Props = {
    affiliates: {
        data: Affiliate[];
        links: Array<{ url: string | null; label: string; active: boolean }>;
    };
    users: Array<{ id: number; name: string; email: string }>;
    destinations: Array<{ id: number; destination_name: string }>;
    filters: {
        status?: string;
        q?: string;
    };
};

const statusOptions = ['draft', 'pending_review', 'active', 'suspended', 'terminated'];

export default function WisataAffiliateIndex({ affiliates, users, destinations, filters }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Wisata', href: '/admin/wisata/destinations' },
        { title: 'Afiliasi Wisata', href: '/admin/wisata/affiliates' },
    ];

    const [open, setOpen] = useState(false);
    const [form, setForm] = useState({
        user_id: '',
        wisata_id: '',
        phone: '',
        type: 'individu',
        platform: '',
        status: 'pending_review',
        notes: '',
        bank_name: '',
        bank_account_number: '',
        bank_account_name: '',
    });

    const selectedUser = users.find((item) => String(item.id) === form.user_id);

    const submit = (event: React.FormEvent) => {
        event.preventDefault();
        router.post('/admin/wisata/affiliates', form, {
            onSuccess: () => {
                Swal.fire({ icon: 'success', title: 'Tersimpan', timer: 1200, showConfirmButton: false });
                setForm({
                    user_id: '',
                    wisata_id: '',
                    phone: '',
                    type: 'individu',
                    platform: '',
                    status: 'pending_review',
                    notes: '',
                    bank_name: '',
                    bank_account_number: '',
                    bank_account_name: '',
                });
                setOpen(false);
            },
            onError: () => {
                Swal.fire({ icon: 'error', title: 'Gagal menyimpan' });
            },
        });
    };

    const updateStatus = (id: number, status: string) => {
        router.post(`/admin/wisata/affiliates/${id}/status`, { status }, {
            preserveScroll: true,
            onSuccess: () => Swal.fire({ icon: 'success', title: 'Status diperbarui', timer: 1000, showConfirmButton: false }),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Afiliasi Wisata" />
            <div className="space-y-6 px-4 md:px-8">
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-semibold text-slate-900">Registrasi Afiliasi</h2>
                            <p className="text-sm text-slate-500">Masukkan data afiliasi baru untuk diverifikasi.</p>
                        </div>
                        <Dialog open={open} onOpenChange={setOpen}>
                            <DialogTrigger asChild>
                                <button className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white">Tambah Afiliasi</button>
                            </DialogTrigger>
                            <DialogContent className="max-h-[90vh] w-[95vw] max-w-3xl overflow-y-auto">
                                <DialogHeader>
                                    <DialogTitle>Tambah Afiliasi Wisata</DialogTitle>
                                </DialogHeader>
                                <form onSubmit={submit} className="mt-4 grid gap-4 md:grid-cols-2">
                                    <FormField label="User">
                                        <select className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" value={form.user_id} onChange={(e) => setForm({ ...form, user_id: e.target.value })} required>
                                            <option value="">Pilih user</option>
                                            {users.map((item) => (
                                                <option key={item.id} value={item.id}>{item.name} ({item.email})</option>
                                            ))}
                                        </select>
                                    </FormField>
                                    <FormField label="Wisata">
                                        <select className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" value={form.wisata_id} onChange={(e) => setForm({ ...form, wisata_id: e.target.value })} required>
                                            <option value="">Pilih wisata</option>
                                            {destinations.map((item) => (
                                                <option key={item.id} value={item.id}>{item.destination_name}</option>
                                            ))}
                                        </select>
                                    </FormField>
                                    <FormField label="Nama lengkap">
                                        <input className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" value={selectedUser?.name ?? ''} readOnly />
                                    </FormField>
                                    <FormField label="Email">
                                        <input className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" value={selectedUser?.email ?? ''} readOnly />
                                    </FormField>
                                    <FormField label="Nomor HP">
                                        <input className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                                    </FormField>
                                    <FormField label="Tipe afiliasi">
                                        <select className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                                            <option value="individu">Individu</option>
                                            <option value="komunitas">Komunitas</option>
                                            <option value="media">Media</option>
                                        </select>
                                    </FormField>
                                    <FormField label="Platform promosi">
                                        <input className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" value={form.platform} onChange={(e) => setForm({ ...form, platform: e.target.value })} />
                                    </FormField>
                                    <FormField label="Status">
                                        <select className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                                            {statusOptions.map((option) => (
                                                <option key={option} value={option}>{option}</option>
                                            ))}
                                        </select>
                                    </FormField>
                                    <FormField label="Nama bank">
                                        <input className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" value={form.bank_name} onChange={(e) => setForm({ ...form, bank_name: e.target.value })} />
                                    </FormField>
                                    <FormField label="Nomor rekening">
                                        <input className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" value={form.bank_account_number} onChange={(e) => setForm({ ...form, bank_account_number: e.target.value })} />
                                    </FormField>
                                    <FormField label="Nama pemilik rekening">
                                        <input className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" value={form.bank_account_name} onChange={(e) => setForm({ ...form, bank_account_name: e.target.value })} />
                                    </FormField>
                                    <FormField label="Catatan internal" className="md:col-span-2">
                                        <textarea className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                                    </FormField>
                                    <button className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white md:col-span-2">Simpan</button>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                            <h3 className="text-lg font-semibold text-slate-900">Daftar Afiliasi</h3>
                            <p className="text-sm text-slate-500">Review, aktifkan, atau suspend afiliasi.</p>
                        </div>
                        <div className="flex gap-2">
                            <label className="grid gap-1 text-xs font-medium text-slate-600">
                                <span>Pencarian afiliasi</span>
                                <input
                                    className="h-10 rounded-lg border border-slate-200 px-3 text-sm"
                                    placeholder="Cari..."
                                    defaultValue={filters.q}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            router.get('/admin/wisata/affiliates', { q: (e.target as HTMLInputElement).value, status: filters.status }, { preserveState: true });
                                        }
                                    }}
                                />
                            </label>
                            <label className="grid gap-1 text-xs font-medium text-slate-600">
                                <span>Status</span>
                                <select
                                    className="h-10 rounded-lg border border-slate-200 px-3 text-sm"
                                    defaultValue={filters.status ?? ''}
                                    onChange={(e) => router.get('/admin/wisata/affiliates', { status: e.target.value, q: filters.q }, { preserveState: true })}
                                >
                                    <option value="">Semua Status</option>
                                    {statusOptions.map((option) => (
                                        <option key={option} value={option}>{option}</option>
                                    ))}
                                </select>
                            </label>
                        </div>
                    </div>
                    <div className="mt-4 overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="text-left text-xs uppercase text-slate-500">
                                <tr>
                                    <th className="py-2">Nama</th>
                                    <th>Email</th>
                                    <th>HP</th>
                                    <th>Tipe</th>
                                    <th>Status</th>
                                    <th>Platform</th>
                                    <th>Wisata</th>
                                    <th>Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {affiliates.data.map((item) => (
                                    <tr key={item.id} className="text-slate-700">
                                        <td className="py-3">
                                            <Link href={`/admin/wisata/affiliates/${item.id}`} className="font-semibold text-sky-600 hover:underline">
                                                {item.name}
                                            </Link>
                                        </td>
                                        <td>{item.email ?? '-'}</td>
                                        <td>{item.phone ?? '-'}</td>
                                        <td className="capitalize">{item.type}</td>
                                        <td>{item.status}</td>
                                        <td>{item.platform ?? '-'}</td>
                                        <td>{destinations.find((d) => d.id === (item as any).wisata_id)?.destination_name ?? '-'}</td>
                                        <td>
                                            <label className="grid gap-1 text-xs font-medium text-slate-600">
                                                <span>Status</span>
                                                <select
                                                    className="h-9 rounded-lg border border-slate-200 px-2 text-xs"
                                                    value={item.status}
                                                    onChange={(e) => updateStatus(item.id, e.target.value)}
                                                >
                                                    {statusOptions.map((option) => (
                                                        <option key={option} value={option}>{option}</option>
                                                    ))}
                                                </select>
                                            </label>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {affiliates.data.length === 0 && (
                            <div className="py-6 text-center text-sm text-slate-500">Belum ada afiliasi.</div>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
