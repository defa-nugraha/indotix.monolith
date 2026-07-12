import { Head, Link, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import Swal from 'sweetalert2';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { formatCurrencyInput, parseCurrencyToDigits } from '@/lib/currency';
import type { BreadcrumbItem } from '@/types';

type EventOption = {
    id: number;
    title: string;
    start_at?: string | null;
    status?: string | null;
};

type Props = {
    events: EventOption[];
    canCreateEvent: boolean;
    ticket: {
        id: number;
        event_id: number;
        name: string;
        description?: string | null;
        price: number;
        quota: number;
        max_per_user: number;
        benefits?: string[];
        is_active: boolean;
    } | null;
};

type TicketForm = {
    event_id: string;
    name: string;
    description: string;
    price: string;
    quota: string;
    max_per_user: string;
    benefits_text: string;
    is_active: boolean;
};

const eventLabel = (event: EventOption) => {
    if (!event.start_at) {
        return event.title;
    }

    return `${event.title} — ${new Date(event.start_at).toLocaleDateString('id-ID')}`;
};

export default function AdminEventTicketCreate({
    events,
    canCreateEvent,
    ticket,
}: Props) {
    const form = useForm<TicketForm>({
        event_id: ticket?.event_id.toString() ?? events[0]?.id.toString() ?? '',
        name: ticket?.name ?? '',
        description: ticket?.description ?? '',
        price: ticket?.price.toString() ?? '',
        quota: ticket?.quota.toString() ?? '',
        max_per_user: ticket?.max_per_user.toString() ?? '1',
        benefits_text: ticket?.benefits?.join(', ') ?? '',
        is_active: ticket?.is_active ?? true,
    });
    const [priceDisplay, setPriceDisplay] = useState(
        formatCurrencyInput(ticket?.price ?? ''),
    );
    const [isSubmitting, setIsSubmitting] = useState(false);

    const submit = () => {
        const payload = {
            event_id: Number(form.data.event_id),
            name: form.data.name,
            description: form.data.description,
            price: Number(form.data.price || 0),
            quota: Number(form.data.quota || 0),
            max_per_user: Number(form.data.max_per_user || 1),
            benefits: form.data.benefits_text
                .split(',')
                .map((item) => item.trim())
                .filter(Boolean),
            is_active: form.data.is_active,
        };
        const options = {
            onStart: () => setIsSubmitting(true),
            onFinish: () => setIsSubmitting(false),
            onError: (errors: Record<string, string>) => {
                form.setError(errors);
                Swal.fire({
                    icon: 'error',
                    title: `Gagal ${ticket ? 'memperbarui' : 'membuat'} tiket`,
                    text: 'Periksa kembali data yang diisi.',
                });
            },
            onSuccess: () => {
                Swal.fire({
                    icon: 'success',
                    title: `Tiket berhasil ${ticket ? 'diperbarui' : 'dibuat'}`,
                    timer: 1600,
                    showConfirmButton: false,
                });
            },
        };

        if (ticket) {
            router.put(`/admin/events/tickets/${ticket.id}`, payload, options);
            return;
        }

        router.post('/admin/events/tickets', payload, options);
    };

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Event', href: '/admin/events' },
        { title: 'Produk Tiket', href: '/admin/events/tickets' },
        {
            title: ticket ? 'Edit Tiket' : 'Tambah Tiket',
            href: ticket
                ? `/admin/events/tickets/${ticket.id}/edit`
                : '/admin/events/tickets/create',
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={ticket ? 'Edit Tiket Event' : 'Tambah Tiket Event'} />
            <div className="flex flex-1 flex-col gap-6 bg-[#f6fbff] px-6 py-8">
                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <h1 className="text-2xl font-semibold text-slate-900">
                        {ticket
                            ? 'Edit Produk Tiket Event'
                            : 'Tambah Produk Tiket Event'}
                    </h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Pilih event, lalu tentukan harga, kuota, dan benefit
                        tiket.
                    </p>

                    {events.length === 0 ? (
                        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
                            <p>Belum ada event yang dapat diberi tiket.</p>
                            {canCreateEvent && (
                                <Button
                                    asChild
                                    variant="outline"
                                    className="mt-4 border-amber-300 bg-white"
                                >
                                    <Link href="/admin/events/create">
                                        Buat Event Terlebih Dahulu
                                    </Link>
                                </Button>
                            )}
                        </div>
                    ) : (
                        <form
                            className="mt-6 grid gap-4 md:grid-cols-2"
                            onSubmit={(event) => {
                                event.preventDefault();
                                submit();
                            }}
                        >
                            <div className="grid gap-2 md:col-span-2">
                                <Label>Event</Label>
                                <select
                                    value={form.data.event_id}
                                    onChange={(event) =>
                                        form.setData(
                                            'event_id',
                                            event.target.value,
                                        )
                                    }
                                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                    required
                                >
                                    <option value="">Pilih event</option>
                                    {events.map((event) => (
                                        <option key={event.id} value={event.id}>
                                            {eventLabel(event)}
                                        </option>
                                    ))}
                                </select>
                                <InputError message={form.errors.event_id} />
                            </div>

                            <div className="grid gap-2 md:col-span-2">
                                <Label>Nama Tiket</Label>
                                <Input
                                    value={form.data.name}
                                    onChange={(event) =>
                                        form.setData('name', event.target.value)
                                    }
                                    placeholder="Contoh: Presale 1, Reguler, VIP"
                                    required
                                />
                                <InputError message={form.errors.name} />
                            </div>

                            <div className="grid gap-2 md:col-span-2">
                                <Label>Deskripsi</Label>
                                <textarea
                                    value={form.data.description}
                                    onChange={(event) =>
                                        form.setData(
                                            'description',
                                            event.target.value,
                                        )
                                    }
                                    className="min-h-28 rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                    placeholder="Informasi singkat mengenai tiket"
                                />
                                <InputError message={form.errors.description} />
                            </div>

                            <div className="grid gap-2">
                                <Label>Harga (Rp)</Label>
                                <Input
                                    type="text"
                                    inputMode="numeric"
                                    value={priceDisplay}
                                    onChange={(event) => {
                                        setPriceDisplay(
                                            formatCurrencyInput(
                                                event.target.value,
                                            ),
                                        );
                                        form.setData(
                                            'price',
                                            parseCurrencyToDigits(
                                                event.target.value,
                                            ),
                                        );
                                    }}
                                    placeholder="150.000"
                                    required
                                />
                                <InputError message={form.errors.price} />
                            </div>

                            <div className="grid gap-2">
                                <Label>Kuota</Label>
                                <Input
                                    type="number"
                                    min={0}
                                    value={form.data.quota}
                                    onChange={(event) =>
                                        form.setData(
                                            'quota',
                                            event.target.value,
                                        )
                                    }
                                    placeholder="100"
                                    required
                                />
                                <InputError message={form.errors.quota} />
                            </div>

                            <div className="grid gap-2">
                                <Label>Maksimal per User</Label>
                                <Input
                                    type="number"
                                    min={1}
                                    value={form.data.max_per_user}
                                    onChange={(event) =>
                                        form.setData(
                                            'max_per_user',
                                            event.target.value,
                                        )
                                    }
                                    required
                                />
                                <InputError
                                    message={form.errors.max_per_user}
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label>Status Awal</Label>
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
                                <InputError message={form.errors.is_active} />
                            </div>

                            <div className="grid gap-2 md:col-span-2">
                                <Label>Benefit Tiket</Label>
                                <Input
                                    value={form.data.benefits_text}
                                    onChange={(event) =>
                                        form.setData(
                                            'benefits_text',
                                            event.target.value,
                                        )
                                    }
                                    placeholder="Pisahkan dengan koma, contoh: Free drink, Merchandise"
                                />
                                <InputError
                                    message={
                                        (form.errors as Record<string, string>)
                                            .benefits
                                    }
                                />
                            </div>

                            <div className="flex flex-wrap gap-2 md:col-span-2">
                                <Button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="bg-sky-600 text-white hover:bg-sky-700"
                                >
                                    {isSubmitting
                                        ? 'Menyimpan...'
                                        : ticket
                                          ? 'Simpan Perubahan'
                                          : 'Simpan Tiket'}
                                </Button>
                                <Button asChild type="button" variant="outline">
                                    <Link href="/admin/events/tickets">
                                        Batal
                                    </Link>
                                </Button>
                            </div>
                        </form>
                    )}
                </section>
            </div>
        </AppLayout>
    );
}
