import { Head, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import InputError from '@/components/input-error';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import Swal from 'sweetalert2';
import { formatCurrencyInput, parseCurrencyToDigits } from '@/lib/currency';

type Ticket = {
    id: number;
    name: string;
    description: string | null;
    price: number;
    quota: number;
    daily_quota: number | null;
    min_order_quantity: number;
    max_order_quantity: number | null;
    ticket_type: string;
    ticket_kind: string;
    is_entry_ticket: boolean;
    package_items: Array<{ ticket_id: number; quantity: number }>;
    valid_from: string | null;
    valid_until: string | null;
    refund_policy: string | null;
    is_active: boolean;
    is_closed: boolean;
};

type ComponentTicket = {
    id: number;
    name: string;
    price: number;
};

type PackageItemInput = {
    ticket_id: string;
    quantity: string;
};

type Props = {
    destination: { id: number; destination_name: string | null };
    ticket?: Ticket | null;
    componentTickets: ComponentTicket[];
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard Mitra', href: '/mitra/dashboard' },
    { title: 'Produk Tiket', href: '/mitra/wisata/tickets' },
    { title: 'Form Tiket', href: '/mitra/wisata/tickets/create' },
];

export default function MitraWisataTicketCreate({
    destination,
    ticket,
    componentTickets,
}: Props) {
    const initialPackageItems = ticket?.package_items?.length
        ? ticket.package_items.map((item) => ({
              ticket_id: item.ticket_id.toString(),
              quantity: item.quantity.toString(),
          }))
        : [{ ticket_id: '', quantity: '1' }];

    const form = useForm({
        name: ticket?.name ?? '',
        description: ticket?.description ?? '',
        price: ticket?.price?.toString() ?? '',
        quota: ticket?.quota?.toString() ?? '',
        daily_quota: ticket?.daily_quota?.toString() ?? '',
        min_order_quantity: ticket?.min_order_quantity?.toString() ?? '1',
        max_order_quantity: ticket?.max_order_quantity?.toString() ?? '',
        ticket_type: ticket?.ticket_type ?? 'perorangan',
        ticket_kind: ticket?.ticket_kind ?? 'single',
        is_entry_ticket: ticket?.is_entry_ticket ?? true,
        package_items: initialPackageItems as PackageItemInput[],
        valid_from: ticket?.valid_from ?? '',
        valid_until: ticket?.valid_until ?? '',
        refund_policy: ticket?.refund_policy ?? '',
        is_active: ticket?.is_active ?? false,
        is_closed: ticket?.is_closed ?? false,
    });
    const [priceDisplay, setPriceDisplay] = useState(
        formatCurrencyInput(ticket?.price ?? ''),
    );

    const handlePriceChange = (value: string) => {
        setPriceDisplay(formatCurrencyInput(value));
        form.setData('price', parseCurrencyToDigits(value));
    };

    const handleSubmit = () => {
        form.transform((data) => ({
            ...data,
            price: Number(data.price || 0),
            quota: Number(data.quota || 0),
            daily_quota: data.daily_quota ? Number(data.daily_quota) : null,
            min_order_quantity: Number(data.min_order_quantity || 1),
            max_order_quantity: data.max_order_quantity
                ? Number(data.max_order_quantity)
                : null,
            package_items:
                data.ticket_kind === 'package'
                    ? data.package_items
                          .filter(
                              (item) =>
                                  item.ticket_id && Number(item.quantity) > 0,
                          )
                          .map((item) => ({
                              ticket_id: Number(item.ticket_id),
                              quantity: Number(item.quantity),
                          }))
                    : [],
        }));

        if (ticket?.id) {
            form.put(`/mitra/wisata/tickets/${ticket.id}`, {
                onSuccess: () =>
                    Swal.fire({
                        icon: 'success',
                        title: 'Tersimpan',
                        text: 'Tiket diperbarui.',
                    }).then(() => {
                        router.visit('/mitra/wisata/tickets');
                    }),
                onError: () =>
                    Swal.fire({
                        icon: 'error',
                        title: 'Gagal',
                        text: 'Tidak dapat menyimpan tiket.',
                    }),
            });
            return;
        }

        form.post('/mitra/wisata/tickets', {
            onSuccess: () =>
                Swal.fire({
                    icon: 'success',
                    title: 'Tersimpan',
                    text: 'Tiket dibuat.',
                }).then(() => {
                    router.visit('/mitra/wisata/tickets');
                }),
            onError: () =>
                Swal.fire({
                    icon: 'error',
                    title: 'Gagal',
                    text: 'Tidak dapat membuat tiket.',
                }),
        });
    };

    const updatePackageItem = (
        index: number,
        key: keyof PackageItemInput,
        value: string,
    ) => {
        const next = [...form.data.package_items];
        next[index] = { ...next[index], [key]: value };
        form.setData('package_items', next);
    };

    const addPackageItem = () => {
        form.setData('package_items', [
            ...form.data.package_items,
            { ticket_id: '', quantity: '1' },
        ]);
    };

    const removePackageItem = (index: number) => {
        form.setData(
            'package_items',
            form.data.package_items.filter(
                (_, itemIndex) => itemIndex !== index,
            ),
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Form Tiket Wisata" />
            <div className="flex flex-1 flex-col gap-6 bg-[#f6fbff] px-6 py-8">
                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <h1 className="text-2xl font-semibold text-slate-900">
                        {ticket ? 'Edit' : 'Tambah'} Produk Tiket
                    </h1>
                    <p className="text-sm text-slate-500">
                        Destinasi: {destination.destination_name ?? '-'}
                    </p>

                    <form
                        className="mt-6 grid gap-4 md:grid-cols-2"
                        onSubmit={(event) => {
                            event.preventDefault();
                            handleSubmit();
                        }}
                    >
                        <div className="grid gap-2 md:col-span-2">
                            <Label required>Nama Tiket</Label>
                            <Input
                                required
                                value={form.data.name}
                                onChange={(e) =>
                                    form.setData('name', e.target.value)
                                }
                            />
                            <InputError message={form.errors.name} />
                        </div>
                        <div className="grid gap-2 md:col-span-2">
                            <Label>Deskripsi</Label>
                            <textarea
                                className="min-h-[100px] rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                value={form.data.description}
                                onChange={(e) =>
                                    form.setData('description', e.target.value)
                                }
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label required>Harga (Rp)</Label>
                            <Input
                                required
                                type="text"
                                inputMode="numeric"
                                value={priceDisplay}
                                onChange={(e) =>
                                    handlePriceChange(e.target.value)
                                }
                                placeholder="10.000"
                            />
                            <InputError message={form.errors.price} />
                        </div>
                        <div className="grid gap-2">
                            <Label required>Kuota Total</Label>
                            <Input
                                required
                                type="number"
                                min={0}
                                value={form.data.quota}
                                onChange={(e) =>
                                    form.setData('quota', e.target.value)
                                }
                            />
                            <InputError message={form.errors.quota} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Kuota Harian (opsional)</Label>
                            <Input
                                type="number"
                                min={0}
                                value={form.data.daily_quota}
                                onChange={(e) =>
                                    form.setData('daily_quota', e.target.value)
                                }
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>Minimum Order</Label>
                            <Input
                                type="number"
                                min={1}
                                max={20}
                                value={form.data.min_order_quantity}
                                onChange={(e) =>
                                    form.setData(
                                        'min_order_quantity',
                                        e.target.value,
                                    )
                                }
                                placeholder="1"
                            />
                            <InputError
                                message={form.errors.min_order_quantity}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>Maksimum Order (opsional)</Label>
                            <Input
                                type="number"
                                min={1}
                                max={20}
                                value={form.data.max_order_quantity}
                                onChange={(e) =>
                                    form.setData(
                                        'max_order_quantity',
                                        e.target.value,
                                    )
                                }
                                placeholder="20"
                            />
                            <InputError
                                message={form.errors.max_order_quantity}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label required>Jenis Tiket</Label>
                            <Select
                                value={form.data.ticket_type}
                                onValueChange={(value) =>
                                    form.setData('ticket_type', value)
                                }
                            >
                                <SelectTrigger aria-required="true">
                                    <SelectValue placeholder="Pilih jenis" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="perorangan">
                                        Perorangan
                                    </SelectItem>
                                    <SelectItem value="grup">Grup</SelectItem>
                                </SelectContent>
                            </Select>
                            <InputError message={form.errors.ticket_type} />
                        </div>
                        <div className="grid gap-2 md:col-span-2">
                            <Label>Jenis Produk</Label>
                            <div className="grid gap-3 sm:grid-cols-2">
                                {[
                                    {
                                        value: 'single',
                                        title: 'Tiket satuan',
                                        description:
                                            'Tiket dijual sebagai produk biasa.',
                                    },
                                    {
                                        value: 'package',
                                        title: 'Paket wisata',
                                        description:
                                            'Gabungkan beberapa tiket satuan dalam satu paket.',
                                    },
                                ].map((option) => (
                                    <label
                                        key={option.value}
                                        className={`rounded-2xl border p-4 text-sm transition ${
                                            form.data.ticket_kind ===
                                            option.value
                                                ? 'border-sky-300 bg-sky-50 text-sky-900'
                                                : 'border-slate-200 bg-white text-slate-700'
                                        }`}
                                    >
                                        <input
                                            type="radio"
                                            className="sr-only"
                                            checked={
                                                form.data.ticket_kind ===
                                                option.value
                                            }
                                            onChange={() =>
                                                form.setData(
                                                    'ticket_kind',
                                                    option.value,
                                                )
                                            }
                                        />
                                        <span className="block font-semibold">
                                            {option.title}
                                        </span>
                                        <span className="mt-1 block text-xs text-slate-500">
                                            {option.description}
                                        </span>
                                    </label>
                                ))}
                            </div>
                            <InputError message={form.errors.ticket_kind} />
                        </div>
                        <div className="md:col-span-2">
                            <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm">
                                <input
                                    type="checkbox"
                                    checked={form.data.is_entry_ticket}
                                    onChange={(event) =>
                                        form.setData(
                                            'is_entry_ticket',
                                            event.target.checked,
                                        )
                                    }
                                    className="mt-1 h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                                />
                                <span>
                                    <span className="block font-semibold text-slate-800">
                                        Ini adalah tiket masuk
                                    </span>
                                    <span className="mt-1 block text-xs leading-relaxed text-slate-500">
                                        Matikan checklist ini untuk tiket terusan
                                        seperti wahana atau aktivitas di dalam
                                        destinasi. Tiket terusan wajib dipesan
                                        bersama tiket masuk.
                                    </span>
                                </span>
                            </label>
                            <InputError message={form.errors.is_entry_ticket} />
                        </div>
                        {form.data.ticket_kind === 'package' && (
                            <div className="grid gap-3 rounded-2xl border border-sky-100 bg-sky-50/60 p-4 md:col-span-2">
                                <div>
                                    <Label required>Isi Paket Wisata</Label>
                                    <p className="text-xs text-slate-500">
                                        Pilih tiket satuan yang masuk ke paket.
                                        Paket punya harga dan kuota sendiri agar
                                        penjualan tetap mudah dikontrol.
                                    </p>
                                </div>
                                {componentTickets.length === 0 ? (
                                    <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                                        Belum ada tiket satuan. Buat tiket
                                        satuan terlebih dahulu sebelum membuat
                                        paket.
                                    </div>
                                ) : (
                                    <div className="grid gap-3">
                                        {form.data.package_items.map(
                                            (item, index) => (
                                                <div
                                                    key={`${index}-${item.ticket_id}`}
                                                    className="grid gap-2 rounded-xl border border-white bg-white p-3 shadow-sm sm:grid-cols-[minmax(0,1fr)_120px_auto]"
                                                >
                                                    <select
                                                        required
                                                        value={item.ticket_id}
                                                        aria-label={`Tiket satuan paket ${index + 1}`}
                                                        onChange={(event) =>
                                                            updatePackageItem(
                                                                index,
                                                                'ticket_id',
                                                                event.target
                                                                    .value,
                                                            )
                                                        }
                                                        className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                                    >
                                                        <option value="">
                                                            Pilih tiket satuan
                                                        </option>
                                                        {componentTickets.map(
                                                            (
                                                                componentTicket,
                                                            ) => (
                                                                <option
                                                                    key={
                                                                        componentTicket.id
                                                                    }
                                                                    value={
                                                                        componentTicket.id
                                                                    }
                                                                >
                                                                    {
                                                                        componentTicket.name
                                                                    }{' '}
                                                                    - Rp{' '}
                                                                    {componentTicket.price.toLocaleString(
                                                                        'id-ID',
                                                                    )}
                                                                </option>
                                                            ),
                                                        )}
                                                    </select>
                                                    <Input
                                                        required
                                                        type="number"
                                                        min={1}
                                                        aria-label={`Jumlah tiket paket ${index + 1}`}
                                                        value={item.quantity}
                                                        onChange={(event) =>
                                                            updatePackageItem(
                                                                index,
                                                                'quantity',
                                                                event.target
                                                                    .value,
                                                            )
                                                        }
                                                        placeholder="Jumlah"
                                                    />
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        className="border-rose-200 text-rose-600 hover:bg-rose-50"
                                                        onClick={() =>
                                                            removePackageItem(
                                                                index,
                                                            )
                                                        }
                                                        disabled={
                                                            form.data
                                                                .package_items
                                                                .length === 1
                                                        }
                                                    >
                                                        Hapus
                                                    </Button>
                                                </div>
                                            ),
                                        )}
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="w-full border-sky-200 text-sky-700 hover:bg-sky-50 sm:w-fit"
                                            onClick={addPackageItem}
                                        >
                                            Tambah Isi Paket
                                        </Button>
                                    </div>
                                )}
                                <InputError
                                    message={form.errors.package_items}
                                />
                            </div>
                        )}
                        <div className="grid gap-2">
                            <Label>Berlaku Dari</Label>
                            <Input
                                type="date"
                                value={form.data.valid_from}
                                onChange={(e) =>
                                    form.setData('valid_from', e.target.value)
                                }
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>Berlaku Sampai</Label>
                            <Input
                                type="date"
                                value={form.data.valid_until}
                                onChange={(e) =>
                                    form.setData('valid_until', e.target.value)
                                }
                            />
                        </div>
                        <div className="grid gap-2 md:col-span-2">
                            <Label>Kebijakan Refund</Label>
                            <Input
                                value={form.data.refund_policy}
                                onChange={(e) =>
                                    form.setData(
                                        'refund_policy',
                                        e.target.value,
                                    )
                                }
                                placeholder="Contoh: Refund H-1, manual review"
                            />
                        </div>
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center md:col-span-2">
                            <label className="flex items-center gap-2 text-sm text-slate-600">
                                <input
                                    type="checkbox"
                                    checked={form.data.is_active}
                                    onChange={(e) =>
                                        form.setData(
                                            'is_active',
                                            e.target.checked,
                                        )
                                    }
                                />
                                Aktifkan tiket
                            </label>
                            <label className="flex items-center gap-2 text-sm text-slate-600">
                                <input
                                    type="checkbox"
                                    checked={form.data.is_closed}
                                    onChange={(e) =>
                                        form.setData(
                                            'is_closed',
                                            e.target.checked,
                                        )
                                    }
                                />
                                Tutup penjualan sementara
                            </label>
                        </div>
                        <div className="flex flex-col gap-2 sm:flex-row md:col-span-2">
                            <Button
                                type="submit"
                                className="bg-sky-600 text-white hover:bg-sky-700"
                            >
                                Simpan
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                className="border-slate-200 text-slate-700"
                                onClick={() =>
                                    router.visit('/mitra/wisata/tickets')
                                }
                            >
                                Batal
                            </Button>
                        </div>
                    </form>
                </section>
            </div>
        </AppLayout>
    );
}
