import { Head, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import InputError from '@/components/input-error';
import Swal from 'sweetalert2';
import { formatCurrencyInput, parseCurrencyToDigits } from '@/lib/currency';

type TicketRow = {
    id: number;
    name: string;
    price: number;
    quota: number | null;
    ticket_type: string;
    refundable: boolean;
    is_active: boolean;
    academy_class_id: number;
    academy_class?: { id: number; title: string };
    sales_start_at?: string | null;
    sales_end_at?: string | null;
};

type Props = {
    tickets: { data: TicketRow[] };
    classes: Array<{ id: number; title: string }>;
    filters: { class_id?: number | null };
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Eljohn Academy', href: '/admin/academy/classes' },
    { title: 'Produk Tiket', href: '/admin/academy/tickets' },
];

const emptyForm = {
    academy_class_id: '',
    name: '',
    price: '',
    quota: '',
    ticket_type: 'regular',
    refundable: false,
    sales_start_at: '',
    sales_end_at: '',
    is_active: true,
};

const toDate = (value?: string | null) => {
    if (!value) return null;
    const normalized = value.includes('T') ? value : value.replace(' ', 'T');
    const date = new Date(normalized);
    return Number.isNaN(date.getTime()) ? null : date;
};

const toDatetimeLocal = (value?: string | null) => {
    const date = toDate(value);
    if (!date) return '';
    const pad = (v: number) => String(v).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

export default function AcademyTicketsIndex({
    tickets,
    classes,
    filters,
}: Props) {
    const [editing, setEditing] = useState<TicketRow | null>(null);
    const form = useForm({ ...emptyForm });
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [priceDisplay, setPriceDisplay] = useState('');

    const openCreate = () => {
        setEditing(null);
        form.setData({ ...emptyForm });
        setPriceDisplay('');
        setIsFormOpen(true);
    };

    const openEdit = (item: TicketRow) => {
        setEditing(item);
        form.setData({
            ...emptyForm,
            academy_class_id: String(item.academy_class_id),
            name: item.name,
            price: String(item.price ?? ''),
            quota: item.quota === null ? '' : String(item.quota),
            ticket_type: item.ticket_type,
            refundable: item.refundable,
            sales_start_at: toDatetimeLocal(item.sales_start_at),
            sales_end_at: toDatetimeLocal(item.sales_end_at),
            is_active: item.is_active,
        });
        setPriceDisplay(formatCurrencyInput(item.price ?? ''));
        setIsFormOpen(true);
    };

    const handlePriceChange = (value: string) => {
        setPriceDisplay(formatCurrencyInput(value));
        form.setData('price', parseCurrencyToDigits(value));
    };

    const submit = () => {
        const payload = {
            ...form.data,
            academy_class_id: Number(form.data.academy_class_id),
            price: Number(form.data.price || 0),
            quota: form.data.quota === '' ? null : Number(form.data.quota),
            refundable: Boolean(form.data.refundable),
            sales_start_at: form.data.sales_start_at || null,
            sales_end_at: form.data.sales_end_at || null,
            is_active: Boolean(form.data.is_active),
        };

        if (editing) {
            router.put(`/admin/academy/tickets/${editing.id}`, payload, {
                onSuccess: () => {
                    Swal.fire({
                        icon: 'success',
                        title: 'Tersimpan',
                        text: 'Tiket diperbarui.',
                    });
                    setIsFormOpen(false);
                },
                onError: () =>
                    Swal.fire({
                        icon: 'error',
                        title: 'Gagal',
                        text: 'Periksa data.',
                    }),
            });
        } else {
            router.post('/admin/academy/tickets', payload, {
                onSuccess: () => {
                    Swal.fire({
                        icon: 'success',
                        title: 'Tersimpan',
                        text: 'Tiket dibuat.',
                    });
                    setIsFormOpen(false);
                },
                onError: () =>
                    Swal.fire({
                        icon: 'error',
                        title: 'Gagal',
                        text: 'Periksa data.',
                    }),
            });
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Produk Tiket Academy" />
            <div className="flex flex-1 flex-col gap-6 bg-[#f6fbff] px-6 py-8">
                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <p className="text-xs font-semibold text-sky-600 uppercase">
                                Academy
                            </p>
                            <h1 className="mt-2 text-2xl font-semibold text-slate-900">
                                Produk Tiket
                            </h1>
                        </div>
                        <div className="flex gap-2">
                            <form
                                onSubmit={(event) => {
                                    event.preventDefault();
                                    const data = new FormData(
                                        event.currentTarget,
                                    );
                                    router.get(
                                        '/admin/academy/tickets',
                                        Object.fromEntries(data.entries()),
                                    );
                                }}
                            >
                                <label className="grid gap-1 text-xs font-medium text-slate-600">
                                    <span>Kelas</span>
                                    <select
                                        name="class_id"
                                        defaultValue={filters.class_id ?? ''}
                                        className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                    >
                                        <option value="">Semua Kelas</option>
                                        {classes.map((item) => (
                                            <option key={item.id} value={item.id}>
                                                {item.title}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                            </form>
                            <Button
                                className="bg-sky-600 text-white hover:bg-sky-700"
                                onClick={openCreate}
                            >
                                Buat Tiket
                            </Button>
                        </div>
                    </div>
                </section>

                <section className="grid gap-6">
                    <div className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                        <div className="overflow-hidden rounded-2xl border border-slate-100">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50 text-xs text-slate-500 uppercase">
                                    <tr>
                                        <th className="px-4 py-3 text-left">
                                            Nama
                                        </th>
                                        <th className="px-4 py-3 text-left">
                                            Kelas
                                        </th>
                                        <th className="px-4 py-3 text-left">
                                            Harga
                                        </th>
                                        <th className="px-4 py-3 text-left">
                                            Kuota
                                        </th>
                                        <th className="px-4 py-3 text-left">
                                            Status
                                        </th>
                                        <th className="px-4 py-3 text-left">
                                            Aksi
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {tickets.data.map((item) => (
                                        <tr
                                            key={item.id}
                                            className="border-t border-slate-100"
                                        >
                                            <td className="px-4 py-3 font-medium text-slate-900">
                                                {item.name}
                                            </td>
                                            <td className="px-4 py-3 text-slate-600">
                                                {item.academy_class?.title ??
                                                    '-'}
                                            </td>
                                            <td className="px-4 py-3 text-slate-600">
                                                Rp{' '}
                                                {item.price.toLocaleString(
                                                    'id-ID',
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-slate-600">
                                                {item.quota ?? '-'}
                                            </td>
                                            <td className="px-4 py-3">
                                                <Badge
                                                    className={
                                                        item.is_active
                                                            ? 'bg-emerald-50 text-emerald-700'
                                                            : 'bg-rose-50 text-rose-700'
                                                    }
                                                >
                                                    {item.is_active
                                                        ? 'Aktif'
                                                        : 'Nonaktif'}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex flex-wrap gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() =>
                                                            openEdit(item)
                                                        }
                                                    >
                                                        Edit
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="destructive"
                                                        onClick={() => {
                                                            Swal.fire({
                                                                icon: 'warning',
                                                                title: 'Hapus tiket?',
                                                                text: 'Tiket yang dihapus tidak bisa dikembalikan.',
                                                                showCancelButton: true,
                                                                confirmButtonText:
                                                                    'Hapus',
                                                                cancelButtonText:
                                                                    'Batal',
                                                            }).then(
                                                                (result) => {
                                                                    if (
                                                                        result.isConfirmed
                                                                    ) {
                                                                        router.delete(
                                                                            `/admin/academy/tickets/${item.id}`,
                                                                            {
                                                                                onSuccess:
                                                                                    () => {
                                                                                        Swal.fire(
                                                                                            {
                                                                                                icon: 'success',
                                                                                                title: 'Terhapus',
                                                                                                text: 'Tiket dihapus.',
                                                                                            },
                                                                                        );
                                                                                    },
                                                                                onError:
                                                                                    (
                                                                                        errors,
                                                                                    ) => {
                                                                                        Swal.fire(
                                                                                            {
                                                                                                icon: 'error',
                                                                                                title: 'Gagal',
                                                                                                text:
                                                                                                    errors.ticket ??
                                                                                                    'Tiket gagal dihapus.',
                                                                                            },
                                                                                        );
                                                                                    },
                                                                            },
                                                                        );
                                                                    }
                                                                },
                                                            );
                                                        }}
                                                    >
                                                        Hapus
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {tickets.data.length === 0 && (
                                        <tr>
                                            <td
                                                colSpan={6}
                                                className="px-4 py-8 text-center text-sm text-slate-500"
                                            >
                                                Belum ada tiket.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>
                <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                    <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>
                                {editing ? 'Edit Tiket' : 'Buat Tiket'}
                            </DialogTitle>
                            <DialogDescription>
                                Lengkapi data tiket sebelum disimpan.
                            </DialogDescription>
                        </DialogHeader>
                        <form
                            className="grid gap-3"
                            onSubmit={(event) => {
                                event.preventDefault();
                                submit();
                            }}
                        >
                            <label className="grid gap-1.5 text-sm font-medium text-slate-700">
                                <span>Kelas</span>
                                <select
                                    value={form.data.academy_class_id}
                                    onChange={(event) =>
                                        form.setData(
                                            'academy_class_id',
                                            event.target.value,
                                        )
                                    }
                                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                >
                                    <option value="">Pilih kelas</option>
                                    {classes.map((item) => (
                                        <option key={item.id} value={item.id}>
                                            {item.title}
                                        </option>
                                    ))}
                                </select>
                            </label>
                            <InputError
                                message={form.errors.academy_class_id}
                            />
                            <label className="grid gap-1.5 text-sm font-medium text-slate-700">
                                <span>Nama tiket</span>
                                <input
                                    value={form.data.name}
                                    onChange={(event) =>
                                        form.setData('name', event.target.value)
                                    }
                                    placeholder="Nama tiket"
                                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                />
                            </label>
                            <InputError message={form.errors.name} />
                            <label className="grid gap-1.5 text-sm font-medium text-slate-700">
                                <span>Harga</span>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    value={priceDisplay}
                                    onChange={(event) =>
                                        handlePriceChange(event.target.value)
                                    }
                                    placeholder="Harga"
                                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                />
                            </label>
                            <label className="grid gap-1.5 text-sm font-medium text-slate-700">
                                <span>Kuota</span>
                                <input
                                    type="number"
                                    min={0}
                                    value={form.data.quota}
                                    onChange={(event) =>
                                        form.setData('quota', event.target.value)
                                    }
                                    placeholder="Kuota"
                                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                />
                            </label>
                            <label className="grid gap-1.5 text-sm font-medium text-slate-700">
                                <span>Tipe tiket</span>
                                <select
                                    value={form.data.ticket_type}
                                    onChange={(event) =>
                                        form.setData(
                                            'ticket_type',
                                            event.target.value,
                                        )
                                    }
                                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                >
                                    <option value="regular">Regular</option>
                                    <option value="early_bird">Early Bird</option>
                                    <option value="vip">VIP</option>
                                </select>
                            </label>
                            <label className="grid gap-1.5 text-sm font-medium text-slate-700">
                                <span>Refund</span>
                                <select
                                    value={form.data.refundable ? '1' : '0'}
                                    onChange={(event) =>
                                        form.setData(
                                            'refundable',
                                            event.target.value === '1',
                                        )
                                    }
                                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                >
                                    <option value="1">Refundable</option>
                                    <option value="0">Non-refundable</option>
                                </select>
                            </label>
                            <label className="grid gap-1.5 text-sm font-medium text-slate-700">
                                <span>Mulai penjualan</span>
                                <input
                                    type="datetime-local"
                                    value={form.data.sales_start_at}
                                    onChange={(event) =>
                                        form.setData(
                                            'sales_start_at',
                                            event.target.value,
                                        )
                                    }
                                    placeholder="Mulai penjualan"
                                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                />
                            </label>
                            <InputError message={form.errors.sales_start_at} />
                            <label className="grid gap-1.5 text-sm font-medium text-slate-700">
                                <span>Selesai penjualan</span>
                                <input
                                    type="datetime-local"
                                    value={form.data.sales_end_at}
                                    onChange={(event) =>
                                        form.setData(
                                            'sales_end_at',
                                            event.target.value,
                                        )
                                    }
                                    placeholder="Selesai penjualan"
                                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                />
                            </label>
                            <InputError message={form.errors.sales_end_at} />
                            <label className="grid gap-1.5 text-sm font-medium text-slate-700">
                                <span>Status aktif</span>
                                <select
                                    value={form.data.is_active ? '1' : '0'}
                                    onChange={(event) =>
                                        form.setData(
                                            'is_active',
                                            event.target.value === '1',
                                        )
                                    }
                                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                >
                                    <option value="1">Aktif</option>
                                    <option value="0">Nonaktif</option>
                                </select>
                            </label>
                            <DialogFooter className="gap-2">
                                <Button
                                    type="submit"
                                    className="bg-sky-600 text-white hover:bg-sky-700"
                                >
                                    Simpan
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsFormOpen(false)}
                                >
                                    Batal
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}
