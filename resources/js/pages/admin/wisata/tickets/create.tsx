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

type Props = {
    destinations: Option[];
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Wisata', href: '/admin/wisata/destinations' },
    { title: 'Produk Tiket', href: '/admin/wisata/tickets' },
    { title: 'Tambah Tiket', href: '#' },
];

export default function AdminWisataTicketCreate({ destinations }: Props) {
    const form = useForm({
        mitra_wisata_onboarding_id: destinations[0]?.id?.toString() ?? '',
        name: '',
        description: '',
        price: '',
        quota: '',
        daily_quota: '',
        ticket_type: 'perorangan',
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

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Tambah Tiket Wisata" />
            <div className="flex flex-1 flex-col gap-6 bg-[#f6fbff] px-6 py-8">
                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <h1 className="text-2xl font-semibold text-slate-900">Tambah Produk Tiket</h1>
                    <p className="text-sm text-slate-500">Buat tiket wisata untuk destinasi terverifikasi.</p>

                    <form
                        className="mt-6 grid gap-4 md:grid-cols-2"
                        onSubmit={(event) => {
                            event.preventDefault();
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
                            <Label>Destinasi Wisata</Label>
                            <select
                                value={form.data.mitra_wisata_onboarding_id}
                                onChange={(event) =>
                                    form.setData('mitra_wisata_onboarding_id', event.target.value)
                                }
                                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                            >
                                <option value="">Pilih destinasi</option>
                                {destinations.map((item) => (
                                    <option key={item.id} value={item.id}>
                                        {item.label}
                                    </option>
                                ))}
                            </select>
                            <InputError message={form.errors.mitra_wisata_onboarding_id} />
                        </div>
                        <div className="grid gap-2 md:col-span-2">
                            <Label>Nama Tiket</Label>
                            <Input
                                value={form.data.name}
                                onChange={(event) => form.setData('name', event.target.value)}
                                placeholder="Contoh: Tiket Reguler"
                            />
                            <InputError message={form.errors.name} />
                        </div>
                        <div className="grid gap-2 md:col-span-2">
                            <Label>Deskripsi</Label>
                            <textarea
                                className="min-h-[120px] rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                value={form.data.description}
                                onChange={(event) => form.setData('description', event.target.value)}
                                placeholder="Deskripsi singkat produk tiket"
                            />
                            <InputError message={form.errors.description} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Harga (Rp)</Label>
                            <Input
                                type="text"
                                inputMode="numeric"
                                value={priceDisplay}
                                onChange={(event) => handlePriceChange(event.target.value)}
                                placeholder="10.000"
                            />
                            <InputError message={form.errors.price} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Kuota</Label>
                            <Input
                                type="number"
                                min={0}
                                value={form.data.quota}
                                onChange={(event) => form.setData('quota', event.target.value)}
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
                                onChange={(event) => form.setData('daily_quota', event.target.value)}
                                placeholder="50"
                            />
                            <InputError message={form.errors.daily_quota} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Jenis Tiket</Label>
                            <select
                                value={form.data.ticket_type}
                                onChange={(event) => form.setData('ticket_type', event.target.value)}
                                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                            >
                                <option value="perorangan">Perorangan</option>
                                <option value="grup">Grup</option>
                            </select>
                        </div>
                        <div className="grid gap-2">
                            <Label>Berlaku Dari</Label>
                            <Input
                                type="date"
                                value={form.data.valid_from}
                                onChange={(event) => form.setData('valid_from', event.target.value)}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>Berlaku Sampai</Label>
                            <Input
                                type="date"
                                value={form.data.valid_until}
                                onChange={(event) => form.setData('valid_until', event.target.value)}
                            />
                        </div>
                        <div className="grid gap-2 md:col-span-2">
                            <Label>Kebijakan Refund</Label>
                            <Input
                                value={form.data.refund_policy}
                                onChange={(event) => form.setData('refund_policy', event.target.value)}
                                placeholder="Contoh: refund H-1"
                            />
                        </div>
                        <div className="flex items-center gap-2 md:col-span-2">
                            <input
                                type="checkbox"
                                checked={form.data.is_active}
                                onChange={(event) => form.setData('is_active', event.target.checked)}
                            />
                            <span className="text-sm text-slate-700">Aktifkan tiket saat dibuat</span>
                        </div>
                        <label className="flex items-center gap-2 md:col-span-2">
                            <input
                                type="checkbox"
                                checked={form.data.is_closed}
                                onChange={(event) => form.setData('is_closed', event.target.checked)}
                            />
                            <span className="text-sm text-slate-700">Tutup penjualan sementara</span>
                        </label>
                        <div className="md:col-span-2 flex gap-2">
                            <Button type="submit" className="bg-sky-600 text-white hover:bg-sky-700">
                                Simpan Tiket
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                className="border-slate-200 text-slate-700"
                                onClick={() => router.visit('/admin/wisata/tickets')}
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
