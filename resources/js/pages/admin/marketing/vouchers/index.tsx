import { Head, router } from '@inertiajs/react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import Swal from 'sweetalert2';
import type { BreadcrumbItem } from '@/types';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Promo & Voucher', href: '/admin/marketing/vouchers' },
    { title: 'Voucher', href: '/admin/marketing/vouchers' },
];

type Voucher = {
    id: number;
    code: string;
    discount_type: 'percentage' | 'fixed';
    discount_value: number;
    quota_total: number;
    quota_used: number;
    starts_at?: string | null;
    ends_at?: string | null;
    hotel_id?: number | null;
    hotel_name?: string | null;
    is_active: boolean;
};

type Props = {
    vouchers: Voucher[];
    hotelOptions: Array<{ id: number; label: string }>;
    typeOptions: Array<'percentage' | 'fixed'>;
};

const isActiveLabel = (voucher: Voucher) => {
    if (!voucher.is_active) return false;
    const today = new Date();
    const start = voucher.starts_at ? new Date(voucher.starts_at) : null;
    const end = voucher.ends_at ? new Date(voucher.ends_at) : null;
    if (start && today < start) return false;
    if (end && today > end) return false;
    return true;
};

export default function VoucherIndex({ vouchers, hotelOptions, typeOptions }: Props) {
    const [editingId, setEditingId] = useState<number | null>(null);
    const [form, setForm] = useState({
        code: '',
        discount_type: 'percentage',
        discount_value: '',
        quota_total: '',
        starts_at: '',
        ends_at: '',
        hotel_id: '',
        is_active: true,
    });

    const startEdit = (voucher: Voucher) => {
        setEditingId(voucher.id);
        setForm({
            code: voucher.code,
            discount_type: voucher.discount_type,
            discount_value: String(voucher.discount_value),
            quota_total: String(voucher.quota_total),
            starts_at: voucher.starts_at ?? '',
            ends_at: voucher.ends_at ?? '',
            hotel_id: voucher.hotel_id ? String(voucher.hotel_id) : '',
            is_active: voucher.is_active,
        });
    };

    const resetForm = () => {
        setEditingId(null);
        setForm({
            code: '',
            discount_type: 'percentage',
            discount_value: '',
            quota_total: '',
            starts_at: '',
            ends_at: '',
            hotel_id: '',
            is_active: true,
        });
    };

    const submit = (event: React.FormEvent) => {
        event.preventDefault();
        const payload = {
            ...form,
            discount_value: Number(form.discount_value),
            quota_total: Number(form.quota_total),
            hotel_id: form.hotel_id || null,
            is_active: form.is_active ? 1 : 0,
        };

        if (editingId) {
            router.put(`/admin/marketing/vouchers/${editingId}`, payload, {
                onSuccess: () => {
                    Swal.fire({ title: 'Berhasil', text: 'Voucher diperbarui.', icon: 'success' });
                    resetForm();
                },
                onError: () => Swal.fire({ title: 'Gagal', text: 'Voucher gagal diperbarui.', icon: 'error' }),
            });
            return;
        }

        router.post('/admin/marketing/vouchers', payload, {
            onSuccess: () => {
                Swal.fire({ title: 'Berhasil', text: 'Voucher dibuat.', icon: 'success' });
                resetForm();
            },
            onError: () => Swal.fire({ title: 'Gagal', text: 'Voucher gagal dibuat.', icon: 'error' }),
        });
    };

    const handleDelete = async (voucherId: number) => {
        const result = await Swal.fire({
            title: 'Hapus voucher?',
            text: 'Voucher akan dihapus permanen.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Hapus',
            cancelButtonText: 'Batal',
        });
        if (!result.isConfirmed) return;

        router.delete(`/admin/marketing/vouchers/${voucherId}`, {
            onSuccess: () => Swal.fire({ title: 'Berhasil', text: 'Voucher dihapus.', icon: 'success' }),
            onError: () => Swal.fire({ title: 'Gagal', text: 'Voucher gagal dihapus.', icon: 'error' }),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Voucher" />
            <div className="flex flex-1 flex-col gap-6 bg-[#f6fbff] px-6 py-8 text-slate-900">
                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <div className="space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-600">
                            Promo & Voucher
                        </p>
                        <h1 className="text-2xl font-semibold text-slate-900">
                            Growth engine untuk promo booking
                        </h1>
                        <p className="text-sm text-slate-500">
                            Atur kode promo, diskon, kuota, dan periode berlaku.
                        </p>
                    </div>
                </section>

                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <form onSubmit={submit} className="grid gap-4 md:grid-cols-6">
                        <div className="grid gap-2 md:col-span-2">
                            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                Kode
                            </label>
                            <input
                                value={form.code}
                                onChange={(event) => setForm((prev) => ({ ...prev, code: event.target.value }))}
                                className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs"
                                placeholder="INDOTIX10"
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                Tipe
                            </label>
                            <select
                                value={form.discount_type}
                                onChange={(event) => setForm((prev) => ({ ...prev, discount_type: event.target.value }))}
                                className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs"
                            >
                                {typeOptions.map((type) => (
                                    <option key={type} value={type}>
                                        {type === 'percentage' ? 'Persentase' : 'Fixed'}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="grid gap-2">
                            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                Diskon
                            </label>
                            <input
                                type="number"
                                min="0"
                                value={form.discount_value}
                                onChange={(event) => setForm((prev) => ({ ...prev, discount_value: event.target.value }))}
                                className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs"
                                placeholder={form.discount_type === 'percentage' ? '10' : '50000'}
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                Kuota
                            </label>
                            <input
                                type="number"
                                min="0"
                                value={form.quota_total}
                                onChange={(event) => setForm((prev) => ({ ...prev, quota_total: event.target.value }))}
                                className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs"
                                placeholder="100"
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                Mulai
                            </label>
                            <input
                                type="date"
                                value={form.starts_at}
                                onChange={(event) => setForm((prev) => ({ ...prev, starts_at: event.target.value }))}
                                className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs"
                            />
                        </div>
                        <div className="grid gap-2">
                            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                Sampai
                            </label>
                            <input
                                type="date"
                                value={form.ends_at}
                                onChange={(event) => setForm((prev) => ({ ...prev, ends_at: event.target.value }))}
                                className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs"
                            />
                        </div>
                        <div className="grid gap-2 md:col-span-2">
                            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                Hotel (opsional)
                            </label>
                            <select
                                value={form.hotel_id}
                                onChange={(event) => setForm((prev) => ({ ...prev, hotel_id: event.target.value }))}
                                className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs"
                            >
                                <option value="">Global</option>
                                {hotelOptions.map((hotel) => (
                                    <option key={hotel.id} value={hotel.id}>
                                        {hotel.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="flex items-end gap-3 md:col-span-2">
                            <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500">
                                <input
                                    type="checkbox"
                                    checked={form.is_active}
                                    onChange={(event) => setForm((prev) => ({ ...prev, is_active: event.target.checked }))}
                                />
                                Aktif
                            </label>
                            <Button type="submit" className="bg-sky-600 text-white hover:bg-sky-700">
                                {editingId ? 'Simpan perubahan' : 'Buat voucher'}
                            </Button>
                            {editingId && (
                                <Button type="button" variant="outline" onClick={resetForm}>
                                    Batal edit
                                </Button>
                            )}
                        </div>
                    </form>
                </section>

                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-left text-sm">
                            <thead className="text-xs uppercase tracking-wider text-slate-400">
                                <tr>
                                    <th className="py-3 pr-4">Kode</th>
                                    <th className="py-3 pr-4">Diskon</th>
                                    <th className="py-3 pr-4">Kuota</th>
                                    <th className="py-3 pr-4">Periode</th>
                                    <th className="py-3 pr-4">Scope</th>
                                    <th className="py-3 pr-4">Status</th>
                                    <th className="py-3 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {vouchers.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="py-8 text-center text-slate-500">
                                            Belum ada voucher.
                                        </td>
                                    </tr>
                                )}
                                {vouchers.map((voucher) => (
                                    <tr key={voucher.id}>
                                        <td className="py-4 pr-4">
                                            <div className="font-semibold text-slate-900">{voucher.code}</div>
                                        </td>
                                        <td className="py-4 pr-4 text-slate-600">
                                            {voucher.discount_type === 'percentage'
                                                ? `${voucher.discount_value}%`
                                                : `Rp ${voucher.discount_value.toLocaleString('id-ID')}`}
                                        </td>
                                        <td className="py-4 pr-4 text-slate-600">
                                            {voucher.quota_used}/{voucher.quota_total}
                                        </td>
                                        <td className="py-4 pr-4 text-slate-600">
                                            {voucher.starts_at ?? '-'} → {voucher.ends_at ?? '-'}
                                        </td>
                                        <td className="py-4 pr-4 text-slate-600">
                                            {voucher.hotel_name ?? 'Global'}
                                        </td>
                                        <td className="py-4 pr-4">
                                            <Badge className={isActiveLabel(voucher) ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}>
                                                {isActiveLabel(voucher) ? 'Aktif' : 'Nonaktif'}
                                            </Badge>
                                        </td>
                                        <td className="py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button variant="outline" size="sm" onClick={() => startEdit(voucher)}>
                                                    Edit
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="border-red-200 text-red-600 hover:bg-red-50"
                                                    onClick={() => handleDelete(voucher.id)}
                                                >
                                                    Hapus
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
        </AppLayout>
    );
}
