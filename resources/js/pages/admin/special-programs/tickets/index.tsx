import { Head, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
    price: number;
    is_active: boolean;
    max_per_user: number;
    quota: number;
    event?: { title?: string | null };
};

type Props = {
    tickets: { data: Ticket[] };
    events: Array<{ id: number; title: string }>;
    filters: { event_id?: number | null };
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Special Program', href: '/admin/special-programs' },
    { title: 'Produk Tiket', href: '/admin/special-programs/tickets' },
];

export default function EventTicketsIndex({ tickets, events, filters }: Props) {
    const emptyForm = {
        event_id: '',
        name: '',
        description: '',
        price: '',
        quota: '',
        max_per_user: 1,
        is_active: true,
    };
    const form = useForm({ ...emptyForm });
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [priceDisplay, setPriceDisplay] = useState('');

    const openCreate = () => {
        form.setData({ ...emptyForm });
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
            event_id: Number(data.event_id),
            price: Number(data.price || 0),
            quota: data.quota === '' ? null : Number(data.quota),
            max_per_user: Number(data.max_per_user || 1),
            is_active: Boolean(data.is_active),
        }));

        form.post('/admin/special-programs/tickets', {
            onSuccess: () => {
                Swal.fire({ icon: 'success', title: 'Tersimpan', text: 'Tiket special program dibuat.' });
                setIsFormOpen(false);
            },
            onError: () =>
                Swal.fire({
                    icon: 'error',
                    title: 'Gagal',
                    text: 'Periksa data tiket.',
                }),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Produk Tiket Special Program" />
            <div className="flex flex-1 flex-col gap-6 bg-[#f6fbff] px-6 py-8">
                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <h1 className="text-2xl font-semibold text-slate-900">Produk Tiket Special Program</h1>
                    <p className="text-sm text-slate-500">Aktif/nonaktif dan batas pembelian per user.</p>
                    <form
                        className="mt-6 flex flex-wrap gap-3"
                        onSubmit={(event) => {
                            event.preventDefault();
                            const data = new FormData(event.currentTarget);
                            router.get('/admin/special-programs/tickets', Object.fromEntries(data.entries()), { preserveState: true });
                        }}
                    >
                        <select name="event_id" defaultValue={filters.event_id ?? ''} className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
                            <option value="">Semua program</option>
                            {events.map((item) => (
                                <option key={item.id} value={item.id}>
                                    {item.title}
                                </option>
                            ))}
                        </select>
                        <Button type="submit" className="bg-sky-600 text-white hover:bg-sky-700">
                            Filter
                        </Button>
                        <Button type="button" variant="outline" onClick={openCreate}>
                            Buat Tiket
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
                                    <th className="px-4 py-3 text-left">Max/User</th>
                                    <th className="px-4 py-3 text-left">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tickets.data.map((ticket) => (
                                    <tr key={ticket.id} className="border-t border-slate-100">
                                        <td className="px-4 py-3 font-semibold text-slate-900">{ticket.name}</td>
                                        <td className="px-4 py-3">{ticket.event?.title ?? '-'}</td>
                                        <td className="px-4 py-3">
                                            {(() => {
                                                const priceValue = Number(ticket.price ?? 0);
                                                return `Rp ${Number.isFinite(priceValue) ? priceValue.toLocaleString('id-ID') : '0'}`;
                                            })()}
                                        </td>
                                        <td className="px-4 py-3">
                                            <form
                                                onSubmit={(e) => {
                                                    e.preventDefault();
                                                    const data = new FormData(e.currentTarget);
                                                    router.post(`/admin/special-programs/tickets/${ticket.id}`, Object.fromEntries(data.entries()), { preserveScroll: true });
                                                }}
                                                className="flex items-center gap-2"
                                            >
                                                <input
                                                    name="max_per_user"
                                                    defaultValue={ticket.max_per_user}
                                                    className="w-20 rounded-md border border-slate-200 px-2 py-1 text-xs"
                                                />
                                                <input name="quota" defaultValue={ticket.quota} className="w-20 rounded-md border border-slate-200 px-2 py-1 text-xs" />
                                                <select name="is_active" defaultValue={ticket.is_active ? '1' : '0'} className="rounded-md border border-slate-200 px-2 py-1 text-xs">
                                                    <option value="1">Aktif</option>
                                                    <option value="0">Nonaktif</option>
                                                </select>
                                                <Button type="submit" variant="outline" className="h-7 px-3 text-xs">
                                                    Simpan
                                                </Button>
                                            </form>
                                        </td>
                                        <td className="px-4 py-3">
                                            <Badge className={ticket.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}>
                                                {ticket.is_active ? 'Aktif' : 'Nonaktif'}
                                            </Badge>
                                        </td>
                                    </tr>
                                ))}
                                {tickets.data.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-500">
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
                            <DialogDescription>Lengkapi data tiket sebelum disimpan.</DialogDescription>
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
                                    value={form.data.event_id}
                                    onChange={(event) => form.setData('event_id', event.target.value)}
                                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                >
                                    <option value="">Pilih special program</option>
                                    {events.map((item) => (
                                        <option key={item.id} value={item.id}>
                                            {item.title}
                                        </option>
                                    ))}
                                </select>
                                <InputError message={form.errors.event_id} />
                            </div>
                            <div className="grid gap-1">
                                <Label>Nama tiket</Label>
                                <input
                                    value={form.data.name}
                                    onChange={(event) => form.setData('name', event.target.value)}
                                    placeholder="Nama tiket"
                                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                />
                                <InputError message={form.errors.name} />
                            </div>
                            <div className="grid gap-1">
                                <Label>Deskripsi</Label>
                                <textarea
                                    value={form.data.description}
                                    onChange={(event) => form.setData('description', event.target.value)}
                                    placeholder="Deskripsi tiket (opsional)"
                                    rows={3}
                                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                />
                                <InputError message={form.errors.description} />
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
                                    placeholder="Kuota"
                                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                />
                                <InputError message={form.errors.quota} />
                            </div>
                            <div className="grid gap-1">
                                <Label>Maks per user</Label>
                                <input
                                    type="number"
                                    min={1}
                                    value={form.data.max_per_user}
                                    onChange={(event) => form.setData('max_per_user', event.target.value)}
                                    placeholder="Maks per user"
                                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                />
                                <InputError message={form.errors.max_per_user} />
                            </div>
                            <div className="grid gap-1">
                                <Label>Status tiket</Label>
                                <select
                                    value={form.data.is_active ? '1' : '0'}
                                    onChange={(event) => form.setData('is_active', event.target.value === '1')}
                                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                >
                                    <option value="1">Aktif</option>
                                    <option value="0">Nonaktif</option>
                                </select>
                                <InputError message={form.errors.is_active} />
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
