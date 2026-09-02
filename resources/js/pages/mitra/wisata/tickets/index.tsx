import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Swal from 'sweetalert2';

type Ticket = {
    id: number;
    name: string;
    price: number;
    quota: number;
    daily_quota: number | null;
    min_order_quantity: number;
    max_order_quantity: number | null;
    ticket_type: string;
    ticket_kind: string;
    package_items: Array<{ ticket_id: number; quantity: number }>;
    valid_from: string | null;
    valid_until: string | null;
    refund_policy: string | null;
    is_active: boolean;
    is_closed: boolean;
};

type Props = {
    destination: { id: number; destination_name: string | null };
    tickets: Ticket[];
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard Mitra', href: '/mitra/dashboard' },
    { title: 'Produk Tiket', href: '/mitra/wisata/tickets' },
];

export default function MitraWisataTicketsIndex({
    destination,
    tickets,
}: Props) {
    const handleDelete = async (ticketId: number) => {
        const result = await Swal.fire({
            title: 'Hapus tiket?',
            input: 'textarea',
            inputLabel: 'Alasan penghapusan',
            inputPlaceholder: 'Tulis alasan...',
            showCancelButton: true,
            confirmButtonText: 'Hapus',
            cancelButtonText: 'Batal',
            inputValidator: (value) => {
                if (!value) return 'Alasan wajib diisi.';
                return null;
            },
        });

        if (!result.isConfirmed) return;

        router.delete(`/mitra/wisata/tickets/${ticketId}`, {
            data: { reason: result.value },
            preserveScroll: true,
            onSuccess: () =>
                Swal.fire({
                    icon: 'success',
                    title: 'Terhapus',
                    text: 'Tiket berhasil dihapus.',
                }),
            onError: () =>
                Swal.fire({
                    icon: 'error',
                    title: 'Gagal',
                    text: 'Tidak dapat menghapus tiket.',
                }),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Produk Tiket Wisata" />
            <div className="flex flex-1 flex-col gap-6 bg-[#f6fbff] px-6 py-8">
                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <p className="text-xs font-semibold text-sky-600 uppercase">
                                Wisata
                            </p>
                            <h1 className="mt-2 text-2xl font-semibold text-slate-900">
                                Produk Tiket{' '}
                                {destination.destination_name ?? ''}
                            </h1>
                            <p className="text-sm text-slate-500">
                                Kelola tiket yang dijual untuk destinasi ini.
                            </p>
                        </div>
                        <Button
                            className="w-full bg-sky-600 text-white hover:bg-sky-700 sm:w-auto"
                            data-coach="mitra-ticket-create"
                            onClick={() =>
                                router.visit('/mitra/wisata/tickets/create')
                            }
                        >
                            Tambah Tiket
                        </Button>
                    </div>
                </section>

                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <div
                        className="overflow-hidden rounded-2xl border border-slate-100"
                        data-coach="mitra-ticket-table"
                    >
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 text-xs text-slate-500 uppercase">
                                <tr>
                                    <th className="px-4 py-3 text-left">
                                        Produk
                                    </th>
                                    <th className="px-4 py-3 text-left">
                                        Harga
                                    </th>
                                    <th className="px-4 py-3 text-left">
                                        Kuota
                                    </th>
                                    <th className="px-4 py-3 text-left">
                                        Status
                                    </th>
                                    <th className="px-4 py-3 text-left">
                                        Aksi
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {tickets.map((ticket) => (
                                    <tr
                                        key={ticket.id}
                                        className="border-t border-slate-100"
                                    >
                                        <td className="px-4 py-3">
                                            <div className="font-semibold text-slate-900">
                                                {ticket.name}
                                            </div>
                                            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                                                <span>
                                                    {ticket.ticket_type ===
                                                    'grup'
                                                        ? 'Grup'
                                                        : 'Perorangan'}{' '}
                                                    •{' '}
                                                    {ticket.valid_from &&
                                                    ticket.valid_until
                                                        ? `${ticket.valid_from} - ${ticket.valid_until}`
                                                        : 'Berlaku setiap hari'}
                                                </span>
                                                {ticket.ticket_kind ===
                                                    'package' && (
                                                    <Badge className="bg-sky-50 text-sky-700">
                                                        Paket wisata
                                                        {ticket.package_items
                                                            .length > 0
                                                            ? ` (${ticket.package_items.length} isi)`
                                                            : ''}
                                                    </Badge>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            Rp{' '}
                                            {ticket.price.toLocaleString(
                                                'id-ID',
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div>Kuota: {ticket.quota}</div>
                                            <div className="text-xs text-slate-500">
                                                Kuota harian:{' '}
                                                {ticket.daily_quota ?? '-'}
                                            </div>
                                            <div className="text-xs text-slate-500">
                                                Order:{' '}
                                                {ticket.min_order_quantity ?? 1}
                                                {' - '}
                                                {ticket.max_order_quantity ??
                                                    'maks. sistem'}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <Badge
                                                className={
                                                    ticket.is_active &&
                                                    !ticket.is_closed
                                                        ? 'bg-emerald-50 text-emerald-700'
                                                        : 'bg-slate-50 text-slate-600'
                                                }
                                            >
                                                {ticket.is_active &&
                                                !ticket.is_closed
                                                    ? 'Aktif'
                                                    : 'Nonaktif'}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                                                <Link
                                                    href={`/mitra/wisata/tickets/create?edit=${ticket.id}`}
                                                    className="inline-flex min-h-9 items-center justify-center rounded-lg border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700"
                                                >
                                                    Edit
                                                </Link>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="border-rose-200 text-rose-600 hover:bg-rose-50"
                                                    onClick={() =>
                                                        handleDelete(ticket.id)
                                                    }
                                                >
                                                    Hapus
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {tickets.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={5}
                                            className="px-4 py-8 text-center text-sm text-slate-500"
                                        >
                                            Belum ada produk tiket.
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
