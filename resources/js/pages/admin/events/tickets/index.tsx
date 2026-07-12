import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Swal from 'sweetalert2';
import { formatRupiah } from '@/lib/currency';

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
    canCreate: boolean;
    canUpdate: boolean;
    canDelete: boolean;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Event', href: '/admin/events' },
    { title: 'Produk Tiket', href: '/admin/events/tickets' },
];

export default function EventTicketsIndex({
    tickets,
    events,
    filters,
    canCreate,
    canUpdate,
    canDelete,
}: Props) {
    const deleteTicket = async (ticket: Ticket) => {
        const confirmation = await Swal.fire({
            icon: 'warning',
            title: 'Hapus tiket?',
            text: `${ticket.name} akan dihapus permanen jika belum memiliki booking.`,
            showCancelButton: true,
            confirmButtonText: 'Ya, hapus',
            cancelButtonText: 'Batal',
            confirmButtonColor: '#dc2626',
        });

        if (!confirmation.isConfirmed) {
            return;
        }

        router.delete(`/admin/events/tickets/${ticket.id}`, {
            preserveScroll: true,
            onSuccess: () =>
                Swal.fire({
                    icon: 'success',
                    title: 'Tiket dihapus',
                    timer: 1500,
                    showConfirmButton: false,
                }),
            onError: (errors) =>
                Swal.fire({
                    icon: 'error',
                    title: 'Tiket tidak dapat dihapus',
                    text:
                        errors.ticket ??
                        'Periksa apakah tiket sudah memiliki booking.',
                }),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Produk Tiket Event" />
            <div className="flex flex-1 flex-col gap-6 bg-[#f6fbff] px-6 py-8">
                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-semibold text-slate-900">
                                Produk Tiket Event
                            </h1>
                            <p className="text-sm text-slate-500">
                                Buat tiket baru serta kelola status, kuota, dan
                                batas pembelian.
                            </p>
                        </div>
                        {canCreate && (
                            <Button
                                asChild
                                className="bg-sky-600 text-white hover:bg-sky-700"
                            >
                                <Link href="/admin/events/tickets/create">
                                    Tambah Tiket
                                </Link>
                            </Button>
                        )}
                    </div>
                    <form
                        className="mt-6 flex flex-wrap gap-3"
                        onSubmit={(event) => {
                            event.preventDefault();
                            const data = new FormData(event.currentTarget);
                            router.get(
                                '/admin/events/tickets',
                                Object.fromEntries(data.entries()),
                                { preserveState: true },
                            );
                        }}
                    >
                        <label className="grid gap-1 text-xs font-medium text-slate-600">
                            <span>Event</span>
                            <select
                                name="event_id"
                                defaultValue={filters.event_id ?? ''}
                                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                            >
                                <option value="">Semua event</option>
                                {events.map((item) => (
                                    <option key={item.id} value={item.id}>
                                        {item.title}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <Button
                            type="submit"
                            className="bg-sky-600 text-white hover:bg-sky-700"
                        >
                            Filter
                        </Button>
                    </form>
                </section>

                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <div className="overflow-hidden rounded-2xl border border-slate-100">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 text-xs text-slate-500 uppercase">
                                <tr>
                                    <th className="px-4 py-3 text-left">
                                        Tiket
                                    </th>
                                    <th className="px-4 py-3 text-left">
                                        Event
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
                                    {(canUpdate || canDelete) && (
                                        <th className="px-4 py-3 text-right">
                                            Aksi
                                        </th>
                                    )}
                                </tr>
                            </thead>
                            <tbody>
                                {tickets.data.map((ticket) => (
                                    <tr
                                        key={ticket.id}
                                        className="border-t border-slate-100"
                                    >
                                        <td className="px-4 py-3 font-semibold text-slate-900">
                                            {ticket.name}
                                        </td>
                                        <td className="px-4 py-3">
                                            {ticket.event?.title ?? '-'}
                                        </td>
                                        <td className="px-4 py-3">
                                            {formatRupiah(ticket.price)}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div>{ticket.quota}</div>
                                            <div className="text-xs text-slate-500">
                                                Maks. {ticket.max_per_user}/user
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <Badge
                                                className={
                                                    ticket.is_active
                                                        ? 'bg-emerald-50 text-emerald-700'
                                                        : 'bg-rose-50 text-rose-700'
                                                }
                                            >
                                                {ticket.is_active
                                                    ? 'Aktif'
                                                    : 'Nonaktif'}
                                            </Badge>
                                        </td>
                                        {(canUpdate || canDelete) && (
                                            <td className="px-4 py-3">
                                                <div className="flex justify-end gap-2">
                                                    {canUpdate && (
                                                        <Button
                                                            asChild
                                                            size="sm"
                                                            variant="outline"
                                                        >
                                                            <Link
                                                                href={`/admin/events/tickets/${ticket.id}/edit`}
                                                            >
                                                                Edit
                                                            </Link>
                                                        </Button>
                                                    )}
                                                    {canDelete && (
                                                        <Button
                                                            type="button"
                                                            size="sm"
                                                            variant="destructive"
                                                            onClick={() =>
                                                                deleteTicket(
                                                                    ticket,
                                                                )
                                                            }
                                                        >
                                                            Hapus
                                                        </Button>
                                                    )}
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                                {tickets.data.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={
                                                canUpdate || canDelete ? 6 : 5
                                            }
                                            className="px-4 py-8 text-center text-sm text-slate-500"
                                        >
                                            Belum ada tiket event.
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
