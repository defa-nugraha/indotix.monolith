import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Swal from 'sweetalert2';

type Option = { id: string | number; label: string };

type BookingRow = {
    id: number;
    booking_code: string;
    visit_date: string;
    status: string;
    total_price: number;
    destination?: { id?: number; destination_name?: string | null };
    user?: { name?: string; email?: string };
};

type DisputeRow = {
    id: number;
    subject: string;
    status: string;
    booking_code?: string | null;
    destination?: string | null;
    ticket?: string | null;
    user?: string | null;
};

type Props = {
    bookings: { data: BookingRow[] };
    disputes: { data: DisputeRow[] };
    destinations: Option[];
    filters: {
        visit_date?: string;
        destination?: string;
        status?: string;
    };
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Wisata', href: '/admin/wisata/destinations' },
    { title: 'Refund & Exception', href: '/admin/wisata/exceptions' },
];

const statusTone = (status?: string) => {
    if (status === 'paid') return 'bg-emerald-50 text-emerald-700';
    if (status === 'pending_payment') return 'bg-amber-50 text-amber-700';
    if (status === 'cancelled') return 'bg-red-50 text-red-700';
    if (status === 'expired') return 'bg-slate-100 text-slate-600';
    if (status === 'completed') return 'bg-blue-50 text-blue-700';
    return 'bg-slate-50 text-slate-600';
};

