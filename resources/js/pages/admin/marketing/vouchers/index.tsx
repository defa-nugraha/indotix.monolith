import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import Swal from 'sweetalert2';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { formatCurrencyInput, parseCurrencyToDigits } from '@/lib/currency';

const defaultBreadcrumbs: BreadcrumbItem[] = [
    { title: 'Promo & Voucher', href: '/admin/marketing/vouchers' },
    { title: 'Voucher', href: '/admin/marketing/vouchers' },
];

type Voucher = {
    id: number;
    code: string;
    discount_type: 'percentage' | 'fixed';
    discount_value: number;
    min_transaction?: number | null;
    quota_total: number;
    quota_used: number;
    remaining_quota?: number | null;
    max_per_user_per_day?: number | null;
    starts_at?: string | null;
    ends_at?: string | null;
    hotel_id?: number | null;
    hotel_name?: string | null;
    wisata_destination_ids?: number[];
    wisata_destination_names?: string[];
    is_active: boolean;
};

type DestinationOption = {
    id: number;
    label: string;
    status?: string | null;
    is_live?: boolean;
};

type Props = {
    vouchers: Voucher[];
    hotelOptions: Array<{ id: number; label: string }>;
    wisataDestinationOptions?: DestinationOption[];
    typeOptions: Array<'percentage' | 'fixed'>;
    routeBase?: string;
    showHotelScope?: boolean;
    pageTitle?: string;
    pageEyebrow?: string;
    pageDescription?: string;
    breadcrumbs?: BreadcrumbItem[];
};

const emptyForm = {
    code: '',
    discount_type: 'percentage' as 'percentage' | 'fixed',
    discount_value: '',
    min_transaction: '',
    quota_total: '',
    max_per_user_per_day: '',
    starts_at: '',
    ends_at: '',
    hotel_id: '',
    destination_scope: 'all' as 'all' | 'selected',
    wisata_destination_ids: [] as string[],
    is_active: true,
};

const isActiveLabel = (voucher: Voucher) => {
    if (!voucher.is_active) return false;
    const today = new Date().toISOString().slice(0, 10);
    const start = voucher.starts_at ?? null;
    const end = voucher.ends_at ?? null;
    if (start && today < start) return false;
    if (end && today > end) return false;
    return true;
};

