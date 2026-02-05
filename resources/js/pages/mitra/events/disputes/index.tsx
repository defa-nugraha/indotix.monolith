import { Head, router, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import InputError from '@/components/input-error';
import Swal from 'sweetalert2';

type Dispute = {
    id: number;
    subject: string;
    status: string;
    description: string;
    attachment_path: string | null;
    booking_code: string | null;
    ticket_name: string | null;
};

type Props = {
    disputes: Dispute[];
    bookings: Array<{ id: number; label: string }>;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard Mitra', href: '/mitra/dashboard' },
    { title: 'Laporan Masalah', href: '/mitra/events/disputes' },
];

export default function MitraEventDisputes({ disputes, bookings }: Props) {
    const form = useForm({
        event_booking_id: '',
        subject: '',
        description: '',
        attachment: null as File | null,
    });

    const submit = () => {
        const payload = new FormData();
        payload.append('event_booking_id', form.data.event_booking_id);
        payload.append('subject', form.data.subject);
        payload.append('description', form.data.description);
        if (form.data.attachment) {
            payload.append('attachment', form.data.attachment);
        }

        router.post('/mitra/events/disputes', payload, {
            onSuccess: () => {
                Swal.fire({ icon: 'success', title: 'Terkirim', text: 'Laporan dikirim.' });
                form.reset();
            },
            onError: () => Swal.fire({ icon: 'error', title: 'Gagal', text: 'Periksa data laporan.' }),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Laporan Masalah Event" />
            <div className="flex flex-1 flex-col gap-6 bg-[#f6fbff] px-6 py-8">
                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <h1 className="text-2xl font-semibold text-slate-900">Laporkan Masalah</h1>
                    <form
                        className="mt-6 grid gap-4 md:grid-cols-2"
                        onSubmit={(event) => {
                            event.preventDefault();
                            submit();
                        }}
                    >
                        <div>
                            <label className="text-xs font-semibold uppercase text-slate-500">Booking</label>
                            <select
                                value={form.data.event_booking_id}
                                onChange={(e) => form.setData('event_booking_id', e.target.value)}
                                className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                            >
                                <option value="">Pilih booking</option>
                                {bookings.map((booking) => (
                                    <option key={booking.id} value={booking.id}>
                                        {booking.label}
                                    </option>
                                ))}
                            </select>
                            <InputError message={form.errors.event_booking_id} />
                        </div>
                        <div>
                            <label className="text-xs font-semibold uppercase text-slate-500">Subjek</label>
                            <input
                                value={form.data.subject}
                                onChange={(e) => form.setData('subject', e.target.value)}
                                className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                            />
                            <InputError message={form.errors.subject} />
                        </div>
                        <div className="md:col-span-2">
                            <label className="text-xs font-semibold uppercase text-slate-500">Deskripsi</label>
                            <textarea
                                value={form.data.description}
                                onChange={(e) => form.setData('description', e.target.value)}
                                className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                rows={3}
                            />
                            <InputError message={form.errors.description} />
                        </div>
                        <div>
                            <label className="text-xs font-semibold uppercase text-slate-500">Lampiran</label>
                            <input
                                type="file"
                                onChange={(e) => form.setData('attachment', e.target.files?.[0] ?? null)}
                                className="mt-2 w-full text-sm"
                            />
                            <InputError message={form.errors.attachment} />
                        </div>
                        <div className="md:col-span-2 flex justify-end">
                            <Button type="submit" className="bg-sky-600 text-white hover:bg-sky-700">
                                Kirim Laporan
                            </Button>
                        </div>
                    </form>
                </section>

                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <h2 className="text-lg font-semibold text-slate-900">Riwayat Laporan</h2>
                    <div className="mt-4 grid gap-3">
                        {disputes.map((item) => (
                            <div key={item.id} className="rounded-2xl border border-slate-100 p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-semibold text-slate-900">{item.subject}</p>
                                        <p className="text-xs text-slate-500">
                                            {item.booking_code ?? '-'} • {item.ticket_name ?? '-'}
                                        </p>
                                    </div>
                                    <Badge className="bg-slate-100 text-slate-700">{item.status}</Badge>
                                </div>
                                <p className="mt-2 text-sm text-slate-600">{item.description}</p>
                                {item.attachment_path && (
                                    <a
                                        href={`/storage/${item.attachment_path}`}
                                        target="_blank"
                                        className="mt-2 inline-block text-xs text-sky-600"
                                        rel="noreferrer"
                                    >
                                        Lihat Lampiran
                                    </a>
                                )}
                            </div>
                        ))}
                        {disputes.length === 0 && (
                            <div className="text-sm text-slate-500">Belum ada laporan.</div>
                        )}
                    </div>
                </section>
            </div>
        </AppLayout>
    );
}