export default function AdminWisataExceptionsIndex({ bookings, disputes, destinations, filters }: Props) {
    const submitFilters = (form: HTMLFormElement) => {
        const data = new FormData(form);
        router.get('/admin/wisata/exceptions', Object.fromEntries(data.entries()), {
            preserveState: true,
        });
    };

    const handleCancel = async (bookingId: number) => {
        const result = await Swal.fire({
            title: 'Batalkan booking?',
            input: 'select',
            inputOptions: {
                lokasi_tutup: 'Lokasi tutup',
                force_majeure: 'Force majeure',
                kesalahan_sistem: 'Kesalahan sistem',
            },
            inputPlaceholder: 'Pilih alasan',
            showCancelButton: true,
            confirmButtonText: 'Batalkan',
            cancelButtonText: 'Batal',
            inputValidator: (value) => {
                if (!value) return 'Alasan wajib dipilih.';
                return null;
            },
        });

        if (!result.isConfirmed) return;

        router.post(`/admin/wisata/bookings/${bookingId}/cancel`, { reason: result.value }, {
            onSuccess: () =>
                Swal.fire({ icon: 'success', title: 'Dibatalkan', text: 'Booking dibatalkan.' }),
            onError: () =>
                Swal.fire({ icon: 'error', title: 'Gagal', text: 'Tidak dapat membatalkan booking.' }),
        });
    };

    const handleRefund = async (bookingId: number) => {
        const result = await Swal.fire({
            title: 'Trigger refund?',
            html: '<input id="refund-reason" class="swal2-input" placeholder="Alasan refund">' +
                '<input id="refund-amount" type="number" class="swal2-input" placeholder="Nominal refund (opsional)">',
            showCancelButton: true,
            confirmButtonText: 'Refund',
            cancelButtonText: 'Batal',
            preConfirm: () => {
                const reason = (document.getElementById('refund-reason') as HTMLInputElement).value;
                const amount = (document.getElementById('refund-amount') as HTMLInputElement).value;
                if (!reason) {
                    Swal.showValidationMessage('Alasan refund wajib diisi.');
                }
                return { reason, amount };
            },
        });

        if (!result.isConfirmed) return;

        router.post(`/admin/wisata/bookings/${bookingId}/refund`, {
            reason: result.value?.reason,
            amount: result.value?.amount || null,
        }, {
            onSuccess: () =>
                Swal.fire({ icon: 'success', title: 'Refund', text: 'Refund berhasil diproses.' }),
            onError: () =>
                Swal.fire({ icon: 'error', title: 'Gagal', text: 'Tidak dapat memproses refund.' }),
        });
    };

    const handleDispute = async (disputeId: number, status: string) => {
        const result = await Swal.fire({
            title: 'Update status dispute',
            input: 'textarea',
            inputLabel: 'Resolusi / catatan',
            inputPlaceholder: 'Tulis resolusi',
            showCancelButton: true,
            confirmButtonText: 'Simpan',
            cancelButtonText: 'Batal',
        });

        if (!result.isConfirmed) return;

        router.post(`/admin/wisata/disputes/${disputeId}`, {
            status,
            resolution: result.value,
        }, {
            onSuccess: () =>
                Swal.fire({ icon: 'success', title: 'Tersimpan', text: 'Status dispute diperbarui.' }),
            onError: () =>
                Swal.fire({ icon: 'error', title: 'Gagal', text: 'Tidak dapat memperbarui dispute.' }),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Refund & Exception" />
            <div className="flex flex-1 flex-col gap-6 bg-[#f6fbff] px-6 py-8">
                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <h1 className="text-2xl font-semibold text-slate-900">Cancel & Refund Manual</h1>
                    <p className="text-sm text-slate-500">Batalkan booking dan trigger refund manual.</p>
                    <form
                        className="mt-6 grid gap-3 md:grid-cols-4"
                        onSubmit={(event) => {
                            event.preventDefault();
                            submitFilters(event.currentTarget);
                        }}
                    >
                        <input
                            name="visit_date"
                            type="date"
                            defaultValue={filters.visit_date ?? ''}
                            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                        />
                        <select
                            name="destination"
                            defaultValue={filters.destination ?? ''}
                            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                        >
                            <option value="">Semua destinasi</option>
                            {destinations.map((item) => (
                                <option key={item.id} value={item.id}>
                                    {item.label}
                                </option>
                            ))}
                        </select>
                        <select
                            name="status"
                            defaultValue={filters.status ?? ''}
                            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                        >
                            <option value="">Semua status</option>
                            <option value="pending_payment">Pending Payment</option>
                            <option value="paid">Paid</option>
                            <option value="cancelled">Cancelled</option>
                            <option value="expired">Expired</option>
                            <option value="completed">Completed</option>
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
                                    <th className="px-4 py-3 text-left">Booking</th>
                                    <th className="px-4 py-3 text-left">Destinasi</th>
                                    <th className="px-4 py-3 text-left">Tanggal</th>
                                    <th className="px-4 py-3 text-left">Status</th>
                                    <th className="px-4 py-3 text-left">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {bookings.data.map((row) => (
                                    <tr key={row.id} className="border-t border-slate-100">
                                        <td className="px-4 py-3">
                                            <div className="font-semibold text-slate-900">{row.booking_code}</div>
                                            <div className="text-xs text-slate-500">{row.user?.name ?? 'Guest'}</div>
                                        </td>
                                        <td className="px-4 py-3">{row.destination?.destination_name ?? '-'}</td>
                                        <td className="px-4 py-3">{row.visit_date}</td>
                                        <td className="px-4 py-3">
                                            <Badge className={statusTone(row.status)}>{row.status}</Badge>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex flex-wrap gap-2">
                                                <Button size="sm" variant="outline" onClick={() => handleCancel(row.id)}>
                                                    Cancel
                                                </Button>
                                                <Button size="sm" variant="outline" onClick={() => handleRefund(row.id)}>
                                                    Refund
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {bookings.data.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-500">
                                            Belum ada booking.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>

                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <h2 className="text-lg font-semibold text-slate-900">Penanganan Dispute</h2>
                    <div className="mt-4 overflow-hidden rounded-2xl border border-slate-100">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                                <tr>
                                    <th className="px-4 py-3 text-left">Kasus</th>
                                    <th className="px-4 py-3 text-left">Relasi</th>
                                    <th className="px-4 py-3 text-left">Status</th>
                                    <th className="px-4 py-3 text-left">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {disputes.data.map((item) => (
                                    <tr key={item.id} className="border-t border-slate-100">
                                        <td className="px-4 py-3">
                                            <div className="font-semibold text-slate-900">{item.subject}</div>
                                            <div className="text-xs text-slate-500">{item.booking_code ?? '-'}</div>
                                        </td>
                                        <td className="px-4 py-3 text-xs text-slate-600">
                                            <div>{item.user ?? '-'}</div>
                                            <div>{item.destination ?? '-'}</div>
                                            <div>{item.ticket ?? '-'}</div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <Badge className={item.status === 'resolved' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-50 text-slate-600'}>
                                                {item.status}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex flex-wrap gap-2">
                                                <Button size="sm" variant="outline" onClick={() => handleDispute(item.id, 'investigating')}>
                                                    Investigasi
                                                </Button>
                                                <Button size="sm" variant="outline" onClick={() => handleDispute(item.id, 'resolved')}>
                                                    Resolve
                                                </Button>
                                                <Button size="sm" variant="outline" onClick={() => handleDispute(item.id, 'rejected')}>
                                                    Reject
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {disputes.data.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="px-4 py-8 text-center text-sm text-slate-500">
                                            Belum ada dispute.
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
