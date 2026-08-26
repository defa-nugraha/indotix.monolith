import { Head, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import InputError from '@/components/input-error';
import Swal from 'sweetalert2';
import { formatCurrencyInput, parseCurrencyToDigits } from '@/lib/currency';

type Option = { id: number; label: string };
type ComponentTicket = {
    id: number;
    destination_id: number;
    name: string;
    price: number;
};
type PackageItemInput = { ticket_id: string; quantity: string };

type Props = {
    destinations: Option[];
    componentTickets: ComponentTicket[];
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Wisata', href: '/admin/wisata/destinations' },
    { title: 'Produk Tiket', href: '/admin/wisata/tickets' },
    { title: 'Tambah Tiket', href: '#' },
];

export default function AdminWisataTicketCreate({
    destinations,
    componentTickets,
}: Props) {
    const form = useForm({
        mitra_wisata_onboarding_id: destinations[0]?.id?.toString() ?? '',
        name: '',
        description: '',
        price: '',
        quota: '',
        daily_quota: '',
        min_order_quantity: '1',
        max_order_quantity: '',
        ticket_type: 'perorangan',
        ticket_kind: 'single',
        is_entry_ticket: true,
        package_items: [{ ticket_id: '', quantity: '1' }] as PackageItemInput[],
        valid_from: '',
        valid_until: '',
        refund_policy: '',
        is_active: false,
        is_closed: false,
    });
    const [priceDisplay, setPriceDisplay] = useState('');

    const handlePriceChange = (value: string) => {
        setPriceDisplay(formatCurrencyInput(value));
        form.setData('price', parseCurrencyToDigits(value));
    };

    const selectedDestinationId = Number(
        form.data.mitra_wisata_onboarding_id || 0,
    );
    const availablePackageTickets = componentTickets.filter(
        (ticket) => ticket.destination_id === selectedDestinationId,
    );

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
            <Head title="Tambah Tiket Wisata" />
            <div className="flex flex-1 flex-col gap-6 bg-[#f6fbff] px-6 py-8">
                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <h1 className="text-2xl font-semibold text-slate-900">
                        Tambah Produk Tiket
                    </h1>
                    <p className="text-sm text-slate-500">
                        Buat tiket wisata untuk destinasi terverifikasi.
                    </p>

                    <form
                        className="mt-6 grid gap-4 md:grid-cols-2"
                        onSubmit={(event) => {
                            event.preventDefault();
                            form.transform((data) => ({
                                ...data,
                                package_items:
                                    data.ticket_kind === 'package'
                                        ? data.package_items.filter(
                                              (item) =>
                                                  item.ticket_id &&
                                                  Number(item.quantity) > 0,
                                          )
                                        : [],
                            }));
                            form.post('/admin/wisata/tickets', {
                                onSuccess: () => {
                                    Swal.fire({
                                        icon: 'success',
                                        title: 'Berhasil',
                                        text: 'Tiket berhasil dibuat.',
                                    }).then(() => {
                                        router.visit('/admin/wisata/tickets');
                                    });
                                },
                                onError: () =>
                                    Swal.fire({
                                        icon: 'error',
                                        title: 'Gagal',
                                        text: 'Tidak dapat membuat tiket.',
                                    }),
                            });
                        }}
                    >
                        <div className="grid gap-2 md:col-span-2">
                            <Label required>Destinasi Wisata</Label>
                            <select
                                required
                                value={form.data.mitra_wisata_onboarding_id}
                                onChange={(event) => {
                                    form.setData(
                                        'mitra_wisata_onboarding_id',
                                        event.target.value,
                                    );
                                    form.setData('package_items', [
                                        { ticket_id: '', quantity: '1' },
                                    ]);
                                }}
                                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                            >
                                <option value="">Pilih destinasi</option>
                                {destinations.map((item) => (
                                    <option key={item.id} value={item.id}>
                                        {item.label}
                                    </option>
                                ))}
                            </select>
                            <InputError
                                message={form.errors.mitra_wisata_onboarding_id}
                            />
                        </div>
                        <div className="grid gap-2 md:col-span-2">
                            <Label required>Nama Tiket</Label>
                            <Input
                                required
                                value={form.data.name}
                                onChange={(event) =>
                                    form.setData('name', event.target.value)
                                }
                                placeholder="Contoh: Tiket Reguler"
                            />
                            <InputError message={form.errors.name} />
                        </div>
                        <div className="grid gap-2 md:col-span-2">
                            <Label>Deskripsi</Label>
                            <textarea
                                className="min-h-[120px] rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                value={form.data.description}
                                onChange={(event) =>
                                    form.setData(
                                        'description',
                                        event.target.value,
                                    )
                                }
                                placeholder="Deskripsi singkat produk tiket"
                            />
                            <InputError message={form.errors.description} />
                        </div>
                        <div className="grid gap-2">
                            <Label required>Harga (Rp)</Label>
                            <Input
                                required
                                type="text"
                                inputMode="numeric"
                                value={priceDisplay}
                                onChange={(event) =>
                                    handlePriceChange(event.target.value)
                                }
                                placeholder="10.000"
                            />
                            <InputError message={form.errors.price} />
                        </div>
                        <div className="grid gap-2">
                            <Label required>Kuota</Label>
                            <Input
                                required
                                type="number"
                                min={0}
                                value={form.data.quota}
                                onChange={(event) =>
                                    form.setData('quota', event.target.value)
                                }
                                placeholder="100"
                            />
                            <InputError message={form.errors.quota} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Kuota Harian (opsional)</Label>
                            <Input
                                type="number"
                                min={0}
                                value={form.data.daily_quota}
                                onChange={(event) =>
                                    form.setData(
                                        'daily_quota',
                                        event.target.value,
                                    )
                                }
                                placeholder="50"
                            />
                            <InputError message={form.errors.daily_quota} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Minimum Order</Label>
                            <Input
                                type="number"
                                min={1}
                                max={20}
                                value={form.data.min_order_quantity}
                                onChange={(event) =>
                                    form.setData(
                                        'min_order_quantity',
                                        event.target.value,
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
                                onChange={(event) =>
                                    form.setData(
                                        'max_order_quantity',
                                        event.target.value,
                                    )
                                }
                                placeholder="20"
                            />
                            <InputError
                                message={form.errors.max_order_quantity}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>Jenis Tiket</Label>
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
                                <option value="perorangan">Perorangan</option>
                                <option value="grup">Grup</option>
                            </select>
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
                                        Pilih tiket satuan dari destinasi yang
                                        sama. Paket punya harga dan kuota
                                        sendiri agar stok paket mudah dikontrol.
                                    </p>
                                </div>
                                {availablePackageTickets.length === 0 ? (
                                    <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                                        Belum ada tiket satuan untuk destinasi
                                        ini. Buat tiket satuan terlebih dahulu
                                        sebelum membuat paket.
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
                                                        {availablePackageTickets.map(
                                                            (ticket) => (
                                                                <option
                                                                    key={
                                                                        ticket.id
                                                                    }
                                                                    value={
                                                                        ticket.id
                                                                    }
                                                                >
                                                                    {
                                                                        ticket.name
                                                                    }{' '}
                                                                    - Rp{' '}
                                                                    {ticket.price.toLocaleString(
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
                                onChange={(event) =>
                                    form.setData(
                                        'valid_from',
                                        event.target.value,
                                    )
                                }
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>Berlaku Sampai</Label>
                            <Input
                                type="date"
                                value={form.data.valid_until}
                                onChange={(event) =>
                                    form.setData(
                                        'valid_until',
                                        event.target.value,
                                    )
                                }
                            />
                        </div>
                        <div className="grid gap-2 md:col-span-2">
                            <Label>Kebijakan Refund</Label>
                            <Input
                                value={form.data.refund_policy}
                                onChange={(event) =>
                                    form.setData(
                                        'refund_policy',
                                        event.target.value,
                                    )
                                }
                                placeholder="Contoh: refund H-1"
                            />
                        </div>
                        <div className="flex items-center gap-2 md:col-span-2">
                            <input
                                type="checkbox"
                                aria-label="Aktifkan tiket saat dibuat"
                                checked={form.data.is_active}
                                onChange={(event) =>
                                    form.setData(
                                        'is_active',
                                        event.target.checked,
                                    )
                                }
                            />
                            <span className="text-sm text-slate-700">
                                Aktifkan tiket saat dibuat
                            </span>
                        </div>
                        <label className="flex items-center gap-2 md:col-span-2">
                            <input
                                type="checkbox"
                                checked={form.data.is_closed}
                                onChange={(event) =>
                                    form.setData(
                                        'is_closed',
                                        event.target.checked,
                                    )
                                }
                            />
                            <span className="text-sm text-slate-700">
                                Tutup penjualan sementara
                            </span>
                        </label>
                        <div className="flex flex-col gap-2 sm:flex-row md:col-span-2">
                            <Button
                                type="submit"
                                className="bg-sky-600 text-white hover:bg-sky-700"
                            >
                                Simpan Tiket
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                className="border-slate-200 text-slate-700"
                                onClick={() =>
                                    router.visit('/admin/wisata/tickets')
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
