import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import Swal from 'sweetalert2';
import { BulkDeleteTable, BulkDeleteRow, BulkDeleteSelectAll } from '@/components/admin/bulk-delete-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Keuangan & Monetisasi', href: '/admin/finance/commissions' },
    { title: 'Komisi Platform', href: '/admin/finance/commissions' },
];

type CommissionRule = {
    id: number;
    hotel_id?: number | null;
    hotel_name?: string | null;
    type: 'percentage' | 'fixed';
    value: number;
    starts_at?: string | null;
    ends_at?: string | null;
    is_forever: boolean;
    is_active: boolean;
    created_by_name?: string | null;
    updated_by_name?: string | null;
};

type Props = {
    rules: CommissionRule[];
    hotelOptions: Array<{ id: number; label: string }>;
    typeOptions: Array<'percentage' | 'fixed'>;
};

export default function CommissionIndex({
    rules,
    hotelOptions,
    typeOptions,
}: Props) {
    const [isForever, setIsForever] = useState(true);

    const handleDelete = async (ruleId: number) => {
        const result = await Swal.fire({
            title: 'Hapus aturan komisi?',
            text: 'Aturan akan dihapus permanen.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Hapus',
            cancelButtonText: 'Batal',
        });
        if (!result.isConfirmed) return;

        router.delete(`/admin/finance/commissions/${ruleId}`, {
            onSuccess: () =>
                Swal.fire({
                    title: 'Berhasil',
                    text: 'Aturan dihapus.',
                    icon: 'success',
                }),
            onError: () =>
                Swal.fire({
                    title: 'Gagal',
                    text: 'Gagal menghapus aturan.',
                    icon: 'error',
                }),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Komisi Platform" />
            <div className="flex flex-1 flex-col gap-6 bg-[#f6fbff] px-6 py-8 text-slate-900">
                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <div className="space-y-2">
                        <p className="text-xs font-semibold text-sky-600 uppercase">
                            Komisi Platform
                        </p>
                        <h1 className="text-2xl font-semibold text-slate-900">
                            Atur komisi global & per hotel
                        </h1>
                        <p className="text-sm text-slate-500">
                            Komisi per hotel akan meng-override komisi global
                            selama periode berlaku.
                        </p>
                    </div>
                </section>

                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <form
                        onSubmit={(event) => {
                            event.preventDefault();
                            const form = new FormData(event.currentTarget);
                            if (
                                !isForever &&
                                (!form.get('starts_at') || !form.get('ends_at'))
                            ) {
                                Swal.fire({
                                    title: 'Tanggal berlaku wajib diisi',
                                    text: 'Isi tanggal mulai dan sampai, atau centang berlaku selamanya.',
                                    icon: 'warning',
                                });
                                return;
                            }
                            if (
                                !isForever &&
                                String(form.get('ends_at')) <
                                    String(form.get('starts_at'))
                            ) {
                                Swal.fire({
                                    title: 'Tanggal tidak valid',
                                    text: 'Tanggal berakhir harus sama atau setelah tanggal mulai.',
                                    icon: 'warning',
                                });
                                return;
                            }
                            router.post(
                                '/admin/finance/commissions',
                                Object.fromEntries(form.entries()),
                                {
                                    onSuccess: () =>
                                        Swal.fire({
                                            title: 'Berhasil',
                                            text: 'Komisi disimpan.',
                                            icon: 'success',
                                        }),
                                    onError: () =>
                                        Swal.fire({
                                            title: 'Gagal',
                                            text: 'Komisi gagal disimpan.',
                                            icon: 'error',
                                        }),
                                },
                            );
                        }}
                        className="grid gap-5 lg:grid-cols-12"
                    >
                        <div className="grid gap-2 lg:col-span-4">
                            <label className="text-xs font-semibold text-slate-400 uppercase">
                                Hotel (opsional)
                            </label>
                            <select
                                name="hotel_id"
                                className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs"
                            >
                                <option value="">Komisi global</option>
                                {hotelOptions.map((hotel) => (
                                    <option key={hotel.id} value={hotel.id}>
                                        {hotel.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="grid gap-2 lg:col-span-3">
                            <label className="text-xs font-semibold text-slate-400 uppercase">
                                Tipe
                            </label>
                            <select
                                name="type"
                                className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs"
                            >
                                {typeOptions.map((type) => (
                                    <option key={type} value={type}>
                                        {type === 'percentage'
                                            ? 'Persentase'
                                            : 'Fixed'}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="grid gap-2 lg:col-span-3">
                            <label className="text-xs font-semibold text-slate-400 uppercase">
                                Nilai
                            </label>
                            <input
                                name="value"
                                type="number"
                                min="0"
                                className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs"
                                placeholder="Contoh 10 atau 25000"
                                required
                            />
                        </div>
                        <label className="flex min-h-9 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-700 lg:col-span-2 lg:mt-6">
                            <input
                                type="checkbox"
                                name="is_forever"
                                value="1"
                                checked={isForever}
                                onChange={(event) =>
                                    setIsForever(event.target.checked)
                                }
                                className="h-4 w-4 rounded border-slate-300"
                            />
                            Berlaku selamanya
                        </label>
                        <div className="grid gap-2 lg:col-span-3">
                            <label className="text-xs font-semibold text-slate-400 uppercase">
                                Mulai
                            </label>
                            <input
                                name="starts_at"
                                type="date"
                                disabled={isForever}
                                required={!isForever}
                                className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs disabled:bg-slate-100"
                            />
                        </div>
                        <div className="grid gap-2 lg:col-span-3">
                            <label className="text-xs font-semibold text-slate-400 uppercase">
                                Sampai
                            </label>
                            <input
                                name="ends_at"
                                type="date"
                                disabled={isForever}
                                required={!isForever}
                                className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs disabled:bg-slate-100"
                            />
                        </div>
                        <div className="flex items-end gap-3 lg:col-span-6">
                            <Button
                                type="submit"
                                className="bg-sky-600 text-white hover:bg-sky-700"
                            >
                                Simpan
                            </Button>
                        </div>
                    </form>
                </section>

                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <div className="overflow-x-auto">
                        <BulkDeleteTable className="min-w-full text-left text-sm">
                            <thead className="text-xs text-slate-400 uppercase">
                                <tr>
                                    <BulkDeleteSelectAll />
                                    <th className="py-3 pr-4">Scope</th>
                                    <th className="py-3 pr-4">Tipe</th>
                                    <th className="py-3 pr-4">Nilai</th>
                                    <th className="py-3 pr-4">Periode</th>
                                    <th className="py-3 pr-4">Dibuat oleh</th>
                                    <th className="py-3 pr-4">Diubah oleh</th>
                                    <th className="py-3 pr-4">Status</th>
                                    <th className="py-3 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {rules.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={9}
                                            className="py-8 text-center text-slate-500"
                                        >
                                            Belum ada aturan komisi.
                                        </td>
                                    </tr>
                                )}
                                {rules.map((rule) => (
                                    <BulkDeleteRow deleteUrl={`/admin/finance/commissions/${rule.id}`} key={rule.id}>
                                        <td className="py-4 pr-4">
                                            <div className="font-semibold text-slate-900">
                                                {rule.hotel_name ?? 'Global'}
                                            </div>
                                            <div className="text-xs text-slate-500">
                                                {rule.hotel_name
                                                    ? 'Per hotel'
                                                    : 'Global'}
                                            </div>
                                        </td>
                                        <td className="py-4 pr-4 text-slate-600">
                                            {rule.type === 'percentage'
                                                ? 'Persentase'
                                                : 'Fixed'}
                                        </td>
                                        <td className="py-4 pr-4 text-slate-600">
                                            {rule.type === 'percentage'
                                                ? `${rule.value}%`
                                                : `Rp ${rule.value.toLocaleString('id-ID')}`}
                                        </td>
                                        <td className="py-4 pr-4 text-slate-600">
                                            {rule.is_forever
                                                ? 'Berlaku selamanya'
                                                : `${rule.starts_at ?? '-'} → ${rule.ends_at ?? '-'}`}
                                        </td>
                                        <td className="py-4 pr-4 text-slate-600">
                                            {rule.created_by_name ?? '-'}
                                        </td>
                                        <td className="py-4 pr-4 text-slate-600">
                                            {rule.updated_by_name ?? '-'}
                                        </td>
                                        <td className="py-4 pr-4">
                                            <Badge
                                                className={
                                                    rule.is_active
                                                        ? 'bg-emerald-50 text-emerald-700'
                                                        : 'bg-slate-100 text-slate-600'
                                                }
                                            >
                                                {rule.is_active
                                                    ? 'Aktif'
                                                    : 'Nonaktif'}
                                            </Badge>
                                        </td>
                                        <td className="py-4 text-right">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="border-red-200 text-red-600 hover:bg-red-50"
                                                onClick={() =>
                                                    handleDelete(rule.id)
                                                }
                                            >
                                                Hapus
                                            </Button>
                                        </td>
                                    </BulkDeleteRow>
                                ))}
                            </tbody>
                        </BulkDeleteTable>
                    </div>
                </section>
            </div>
        </AppLayout>
    );
}
