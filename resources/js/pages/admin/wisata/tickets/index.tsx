import { Head, router } from '@inertiajs/react';
import Swal from 'sweetalert2';
import { BulkDeleteTable, BulkDeleteRow, BulkDeleteSelectAll } from '@/components/admin/bulk-delete-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

type PaginationLink = { url: string | null; label: string; active: boolean };

type Paginated<T> = {
    data: T[];
    links: PaginationLink[];
};

type TicketRow = {
    id: number;
    name: string;
    price: number;
    quota: number;
    max_quota_override: number | null;
    min_order_quantity: number;
    max_order_quantity: number | null;
    ticket_kind: string;
    package_items: Array<{ ticket_id: number; quantity: number }>;
    is_active: boolean;
    is_weekend?: boolean;
    weekend_price?: number | null;
    destination?: { id?: number; destination_name?: string | null };
    owner?: { id?: number; name?: string; email?: string };
};

type DestinationRow = {
    id: number;
    destination_name: string | null;
    verification_status?: string | null;
    is_live: boolean;
    tickets_count: number;
    active_tickets_count: number;
    inactive_tickets_count: number;
    owner?: { id?: number | null; name?: string | null; email?: string | null };
};

type Props = {
    destinations?: Paginated<DestinationRow> | null;
    selectedDestination?: DestinationRow | null;
    tickets: Paginated<TicketRow>;
    filters: {
        destination_id?: number | null;
        search?: string;
        status?: string;
    };
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Wisata', href: '/admin/wisata/destinations' },
    { title: 'Produk Tiket', href: '/admin/wisata/tickets' },
];

const paginationLabel = (label: string) =>
    label
        .replace(/&laquo;/g, '‹')
        .replace(/&raquo;/g, '›')
        .replace(/&lsaquo;/g, '‹')
        .replace(/&rsaquo;/g, '›');

const verificationLabel = (status?: string | null) => {
    if (status === 'verified') return 'Terverifikasi';
    if (status === 'pending') return 'Menunggu';
    if (status === 'rejected') return 'Ditolak';
    return 'Draft';
};

const verificationTone = (status?: string | null) => {
    if (status === 'verified') return 'bg-emerald-50 text-emerald-700';
    if (status === 'pending') return 'bg-amber-50 text-amber-700';
    if (status === 'rejected') return 'bg-rose-50 text-rose-700';
    return 'bg-slate-50 text-slate-600';
};

function PaginationLinks({ links }: { links?: PaginationLink[] }) {
    if (!links || links.length === 0) return null;

    return (
        <div className="mt-4 flex flex-wrap justify-end gap-2">
            {links.map((link, index) => (
                <button
                    key={`${link.label}-${index}`}
                    type="button"
                    disabled={!link.url}
                    onClick={() => link.url && router.visit(link.url)}
                    className={`rounded-lg border px-3 py-1 text-sm ${
                        link.active
                            ? 'border-sky-600 bg-sky-600 text-white'
                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    } ${!link.url ? 'cursor-not-allowed opacity-50' : ''}`}
                >
                    {paginationLabel(link.label)}
                </button>
            ))}
        </div>
    );
}

