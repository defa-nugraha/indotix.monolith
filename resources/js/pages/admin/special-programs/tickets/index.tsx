import { Head, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import InputError from '@/components/input-error';
import Swal from 'sweetalert2';
import { formatCurrencyInput, parseCurrencyToDigits } from '@/lib/currency';

type Ticket = {
    id: number;
    name: string;
    price: number | null;
    capacity: number | null;
    sort_order: number;
    program?: { name?: string | null };
};

type Props = {
    tickets: { data: Ticket[] };
    programs: Array<{ id: number; name: string }>;
    filters: { program_id?: number | null };
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Special Program', href: '/admin/special-programs' },
    { title: 'Produk Tiket', href: '/admin/special-programs/tickets' },
];

export default function SpecialProgramTicketsIndex({
    tickets,
    programs,
    filters,
}: Props) {
    const emptyForm = {
        program_id: '',
        name: '',
        price: '',
        quota: '',
        sort_order: '0',
    };
    const form = useForm({ ...emptyForm });
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [priceDisplay, setPriceDisplay] = useState('');

    const openCreate = () => {
        form.setData({ ...emptyForm });
        form.clearErrors();
        setPriceDisplay('');
        setIsFormOpen(true);
    };

    const handlePriceChange = (value: string) => {
        setPriceDisplay(formatCurrencyInput(value));
        form.setData('price', parseCurrencyToDigits(value));
    };

    const submit = () => {
        form.transform((data) => ({
            ...data,
            program_id: Number(data.program_id),
            price: Number(data.price || 0),
            quota: data.quota === '' ? null : Number(data.quota),
            sort_order: Number(data.sort_order || 0),
        }));

        form.post('/admin/special-programs/tickets', {
            onSuccess: () => {
                Swal.fire({
                    icon: 'success',
                    title: 'Tersimpan',
                    text: 'Tiket special program berhasil dibuat.',
                });
                setIsFormOpen(false);
            },
            onError: () =>
                Swal.fire({
                    icon: 'error',
                    title: 'Gagal',
                    text: 'Periksa kembali data tiket.',
                }),
        });
    };

    const updateTicket = (event: React.FormEvent<HTMLFormElement>, id: number) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        router.put(`/admin/special-programs/tickets/${id}`, Object.fromEntries(data.entries()), {
            preserveScroll: true,
        });
    };

    const deleteTicket = async (ticket: Ticket) => {
        const result = await Swal.fire({
            title: 'Hapus tiket?',
            text: `Tiket ${ticket.name} akan dihapus dari program.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Hapus',
            cancelButtonText: 'Batal',
        });

        if (!result.isConfirmed) return;

        router.delete(`/admin/special-programs/tickets/${ticket.id}`, {
            preserveScroll: true,
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Produk Tiket Special Program" />
            <div className="flex flex-1 flex-col gap-6 bg-[#f6fbff] px-6 py-8">
                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-semibold text-slate-900">
                                Produk Tiket Special Program
                            </h1>
                            <p className="text-sm text-slate-500">
                                Kelola pilihan tiket/paket, harga, kuota, dan urutan tampil.
                            </p>
                        </div>
                        <Button type="button" variant="outline" onClick={openCreate}>
                            Buat Tiket
                        </Button>
                    </div>
                    <form
                        className="mt-6 flex flex-wrap gap-3"
                        onSubmit={(event) => {
                            event.preventDefault();
                            const data = new FormData(event.currentTarget);
                            router.get('/admin/special-programs/tickets', Object.fromEntries(data.entries()), {
                                preserveState: true,
                            });
                        }}
                    >
                        <select
                            name="program_id"
                            defaultValue={filters.program_id ?? ''}
                            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                        >
                            <option value="">Semua program</option>
                            {programs.map((item) => (
                                <option key={item.id} value={item.id}>
                                    {item.name}
                                </option>
                            ))}
                        </select>
                        <Button type="submit" className="bg-sky-600 text-white hover:bg-sky-700">
                            Filter
                        </Button>
                    </form>
                </section>

                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <div className="overflow-hidden rounded-2xl border border-slate-100">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                                <tr>
                                    <th className="px-4 py-3 text-left">Tiket</th>
                                    <th className="px-4 py-3 text-left">Special Program</th>
                                    <th className="px-4 py-3 text-left">Harga</th>
                                    <th className="px-4 py-3 text-left">Kuota</th>
                                    <th className="px-4 py-3 text-left">Urutan</th>
                                    <th className="px-4 py-3 text-left">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tickets.data.map((ticket) => (
                                    <tr key={ticket.id} className="border-t border-slate-100">
                                        <td className="px-4 py-3 font-semibold text-slate-900">{ticket.name}</td>
                                        <td className="px-4 py-3">{ticket.program?.name ?? '-'}</td>
                                        <td className="px-4 py-3">
                                            Rp {(ticket.price ?? 0).toLocaleString('id-ID')}
                                        </td>
                                        <td className="px-4 py-3">{ticket.capacity ?? '-'}</td>
                                        <td className="px-4 py-3">{ticket.sort_order ?? 0}</td>
                                        <td className="px-4 py-3">
                                            <form
                                                onSubmit={(event) => updateTicket(event, ticket.id)}
                                                className="flex flex-wrap items-center gap-2"
                                            >
                                                <input
                                                    name="name"
                                                    defaultValue={ticket.name}
                                                    className="w-40 rounded-md border border-slate-200 px-2 py-1 text-xs"
                                                />
                                                <input
                                                    name="price"
                                                    type="number"
                                                    min={0}
                                                    defaultValue={ticket.price ?? 0}
                                                    className="w-28 rounded-md border border-slate-200 px-2 py-1 text-xs"
                                                />
                                                <input
                                                    name="quota"
                                                    type="number"
                                                    min={0}
                                                    defaultValue={ticket.capacity ?? ''}
                                                    className="w-24 rounded-md border border-slate-200 px-2 py-1 text-xs"
                                                />
                                                <input
                                                    name="sort_order"
                                                    type="number"
                                                    min={0}
                                                    defaultValue={ticket.sort_order ?? 0}
                                                    className="w-20 rounded-md border border-slate-200 px-2 py-1 text-xs"
                                                />
                                                <Button type="submit" variant="outline" className="h-7 px-3 text-xs">
                                                    Simpan
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    className="h-7 px-3 text-xs text-rose-600"
                                                    onClick={() => deleteTicket(ticket)}
                                                >
                                                    Hapus
                                                </Button>
                                            </form>
                                        </td>
                                    </tr>
                                ))}
                                {tickets.data.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-500">
                                            Belum ada tiket special program.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>

                <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                    <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Buat Tiket Special Program</DialogTitle>
                            <DialogDescription>
                                Tiket akan tampil sebagai pilihan paket pada halaman detail special program.
                            </DialogDescription>
                        </DialogHeader>
                        <form
                            className="grid gap-3"
                            onSubmit={(event) => {
                                event.preventDefault();
                                submit();
                            }}
                        >
                            <div className="grid gap-1">
                                <Label>Special Program</Label>
                                <select
                                    value={form.data.program_id}
                                    onChange={(event) => form.setData('program_id', event.target.value)}
                                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                >
                                    <option value="">Pilih special program</option>
                                    {programs.map((item) => (
                                        <option key={item.id} value={item.id}>
                                            {item.name}
                                        </option>
                                    ))}
                                </select>
                                <InputError message={form.errors.program_id} />
                            </div>
                            <div className="grid gap-1">
                                <Label>Nama tiket/paket</Label>
                                <input
                                    value={form.data.name}
                                    onChange={(event) => form.setData('name', event.target.value)}
                                    placeholder="Contoh: Paket Reguler"
                                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                />
                                <InputError message={form.errors.name} />
                            </div>
                            <div className="grid gap-1">
                                <Label>Harga (Rp)</Label>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    value={priceDisplay}
                                    onChange={(event) => handlePriceChange(event.target.value)}
                                    placeholder="10.000"
                                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                />
                                <InputError message={form.errors.price} />
                            </div>
                            <div className="grid gap-1">
                                <Label>Kuota</Label>
                                <input
                                    type="number"
                                    min={0}
                                    value={form.data.quota}
                                    onChange={(event) => form.setData('quota', event.target.value)}
                                    placeholder="Kosongkan jika mengikuti kuota program"
                                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                />
                                <InputError message={form.errors.quota} />
                            </div>
                            <div className="grid gap-1">
                                <Label>Urutan tampil</Label>
                                <input
                                    type="number"
                                    min={0}
                                    value={form.data.sort_order}
                                    onChange={(event) => form.setData('sort_order', event.target.value)}
                                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                />
                                <InputError message={form.errors.sort_order} />
                            </div>
                            <DialogFooter className="gap-2">
                                <Button type="submit" className="bg-sky-600 text-white hover:bg-sky-700">
                                    Simpan
                                </Button>
                                <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
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
