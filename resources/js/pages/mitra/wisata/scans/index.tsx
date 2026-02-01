import { Head, router, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import InputError from '@/components/input-error';
import Swal from 'sweetalert2';

type ScanRow = {
    id: number;
    scanned_at: string;
    officer_name: string | null;
    location: string | null;
    is_anomaly: boolean;
    booking?: { booking_code?: string | null; visit_date?: string | null; ticket_name?: string | null };
};

type Props = {
    destination: { id: number; destination_name: string | null };
    scans: {
        data: ScanRow[];
        links: Array<{ url: string | null; label: string; active: boolean }>;
    };
    filters: { date?: string };
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard Mitra', href: '/mitra/dashboard' },
    { title: 'Validasi QR', href: '/mitra/wisata/scans' },
];

export default function MitraWisataScansIndex({ destination, scans, filters }: Props) {
    const form = useForm({
        booking_code: '',
        officer_name: '',
        location: '',
    });

    const submitFilters = (formEl: HTMLFormElement) => {
        const data = new FormData(formEl);
        router.get('/mitra/wisata/scans', Object.fromEntries(data.entries()), {
            preserveState: true,
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Validasi QR Wisata" />
            <div className="flex flex-1 flex-col gap-6 bg-[#f6fbff] px-6 py-8">
                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-600">
                            Validasi QR
                        </p>
                        <h1 className="mt-2 text-2xl font-semibold text-slate-900">
                            Scan Tiket {destination.destination_name ?? ''}
                        </h1>
                        <p className="text-sm text-slate-500">
                            Input kode booking untuk validasi tiket masuk.
                        </p>
                    </div>
                    <form
                        className="mt-6 grid gap-3 md:grid-cols-3"
                        onSubmit={(event) => {
                            event.preventDefault();
                            form.post('/mitra/wisata/scans', {
                                preserveScroll: true,
                                onSuccess: () =>
                                    Swal.fire({
                                        icon: 'success',
                                        title: 'Terscan',
                                        text: 'Tiket berhasil diverifikasi.',
                                    }),
                                onError: () =>
                                    Swal.fire({
                                        icon: 'error',
                                        title: 'Gagal',
                                        text: 'Tidak dapat memvalidasi tiket.',
                                    }),
                            });
                        }}
                    >
                        <div>
                            <input
                                value={form.data.booking_code}
                                onChange={(event) => form.setData('booking_code', event.target.value)}
                                placeholder="Kode booking"
                                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                            />
                            <InputError message={form.errors.booking_code} />
                        </div>
                        <input
                            value={form.data.officer_name}
                            onChange={(event) => form.setData('officer_name', event.target.value)}
                            placeholder="Nama petugas"
                            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                        />
                        <input
                            value={form.data.location}
                            onChange={(event) => form.setData('location', event.target.value)}
                            placeholder="Lokasi (opsional)"
                            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                        />
                        <div className="md:col-span-3 flex justify-end">
                            <Button type="submit" className="bg-sky-600 text-white hover:bg-sky-700">
                                Simpan Scan
                            </Button>
                        </div>
                    </form>
                </section>

                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <form
                        className="mb-4 flex flex-wrap items-center gap-3"
                        onSubmit={(event) => {
                            event.preventDefault();
                            submitFilters(event.currentTarget);
                        }}
                    >
                        <input
                            type="date"
                            name="date"
                            defaultValue={filters.date ?? ''}
                            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                        />
                        <Button type="submit" variant="outline" className="border-sky-200 text-sky-700 hover:bg-sky-50">
                            Filter
                        </Button>
                    </form>
                    <div className="overflow-hidden rounded-2xl border border-slate-100">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                                <tr>
                                    <th className="px-4 py-3 text-left">Waktu Scan</th>
                                    <th className="px-4 py-3 text-left">Kode Booking</th>
                                    <th className="px-4 py-3 text-left">Tiket</th>
                                    <th className="px-4 py-3 text-left">Petugas</th>
                                    <th className="px-4 py-3 text-left">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {scans.data.map((scan) => (
                                    <tr key={scan.id} className="border-t border-slate-100">
                                        <td className="px-4 py-3">{scan.scanned_at}</td>
                                        <td className="px-4 py-3">{scan.booking?.booking_code ?? '-'}</td>
                                        <td className="px-4 py-3">{scan.booking?.ticket_name ?? '-'}</td>
                                        <td className="px-4 py-3">{scan.officer_name ?? '-'}</td>
                                        <td className="px-4 py-3">
                                            <Badge className={scan.is_anomaly ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-700'}>
                                                {scan.is_anomaly ? 'Anomali' : 'Valid'}
                                            </Badge>
                                        </td>
                                    </tr>
                                ))}
                                {scans.data.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-500">
                                            Belum ada data scan.
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
