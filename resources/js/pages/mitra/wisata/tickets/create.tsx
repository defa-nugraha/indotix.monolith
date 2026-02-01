import { Head, router, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import InputError from '@/components/input-error';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Swal from 'sweetalert2';

type Ticket = {
    id: number;
    name: string;
    description: string | null;
    price: number;
    quota: number;
    daily_quota: number | null;
    ticket_type: string;
    valid_from: string | null;
    valid_until: string | null;
    refund_policy: string | null;
    is_active: boolean;
    is_closed: boolean;
};

type Props = {
    destination: { id: number; destination_name: string | null };
    ticket?: Ticket | null;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard Mitra', href: '/mitra/dashboard' },
    { title: 'Produk Tiket', href: '/mitra/wisata/tickets' },
    { title: 'Form Tiket', href: '/mitra/wisata/tickets/create' },
];

export default function MitraWisataTicketCreate({ destination, ticket }: Props) {
    const form = useForm({
        name: ticket?.name ?? '',
        description: ticket?.description ?? '',
        price: ticket?.price?.toString() ?? '',
        quota: ticket?.quota?.toString() ?? '',
        daily_quota: ticket?.daily_quota?.toString() ?? '',
        ticket_type: ticket?.ticket_type ?? 'perorangan',
        valid_from: ticket?.valid_from ?? '',
        valid_until: ticket?.valid_until ?? '',
        refund_policy: ticket?.refund_policy ?? '',
        is_active: ticket?.is_active ?? false,
        is_closed: ticket?.is_closed ?? false,
    });

    const handleSubmit = () => {
        form.transform((data) => ({
            ...data,
            price: Number(data.price || 0),
            quota: Number(data.quota || 0),
            daily_quota: data.daily_quota ? Number(data.daily_quota) : null,
        }));

        if (ticket?.id) {
            form.put(`/mitra/wisata/tickets/${ticket.id}`, {
                onSuccess: () =>
                    Swal.fire({ icon: 'success', title: 'Tersimpan', text: 'Tiket diperbarui.' }).then(() => {
                        router.visit('/mitra/wisata/tickets');
                    }),
                onError: () =>
                    Swal.fire({ icon: 'error', title: 'Gagal', text: 'Tidak dapat menyimpan tiket.' }),
            });
            return;
        }

        form.post('/mitra/wisata/tickets', {
            onSuccess: () =>
                Swal.fire({ icon: 'success', title: 'Tersimpan', text: 'Tiket dibuat.' }).then(() => {
                    router.visit('/mitra/wisata/tickets');
                }),
            onError: () =>
                Swal.fire({ icon: 'error', title: 'Gagal', text: 'Tidak dapat membuat tiket.' }),
        });
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
                            <Label>Nama Tiket</Label>
                            <Input value={form.data.name} onChange={(e) => form.setData('name', e.target.value)} />
                            <InputError message={form.errors.name} />
                        </div>
                        <div className="grid gap-2 md:col-span-2">
                            <Label>Deskripsi</Label>
                            <textarea
                                className="min-h-[100px] rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                value={form.data.description}
                                onChange={(e) => form.setData('description', e.target.value)}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>Harga (Rp)</Label>
                            <Input
                                type="number"
                                min={0}
                                value={form.data.price}
                                onChange={(e) => form.setData('price', e.target.value)}
                            />
                            <InputError message={form.errors.price} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Kuota Total</Label>
                            <Input
                                type="number"
                                min={0}
                                value={form.data.quota}
                                onChange={(e) => form.setData('quota', e.target.value)}
                            />
                            <InputError message={form.errors.quota} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Kuota Harian (opsional)</Label>
                            <Input
                                type="number"
                                min={0}
                                value={form.data.daily_quota}
                                onChange={(e) => form.setData('daily_quota', e.target.value)}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>Jenis Tiket</Label>
                            <Select value={form.data.ticket_type} onValueChange={(value) => form.setData('ticket_type', value)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih jenis" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="perorangan">Perorangan</SelectItem>
                                    <SelectItem value="grup">Grup</SelectItem>
                                </SelectContent>
                            </Select>
                            <InputError message={form.errors.ticket_type} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Berlaku Dari</Label>
                            <Input
                                type="date"
                                value={form.data.valid_from}
                                onChange={(e) => form.setData('valid_from', e.target.value)}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>Berlaku Sampai</Label>
                            <Input
                                type="date"
                                value={form.data.valid_until}
                                onChange={(e) => form.setData('valid_until', e.target.value)}
                            />
                        </div>
                        <div className="grid gap-2 md:col-span-2">
                            <Label>Kebijakan Refund</Label>
                            <Input
                                value={form.data.refund_policy}
                                onChange={(e) => form.setData('refund_policy', e.target.value)}
                                placeholder="Contoh: Refund H-1, manual review"
                            />
                        </div>
                        <div className="flex items-center gap-3 md:col-span-2">
                            <label className="flex items-center gap-2 text-sm text-slate-600">
                                <input
                                    type="checkbox"
                                    checked={form.data.is_active}
                                    onChange={(e) => form.setData('is_active', e.target.checked)}
                                />
                                Aktifkan tiket
                            </label>
                            <label className="flex items-center gap-2 text-sm text-slate-600">
                                <input
                                    type="checkbox"
                                    checked={form.data.is_closed}
                                    onChange={(e) => form.setData('is_closed', e.target.checked)}
                                />
                                Tutup penjualan sementara
                            </label>
                        </div>
                        <div className="md:col-span-2 flex gap-2">
                            <Button type="submit" className="bg-sky-600 text-white hover:bg-sky-700">
                                Simpan
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                className="border-slate-200 text-slate-700"
                                onClick={() => router.visit('/mitra/wisata/tickets')}
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