export default function AdminWisataTicketsIndex({
    destinations,
    selectedDestination,
    tickets,
    filters,
}: Props) {
    const hasSelectedDestination = Boolean(selectedDestination);

    const handleUpdate = (
        ticketId: number,
        payload: Record<string, string | number | boolean | null>,
    ) => {
        router.put(`/admin/wisata/tickets/${ticketId}`, payload, {
            preserveScroll: true,
            onSuccess: () =>
                Swal.fire({
                    icon: 'success',
                    title: 'Berhasil',
                    text: 'Perubahan tiket disimpan.',
                }),
            onError: () =>
                Swal.fire({
                    icon: 'error',
                    title: 'Gagal',
                    text: 'Tidak dapat memperbarui tiket.',
                }),
        });
    };

    const submitFilters = (form: HTMLFormElement) => {
        const data = new FormData(form);
        router.get(
            '/admin/wisata/tickets',
            Object.fromEntries(data.entries()),
            {
                preserveState: true,
            },
        );
    };

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

        router.delete(`/admin/wisata/tickets/${ticketId}`, {
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

    const handleEditTicket = (ticket: TicketRow) => {
        router.visit(`/admin/wisata/tickets/${ticket.id}/edit`);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Produk Tiket Wisata" />
            <div className="workspace-page">
                <section className="workspace-panel">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                            <p className="text-xs font-semibold text-sky-600 uppercase">
                                Wisata
                            </p>
                            <h1 className="mt-2 text-2xl font-semibold text-slate-900">
                                {hasSelectedDestination
                                    ? 'Produk Tiket Wisata'
                                    : 'Pilih Destinasi Wisata'}
                            </h1>
                            <p className="text-sm text-slate-500">
                                {hasSelectedDestination
                                    ? 'Kelola tiket milik destinasi yang dipilih.'
                                    : 'Pilih destinasi atau mitra wisata terlebih dahulu untuk melihat produk tiketnya.'}
                            </p>
                        </div>
                        {hasSelectedDestination && (
                            <Button
                                type="button"
                                variant="outline"
                                className="border-sky-200 text-sky-700 hover:bg-sky-50"
                                onClick={() =>
                                    router.visit('/admin/wisata/tickets')
                                }
                            >
                                Kembali ke daftar destinasi
                            </Button>
                        )}
                    </div>

                    {selectedDestination && (
                        <div className="mt-5 rounded-2xl border border-sky-100 bg-sky-50/60 p-4">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <div className="text-sm font-bold text-slate-900">
                                        {selectedDestination.destination_name ??
                                            `Destinasi #${selectedDestination.id}`}
                                    </div>
                                    <div className="mt-1 text-xs text-slate-500">
                                        {selectedDestination.owner?.name ?? '-'}{' '}
                                        ·{' '}
                                        {selectedDestination.owner?.email ?? '-'}
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <Badge
                                        className={verificationTone(
                                            selectedDestination.verification_status,
                                        )}
                                    >
                                        {verificationLabel(
                                            selectedDestination.verification_status,
                                        )}
                                    </Badge>
                                    <Badge
                                        className={
                                            selectedDestination.is_live
                                                ? 'bg-emerald-50 text-emerald-700'
                                                : 'bg-slate-50 text-slate-600'
                                        }
                                    >
                                        {selectedDestination.is_live
                                            ? 'Live'
                                            : 'Draft'}
                                    </Badge>
                                </div>
                            </div>
                        </div>
                    )}

                    <form
                        className={`mt-6 grid gap-3 ${
                            hasSelectedDestination
                                ? 'md:grid-cols-3'
                                : 'md:grid-cols-[1fr_auto]'
                        }`}
                        data-coach="admin-wisata-ticket-filters"
                        onSubmit={(event) => {
                            event.preventDefault();
                            submitFilters(event.currentTarget);
                        }}
                    >
                        {hasSelectedDestination && (
                            <input
                                type="hidden"
                                name="destination_id"
                                value={filters.destination_id ?? ''}
                            />
                        )}
                        <label className="grid gap-1 text-xs font-medium text-slate-600">
                            <span>
                                {hasSelectedDestination
                                    ? 'Pencarian tiket'
                                    : 'Pencarian destinasi'}
                            </span>
                            <input
                                name="search"
                                defaultValue={filters.search ?? ''}
                                placeholder={
                                    hasSelectedDestination
                                        ? 'Cari nama tiket'
                                        : 'Cari destinasi atau mitra wisata'
                                }
                                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                            />
                        </label>
                        {hasSelectedDestination && (
                            <label className="grid gap-1 text-xs font-medium text-slate-600">
                                <span>Status</span>
                                <select
                                    name="status"
                                    defaultValue={filters.status ?? ''}
                                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                >
                                    <option value="">Semua status</option>
                                    <option value="active">Aktif</option>
                                    <option value="inactive">Nonaktif</option>
                                </select>
                            </label>
                        )}
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                            <Button
                                type="submit"
                                className="bg-sky-600 text-white hover:bg-sky-700"
                            >
                                Filter
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                className="border-sky-200 text-sky-700 hover:bg-sky-50"
                                data-coach="admin-wisata-ticket-create"
                                onClick={() =>
                                    router.visit('/admin/wisata/tickets/create')
                                }
                            >
                                Tambah Tiket
                            </Button>
                        </div>
                    </form>
                </section>

                {!hasSelectedDestination && (
                    <section
                        className="workspace-panel"
                        data-coach="admin-wisata-ticket-destinations"
                    >
                        <div className="workspace-table-wrap">
                            <table className="workspace-table">
                                <thead className="bg-slate-50 text-xs text-slate-500 uppercase">
                                    <tr>
                                        <th className="px-4 py-3 text-left">
                                            Destinasi
                                        </th>
                                        <th className="px-4 py-3 text-left">
                                            Mitra
                                        </th>
                                        <th className="px-4 py-3 text-left">
                                            Tiket
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
                                    {(destinations?.data ?? []).map(
                                        (destination) => (
                                            <tr
                                                key={destination.id}
                                                className="border-t border-slate-100"
                                            >
                                                <td className="px-4 py-3">
                                                    <div className="font-semibold text-slate-900">
                                                        {destination.destination_name ??
                                                            `Destinasi #${destination.id}`}
                                                    </div>
                                                    <div className="mt-1 text-xs text-slate-500">
                                                        ID: {destination.id}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="font-medium text-slate-700">
                                                        {destination.owner
                                                            ?.name ?? '-'}
                                                    </div>
                                                    <div className="text-xs text-slate-500">
                                                        {destination.owner
                                                            ?.email ?? '-'}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="font-semibold text-slate-900">
                                                        {
                                                            destination.tickets_count
                                                        }{' '}
                                                        tiket
                                                    </div>
                                                    <div className="mt-1 text-xs text-slate-500">
                                                        {
                                                            destination.active_tickets_count
                                                        }{' '}
                                                        aktif ·{' '}
                                                        {
                                                            destination.inactive_tickets_count
                                                        }{' '}
                                                        nonaktif
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex flex-wrap gap-2">
                                                        <Badge
                                                            className={verificationTone(
                                                                destination.verification_status,
                                                            )}
                                                        >
                                                            {verificationLabel(
                                                                destination.verification_status,
                                                            )}
                                                        </Badge>
                                                        <Badge
                                                            className={
                                                                destination.is_live
                                                                    ? 'bg-emerald-50 text-emerald-700'
                                                                    : 'bg-slate-50 text-slate-600'
                                                            }
                                                        >
                                                            {destination.is_live
                                                                ? 'Live'
                                                                : 'Draft'}
                                                        </Badge>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <Button
                                                        size="sm"
                                                        className="bg-sky-600 text-white hover:bg-sky-700"
                                                        onClick={() =>
                                                            router.visit(
                                                                `/admin/wisata/tickets?destination_id=${destination.id}`,
                                                            )
                                                        }
                                                    >
                                                        Lihat Tiket
                                                    </Button>
                                                </td>
                                            </tr>
                                        ),
                                    )}
                                    {(destinations?.data ?? []).length ===
                                        0 && (
                                        <tr>
                                            <td
                                                colSpan={5}
                                                className="px-4 py-8 text-center text-sm text-slate-500"
                                            >
                                                Belum ada destinasi wisata.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <PaginationLinks links={destinations?.links} />
                    </section>
                )}

                {hasSelectedDestination && (
                    <section
                        className="workspace-panel"
                        data-coach="admin-wisata-ticket-table"
                    >
                        <div className="workspace-table-wrap">
                            <BulkDeleteTable requireReason className="workspace-table">
                                <thead className="bg-slate-50 text-xs text-slate-500 uppercase">
                                    <tr>
                                        <BulkDeleteSelectAll />
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
                                    {tickets.data.map((ticket) => (
                                        <BulkDeleteRow deleteUrl={`/admin/wisata/tickets/${ticket.id}`}
                                            key={ticket.id}
                                            className="border-t border-slate-100"
                                        >
                                            <td className="px-4 py-3">
                                                <div className="font-semibold text-slate-900">
                                                    {ticket.name}
                                                </div>
                                                {ticket.ticket_kind ===
                                                    'package' && (
                                                    <Badge className="mt-2 bg-sky-50 text-sky-700">
                                                        Paket wisata
                                                        {ticket.package_items
                                                            .length > 0
                                                            ? ` (${ticket.package_items.length} isi)`
                                                            : ''}
                                                    </Badge>
                                                )}
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
                                                    Override:{' '}
                                                    {ticket.max_quota_override ??
                                                        '-'}
                                                </div>
                                                <div className="text-xs text-slate-500">
                                                    Order:{' '}
                                                    {ticket.min_order_quantity ??
                                                        1}
                                                    {' - '}
                                                    {ticket.max_order_quantity ??
                                                        'maks. sistem'}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <Badge
                                                    className={
                                                        ticket.is_active
                                                            ? 'bg-emerald-50 text-emerald-700'
                                                            : 'bg-slate-50 text-slate-600'
                                                    }
                                                >
                                                    {ticket.is_active
                                                        ? 'Aktif'
                                                        : 'Nonaktif'}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() =>
                                                            handleEditTicket(
                                                                ticket,
                                                            )
                                                        }
                                                    >
                                                        Edit
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() =>
                                                            handleUpdate(
                                                                ticket.id,
                                                                {
                                                                    is_active:
                                                                        !ticket.is_active,
                                                                },
                                                            )
                                                        }
                                                    >
                                                        {ticket.is_active
                                                            ? 'Nonaktifkan'
                                                            : 'Aktifkan'}
                                                    </Button>
                                                    <label className="grid gap-1 text-xs font-medium text-slate-600">
                                                        <span>
                                                            Override kuota
                                                        </span>
                                                        <input
                                                            type="number"
                                                            min={0}
                                                            defaultValue={
                                                                ticket.max_quota_override ??
                                                                ''
                                                            }
                                                            placeholder="Override kuota"
                                                            className="w-full rounded-lg border border-slate-200 px-2 py-1 text-xs sm:w-32"
                                                            onBlur={(event) =>
                                                                handleUpdate(
                                                                    ticket.id,
                                                                    {
                                                                        max_quota_override:
                                                                            event
                                                                                .target
                                                                                .value ||
                                                                            null,
                                                                    },
                                                                )
                                                            }
                                                        />
                                                    </label>
                                                    <label className="grid gap-1 text-xs font-medium text-slate-600">
                                                        <span>Min. order</span>
                                                        <input
                                                            type="number"
                                                            min={1}
                                                            max={20}
                                                            defaultValue={
                                                                ticket.min_order_quantity ??
                                                                1
                                                            }
                                                            className="w-full rounded-lg border border-slate-200 px-2 py-1 text-xs sm:w-28"
                                                            onBlur={(event) =>
                                                                handleUpdate(
                                                                    ticket.id,
                                                                    {
                                                                        min_order_quantity:
                                                                            event
                                                                                .target
                                                                                .value ||
                                                                            1,
                                                                        max_order_quantity:
                                                                            ticket.max_order_quantity,
                                                                    },
                                                                )
                                                            }
                                                        />
                                                    </label>
                                                    <label className="grid gap-1 text-xs font-medium text-slate-600">
                                                        <span>Maks. order</span>
                                                        <input
                                                            type="number"
                                                            min={1}
                                                            max={20}
                                                            defaultValue={
                                                                ticket.max_order_quantity ??
                                                                ''
                                                            }
                                                            placeholder="Sistem"
                                                            className="w-full rounded-lg border border-slate-200 px-2 py-1 text-xs sm:w-28"
                                                            onBlur={(event) =>
                                                                handleUpdate(
                                                                    ticket.id,
                                                                    {
                                                                        min_order_quantity:
                                                                            ticket.min_order_quantity ??
                                                                            1,
                                                                        max_order_quantity:
                                                                            event
                                                                                .target
                                                                                .value ||
                                                                            null,
                                                                    },
                                                                )
                                                            }
                                                        />
                                                    </label>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="border-rose-200 text-rose-600 hover:bg-rose-50"
                                                        onClick={() =>
                                                            handleDelete(
                                                                ticket.id,
                                                            )
                                                        }
                                                    >
                                                        Hapus
                                                    </Button>
                                                </div>
                                            </td>
                                        </BulkDeleteRow>
                                    ))}
                                    {tickets.data.length === 0 && (
                                        <tr>
                                            <td
                                                colSpan={6}
                                                className="px-4 py-8 text-center text-sm text-slate-500"
                                            >
                                                Belum ada produk tiket untuk
                                                destinasi ini.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </BulkDeleteTable>
                        </div>
                        <PaginationLinks links={tickets.links} />
                    </section>
                )}
            </div>
        </AppLayout>
    );
}
