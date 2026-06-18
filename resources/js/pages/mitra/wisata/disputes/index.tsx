import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import InputError from '@/components/input-error';
import Swal from 'sweetalert2';

type DisputeRow = {
    id: number;
    subject: string;
    status: string;
    description: string;
    attachment_path?: string | null;
    booking_code?: string | null;
    ticket_name?: string | null;
};

type Option = { id: number; label: string };

type Props = {
    destination: { id: number; destination_name: string | null };
    disputes: DisputeRow[];
    bookings: Option[];
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard Mitra', href: '/mitra/dashboard' },
    { title: 'Laporan Masalah', href: '/mitra/wisata/disputes' },
];

export default function MitraWisataDisputes({ destination, disputes, bookings }: Props) {
    const form = useForm({
        wisata_booking_id: bookings[0]?.id?.toString() ?? '',
        subject: '',
        description: '',
        attachment: null as File | null,
    });

    const handleSubmit = () => {
        form.post('/mitra/wisata/disputes', {
            forceFormData: true,
            onSuccess: () =>
                Swal.fire({ icon: 'success', title: 'Terkirim', text: 'Laporan berhasil dikirim.' }),
            onError: () =>
                Swal.fire({ icon: 'error', title: 'Gagal', text: 'Tidak dapat mengirim laporan.' }),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Laporan Masalah Wisata" />
            <div className="flex flex-1 flex-col gap-6 bg-[#f6fbff] px-6 py-8">
                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <p className="text-xs font-semibold uppercase text-sky-600">
                        Support
                    </p>
                    <h1 className="mt-2 text-2xl font-semibold text-slate-900">
                        Laporan Masalah {destination.destination_name ?? ''}
                    </h1>
                    <p className="text-sm text-slate-500">
                        Laporkan masalah booking atau validasi tiket ke admin.
                    </p>
                    <form
                        className="mt-6 grid gap-3 md:grid-cols-2"
                        onSubmit={(event) => {
                            event.preventDefault();
                            handleSubmit();
                        }}
                    >
                        <div className="grid gap-2">
                            <label className="text-sm font-medium text-slate-700">Booking</label>
                            <select
                                value={form.data.wisata_booking_id}
                                onChange={(event) => form.setData('wisata_booking_id', event.target.value)}
                                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                            >
                                <option value="">Pilih booking</option>
                                {bookings.map((item) => (
                                    <option key={item.id} value={item.id}>
                                        {item.label}
                                    </option>
                                ))}
                            </select>
                            <InputError message={form.errors.wisata_booking_id} />
                        </div>
                        <div className="grid gap-2">
                            <label className="text-sm font-medium text-slate-700">Subjek</label>
                            <input
                                value={form.data.subject}
                                onChange={(event) => form.setData('subject', event.target.value)}
                                placeholder="Contoh: Validasi gagal"
                                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                            />
                            <InputError message={form.errors.subject} />
                        </div>
                        <div className="grid gap-2 md:col-span-2">
                            <label className="text-sm font-medium text-slate-700">Deskripsi</label>
                            <textarea
                                className="min-h-[100px] rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                value={form.data.description}
                                onChange={(event) => form.setData('description', event.target.value)}
                            />
                            <InputError message={form.errors.description} />
                        </div>
                        <div className="grid gap-2 md:col-span-2">
                            <label className="text-sm font-medium text-slate-700">Upload Bukti (opsional)</label>
                            <input
                                type="file"
                                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                onChange={(event) => form.setData('attachment', event.target.files?.[0] ?? null)}
                            />
                        </div>
                        <div className="md:col-span-2 flex justify-end">
                            <Button type="submit" className="bg-sky-600 text-white hover:bg-sky-700">
                                Kirim Laporan
                            </Button>
                        </div>
                    </form>
                </section>

                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <div className="overflow-hidden rounded-2xl border border-slate-100">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                                <tr>
                                    <th className="px-4 py-3 text-left">Booking</th>
                                    <th className="px-4 py-3 text-left">Tiket</th>
                                    <th className="px-4 py-3 text-left">Subjek</th>
                                    <th className="px-4 py-3 text-left">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {disputes.map((item) => (
                                    <tr key={item.id} className="border-t border-slate-100">
                                        <td className="px-4 py-3">{item.booking_code ?? '-'}</td>
                                        <td className="px-4 py-3">{item.ticket_name ?? '-'}</td>
                                        <td className="px-4 py-3">
                                            <div className="font-semibold text-slate-900">{item.subject}</div>
                                            <div className="text-xs text-slate-500">{item.description}</div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <Badge className="bg-slate-50 text-slate-600">{item.status}</Badge>
                                        </td>
                                    </tr>
                                ))}
                                {disputes.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="px-4 py-8 text-center text-sm text-slate-500">
                                            Belum ada laporan.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
        </AppLayout>
    );
}
