import { Head, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import InputError from '@/components/input-error';
import Swal from 'sweetalert2';
import { formatCurrencyInput, parseCurrencyToDigits } from '@/lib/currency';

type TicketForm = {
    event_id: number | string;
    name: string;
    description: string;
    price: number | string;
    quota: number | string;
    max_per_user: number | string;
    benefits_text: string;
    is_active: boolean;
};

type Props = {
    organizer: { id: number; name?: string | null };
    ticket: {
        id: number;
        event_id: number;
        name: string;
        description?: string | null;
        price: number;
        quota: number | null;
        max_per_user: number;
        benefits?: string[];
        is_active: boolean;
    } | null;
    events: Array<{ id: number; title: string }>;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard Mitra', href: '/mitra/dashboard' },
    { title: 'Produk Tiket', href: '/mitra/events/tickets' },
    { title: 'Form Tiket', href: '#' },
];

export default function MitraEventTicketCreate({ ticket, events }: Props) {
    const form = useForm<TicketForm>({
        event_id: ticket?.event_id ?? '',
        name: ticket?.name ?? '',
        description: ticket?.description ?? '',
        price: ticket?.price ?? '',
        quota: ticket?.quota ?? '',
        max_per_user: ticket?.max_per_user ?? 1,
        benefits_text: ticket?.benefits?.join(', ') ?? '',
        is_active: ticket?.is_active ?? true,
    });
    const [priceDisplay, setPriceDisplay] = useState(formatCurrencyInput(ticket?.price ?? ''));

    const handlePriceChange = (value: string) => {
        setPriceDisplay(formatCurrencyInput(value));
        form.setData('price', parseCurrencyToDigits(value));
    };

    const submit = () => {
        const payload = {
            event_id: Number(form.data.event_id),
            name: form.data.name,
            description: form.data.description,
            price: Number(form.data.price || 0),
            quota: form.data.quota === '' ? null : Number(form.data.quota),
            max_per_user: Number(form.data.max_per_user || 1),
            benefits: form.data.benefits_text
                .split(',')
                .map((item) => item.trim())
                .filter(Boolean),
            is_active: form.data.is_active,
        };

        if (ticket?.id) {
            router.put(`/mitra/events/tickets/${ticket.id}`, payload, {
                onSuccess: () => Swal.fire({ icon: 'success', title: 'Tersimpan', text: 'Tiket diperbarui.' }),
                onError: () => Swal.fire({ icon: 'error', title: 'Gagal', text: 'Periksa data form.' }),
            });
            return;
        }

        form.post('/mitra/events/tickets', {
            onSuccess: () => Swal.fire({ icon: 'success', title: 'Tersimpan', text: 'Tiket dibuat.' }),
            onError: () => Swal.fire({ icon: 'error', title: 'Gagal', text: 'Periksa data form.' }),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Form Tiket Event" />
            <div className="flex flex-1 flex-col gap-6 bg-[#f6fbff] px-6 py-8">
                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <h1 className="text-2xl font-semibold text-slate-900">
                        {ticket ? 'Edit Tiket' : 'Buat Tiket Baru'}
                    </h1>
                    <form
                        className="mt-6 grid gap-4 md:grid-cols-2"
                        onSubmit={(e) => {
                            e.preventDefault();
                            submit();
                        }}
                    >
                        <div>
                            <label className="text-xs font-semibold uppercase text-slate-500">Event</label>
                            <select
                                value={form.data.event_id}
                                onChange={(e) => form.setData('event_id', e.target.value)}
                                className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                            >
                                <option value="">Pilih event</option>
                                {events.map((event) => (
                                    <option key={event.id} value={event.id}>
                                        {event.title}
                                    </option>
                                ))}
                            </select>
                            <InputError message={form.errors.event_id} />
                        </div>
                        <div>
                            <label className="text-xs font-semibold uppercase text-slate-500">Nama Tiket</label>
                            <input
                                value={form.data.name}
                                onChange={(e) => form.setData('name', e.target.value)}
                                className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                            />
                            <InputError message={form.errors.name} />
                        </div>
                        <div className="md:col-span-2">
                            <label className="text-xs font-semibold uppercase text-slate-500">Deskripsi</label>
                            <textarea
                                value={form.data.description}
                                onChange={(e) => form.setData('description', e.target.value)}
                                className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                rows={3}
                            />
                        </div>
                        <div>
                            <label className="text-xs font-semibold uppercase text-slate-500">Harga</label>
                            <input
                                type="text"
                                inputMode="numeric"
                                value={priceDisplay}
                                onChange={(e) => handlePriceChange(e.target.value)}
                                className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                placeholder="10.000"
                            />
                            <InputError message={form.errors.price} />
                        </div>
                        <div>
                            <label className="text-xs font-semibold uppercase text-slate-500">Kuota</label>
                            <input
                                type="number"
                                min={0}
                                value={form.data.quota}
                                onChange={(e) => form.setData('quota', e.target.value)}
                                className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-semibold uppercase text-slate-500">Maks per User</label>
                            <input
                                type="number"
                                min={1}
                                value={form.data.max_per_user}
                                onChange={(e) => form.setData('max_per_user', e.target.value)}
                                className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-semibold uppercase text-slate-500">Status</label>
                            <select
                                value={form.data.is_active ? '1' : '0'}
                                onChange={(e) => form.setData('is_active', e.target.value === '1')}
                                className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                            >
                                <option value="1">Aktif</option>
                                <option value="0">Nonaktif</option>
                            </select>
                        </div>
                        <div className="md:col-span-2">
                            <label className="text-xs font-semibold uppercase text-slate-500">Benefit Tiket</label>
                            <input
                                value={form.data.benefits_text}
                                onChange={(e) => form.setData('benefits_text', e.target.value)}
                                className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                placeholder="Contoh: Retail Shop, Free drink"
                            />
                        </div>
                        <div className="md:col-span-2 flex justify-end">
                            <Button type="submit" className="bg-sky-600 text-white hover:bg-sky-700">
                                Simpan Tiket
                            </Button>
                        </div>
                    </form>
                </section>
            </div>
        </AppLayout>
    );
}