export default function VoucherIndex({
    vouchers,
    hotelOptions,
    wisataDestinationOptions = [],
    typeOptions,
    routeBase = '/admin/marketing/vouchers',
    showHotelScope = true,
    pageTitle = 'Voucher',
    pageEyebrow = 'Promo & Voucher',
    pageDescription = 'Atur kode promo, diskon, kuota, dan periode berlaku.',
    breadcrumbs = defaultBreadcrumbs,
}: Props) {
    const [editingId, setEditingId] = useState<number | null>(null);
    const [formOpen, setFormOpen] = useState(false);
    const [form, setForm] = useState(emptyForm);
    const [minTransactionDisplay, setMinTransactionDisplay] = useState('');

    const resetForm = () => {
        setEditingId(null);
        setForm(emptyForm);
        setMinTransactionDisplay('');
    };

    const openCreate = () => {
        resetForm();
        setFormOpen(true);
    };

    const startEdit = (voucher: Voucher) => {
        setEditingId(voucher.id);
        setForm({
            code: voucher.code,
            discount_type: voucher.discount_type,
            discount_value: String(voucher.discount_value),
            min_transaction: String(voucher.min_transaction ?? ''),
            quota_total: String(voucher.quota_total),
            max_per_user_per_day: String(voucher.max_per_user_per_day ?? ''),
            starts_at: voucher.starts_at ?? '',
            ends_at: voucher.ends_at ?? '',
            hotel_id: voucher.hotel_id ? String(voucher.hotel_id) : '',
            destination_scope:
                voucher.wisata_destination_ids && voucher.wisata_destination_ids.length > 0
                    ? 'selected'
                    : 'all',
            wisata_destination_ids: (voucher.wisata_destination_ids ?? []).map((id) => String(id)),
            is_active: voucher.is_active,
        });
        setMinTransactionDisplay(
            voucher.min_transaction ? Number(voucher.min_transaction).toLocaleString('id-ID') : '',
        );
        setFormOpen(true);
    };

    const toggleDestination = (id: number, checked: boolean) => {
        const value = String(id);
        setForm((prev) => ({
            ...prev,
            wisata_destination_ids: checked
                ? Array.from(new Set([...prev.wisata_destination_ids, value]))
                : prev.wisata_destination_ids.filter((destinationId) => destinationId !== value),
        }));
    };

    const submit = (event: React.FormEvent) => {
        event.preventDefault();
        const payload = {
            ...form,
            discount_value: Number(form.discount_value),
            min_transaction: form.min_transaction ? Number(form.min_transaction) : 0,
            quota_total: Number(form.quota_total),
            max_per_user_per_day: form.max_per_user_per_day ? Number(form.max_per_user_per_day) : 0,
            hotel_id: form.hotel_id || null,
            destination_scope: form.destination_scope,
            wisata_destination_ids:
                form.destination_scope === 'selected'
                    ? form.wisata_destination_ids.map((id) => Number(id))
                    : [],
            is_active: form.is_active ? 1 : 0,
        };

        const options = {
            onSuccess: () => {
                Swal.fire({
                    title: 'Berhasil',
                    text: editingId ? 'Voucher diperbarui.' : 'Voucher dibuat.',
                    icon: 'success',
                });
                resetForm();
                setFormOpen(false);
            },
            onError: () =>
                Swal.fire({
                    title: 'Gagal',
                    text: editingId ? 'Voucher gagal diperbarui.' : 'Voucher gagal dibuat.',
                    icon: 'error',
                }),
        };

        if (editingId) {
            router.put(`${routeBase}/${editingId}`, payload, options);
            return;
        }

        router.post(routeBase, payload, options);
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

        router.delete(`${routeBase}/${voucherId}`, {
            onSuccess: () => Swal.fire({ title: 'Berhasil', text: 'Voucher dihapus.', icon: 'success' }),
            onError: () => Swal.fire({ title: 'Gagal', text: 'Voucher gagal dihapus.', icon: 'error' }),
        });
    };

    const scopeLabel = (voucher: Voucher) => {
        if (showHotelScope) {
            return voucher.hotel_name ?? 'Global wisata';
        }

        if (voucher.wisata_destination_names && voucher.wisata_destination_names.length > 0) {
            return voucher.wisata_destination_names.join(', ');
        }

        return 'Semua destinasi wisata';
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={pageTitle} />
            <div className="flex flex-1 flex-col gap-6 bg-[#f6fbff] px-6 py-8 text-slate-900">
                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div className="space-y-2">
                            <p className="text-xs font-semibold uppercase text-sky-600">{pageEyebrow}</p>
                            <h1 className="text-2xl font-semibold text-slate-900">{pageTitle}</h1>
                            <p className="text-sm text-slate-500">{pageDescription}</p>
                        </div>

                        <Dialog
                            open={formOpen}
                            onOpenChange={(open) => {
                                setFormOpen(open);
                                if (!open) resetForm();
                            }}
                        >
                            <DialogTrigger asChild>
                                <Button
                                    type="button"
                                    onClick={openCreate}
                                    className="w-fit bg-sky-600 text-white hover:bg-sky-700"
                                    data-coach="voucher-create"
                                >
                                    Buat voucher
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-h-[92dvh] w-[calc(100vw-1rem)] overflow-y-auto p-5 sm:max-w-[calc(100vw-2rem)] lg:max-w-7xl lg:p-7">
                                <DialogHeader>
                                    <DialogTitle>
                                        {editingId ? 'Edit voucher' : 'Buat voucher wisata'}
                                    </DialogTitle>
                                </DialogHeader>

                                <form onSubmit={submit} className="grid gap-4 lg:grid-cols-12">
                                    <div className="grid gap-2 lg:col-span-3">
                                        <label className="text-xs font-semibold uppercase text-slate-400">
                                            Kode <span className="text-red-600">*</span>
                                        </label>
                                        <input
                                            value={form.code}
                                            onChange={(event) => setForm((prev) => ({ ...prev, code: event.target.value }))}
                                            className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs"
                                            placeholder="INDOTIX10"
                                            required
                                        />
                                    </div>

                                    <div className="grid gap-2 lg:col-span-2">
                                        <label className="text-xs font-semibold uppercase text-slate-400">
                                            Tipe <span className="text-red-600">*</span>
                                        </label>
                                        <select
                                            required
                                            value={form.discount_type}
                                            onChange={(event) =>
                                                setForm((prev) => ({
                                                    ...prev,
                                                    discount_type: event.target.value as 'percentage' | 'fixed',
                                                }))
                                            }
                                            className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs"
                                        >
                                            {typeOptions.map((type) => (
                                                <option key={type} value={type}>
                                                    {type === 'percentage' ? 'Persentase' : 'Fixed'}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="grid gap-2 lg:col-span-2">
                                        <label className="text-xs font-semibold uppercase text-slate-400">
                                            Diskon <span className="text-red-600">*</span>
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

                                    <div className="grid gap-2 lg:col-span-3">
                                        <label className="text-xs font-semibold uppercase text-slate-400">Min Transaksi</label>
                                        <input
                                            inputMode="numeric"
                                            value={minTransactionDisplay}
                                            onChange={(event) => {
                                                const raw = parseCurrencyToDigits(event.target.value);
                                                setForm((prev) => ({ ...prev, min_transaction: raw }));
                                                setMinTransactionDisplay(formatCurrencyInput(raw));
                                            }}
                                            className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs"
                                            placeholder="0"
                                        />
                                    </div>

                                    <div className="grid gap-2 lg:col-span-2">
                                        <label className="text-xs font-semibold uppercase text-slate-400">
                                            Kuota <span className="text-red-600">*</span>
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

                                    <div className="grid gap-2 lg:col-span-2">
                                        <label className="text-xs font-semibold uppercase text-slate-400">Limit / user</label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={form.max_per_user_per_day}
                                            onChange={(event) => setForm((prev) => ({ ...prev, max_per_user_per_day: event.target.value }))}
                                            className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs"
                                            placeholder="0"
                                        />
                                    </div>

                                    <div className="grid gap-2 lg:col-span-2">
                                        <label className="text-xs font-semibold uppercase text-slate-400">Mulai</label>
                                        <input
                                            type="date"
                                            value={form.starts_at}
                                            onChange={(event) => setForm((prev) => ({ ...prev, starts_at: event.target.value }))}
                                            className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs"
                                        />
                                    </div>

                                    <div className="grid gap-2 lg:col-span-2">
                                        <label className="text-xs font-semibold uppercase text-slate-400">Sampai</label>
                                        <input
                                            type="date"
                                            value={form.ends_at}
                                            onChange={(event) => setForm((prev) => ({ ...prev, ends_at: event.target.value }))}
                                            className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs"
                                        />
                                    </div>

                                    {showHotelScope && (
                                        <div className="grid gap-2 lg:col-span-4">
                                            <label className="text-xs font-semibold uppercase text-slate-400">Hotel (opsional)</label>
                                            <select
                                                value={form.hotel_id}
                                                onChange={(event) => setForm((prev) => ({ ...prev, hotel_id: event.target.value }))}
                                                className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs"
                                            >
                                                <option value="">Global wisata</option>
                                                {hotelOptions.map((hotel) => (
                                                    <option key={hotel.id} value={hotel.id}>
                                                        {hotel.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    )}

                                    {!showHotelScope && (
                                        <div className="grid gap-3 rounded-2xl border border-sky-100 bg-sky-50/70 p-4 lg:col-span-12">
                                            <div>
                                                <label className="text-xs font-semibold uppercase text-slate-500">
                                                    Aturan produk <span className="text-red-600">*</span>
                                                </label>
                                                <p className="mt-1 text-xs text-slate-500">
                                                    Pilih apakah voucher berlaku untuk semua destinasi atau hanya destinasi tertentu.
                                                </p>
                                            </div>
                                            <div className="grid gap-2 sm:grid-cols-2">
                                                <label className="flex items-start gap-3 rounded-xl border border-white bg-white p-3 text-sm shadow-xs">
                                                    <input
                                                        type="radio"
                                                        name="destination_scope"
                                                        value="all"
                                                        checked={form.destination_scope === 'all'}
                                                        onChange={() =>
                                                            setForm((prev) => ({
                                                                ...prev,
                                                                destination_scope: 'all',
                                                                wisata_destination_ids: [],
                                                            }))
                                                        }
                                                    />
                                                    <span>
                                                        <span className="block font-semibold text-slate-900">Semua destinasi</span>
                                                        <span className="text-xs text-slate-500">Voucher dapat digunakan di semua produk wisata.</span>
                                                    </span>
                                                </label>
                                                <label className="flex items-start gap-3 rounded-xl border border-white bg-white p-3 text-sm shadow-xs">
                                                    <input
                                                        type="radio"
                                                        name="destination_scope"
                                                        value="selected"
                                                        checked={form.destination_scope === 'selected'}
                                                        onChange={() => setForm((prev) => ({ ...prev, destination_scope: 'selected' }))}
                                                    />
                                                    <span>
                                                        <span className="block font-semibold text-slate-900">Produk tertentu</span>
                                                        <span className="text-xs text-slate-500">Voucher hanya valid untuk destinasi yang dipilih.</span>
                                                    </span>
                                                </label>
                                            </div>

                                            {form.destination_scope === 'selected' && (
                                                <div className="max-h-64 overflow-y-auto rounded-xl border border-slate-200 bg-white p-3">
                                                    {wisataDestinationOptions.length === 0 ? (
                                                        <p className="text-sm text-slate-500">Belum ada destinasi wisata yang bisa dipilih.</p>
                                                    ) : (
                                                        <div className="grid gap-2 sm:grid-cols-2">
                                                            {wisataDestinationOptions.map((destination) => (
                                                                <label key={destination.id} className="flex items-start gap-3 rounded-lg border border-slate-100 p-3 text-sm hover:bg-sky-50">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={form.wisata_destination_ids.includes(String(destination.id))}
                                                                        onChange={(event) => toggleDestination(destination.id, event.target.checked)}
                                                                    />
                                                                    <span>
                                                                        <span className="block font-semibold text-slate-900">{destination.label}</span>
                                                                        <span className="text-xs text-slate-500">
                                                                            {destination.is_live ? 'Live' : 'Belum live'} · {destination.status ?? 'status belum ada'}
                                                                        </span>
                                                                    </span>
                                                                </label>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <div className="flex flex-col gap-3 lg:col-span-12 lg:flex-row lg:items-center lg:justify-between">
                                        <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500">
                                            <input
                                                type="checkbox"
                                                checked={form.is_active}
                                                onChange={(event) => setForm((prev) => ({ ...prev, is_active: event.target.checked }))}
                                            />
                                            Aktif
                                        </label>
                                        <div className="flex gap-2">
                                            <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>
                                                Batal
                                            </Button>
                                            <Button type="submit" className="bg-sky-600 text-white hover:bg-sky-700">
                                                {editingId ? 'Simpan perubahan' : 'Buat voucher'}
                                            </Button>
                                        </div>
                                    </div>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>
                </section>

                <section
                    className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm"
                    data-coach="voucher-list"
                >
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-left text-sm">
                            <thead className="text-xs uppercase text-slate-400">
                                <tr>
                                    <th className="py-3 pr-4">Kode</th>
                                    <th className="py-3 pr-4">Diskon</th>
                                    <th className="py-3 pr-4">Min Transaksi</th>
                                    <th className="py-3 pr-4">Kuota</th>
                                    <th className="py-3 pr-4">Limit User</th>
                                    <th className="py-3 pr-4">Periode</th>
                                    <th className="py-3 pr-4">Scope</th>
                                    <th className="py-3 pr-4">Status</th>
                                    <th className="py-3 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {vouchers.length === 0 && (
                                    <tr>
                                        <td colSpan={9} className="py-8 text-center text-slate-500">
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
                                            {voucher.min_transaction ? `Rp ${voucher.min_transaction.toLocaleString('id-ID')}` : '-'}
                                        </td>
                                        <td className="py-4 pr-4 text-slate-600">
                                            {voucher.quota_total > 0
                                                ? `${voucher.quota_used}/${voucher.quota_total}`
                                                : `${voucher.quota_used}/Tidak dibatasi`}
                                        </td>
                                        <td className="py-4 pr-4 text-slate-600">
                                            {voucher.max_per_user_per_day ? voucher.max_per_user_per_day : '-'}
                                        </td>
                                        <td className="py-4 pr-4 text-slate-600">
                                            {voucher.starts_at ?? '-'} → {voucher.ends_at ?? '-'}
                                        </td>
                                        <td className="max-w-xs py-4 pr-4 text-slate-600">
                                            <span className="line-clamp-2">{scopeLabel(voucher)}</span>
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
