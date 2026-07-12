import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Swal from 'sweetalert2';

type TicketRow = {
    id: number;
    name: string;
    price: number;
    quota: number;
    max_quota_override: number | null;
    is_active: boolean;
    destination?: { id?: number; destination_name?: string | null };
    owner?: { id?: number; name?: string; email?: string };
};

type Props = {
    tickets: {
        data: TicketRow[];
        links: Array<{ url: string | null; label: string; active: boolean }>;
    };
    filters: {
        search?: string;
        status?: string;
    };
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Wisata', href: '/admin/wisata/destinations' },
    { title: 'Produk Tiket', href: '/admin/wisata/tickets' },
];

export default function AdminWisataTicketsIndex({ tickets, filters }: Props) {
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

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Produk Tiket Wisata" />
            <div className="flex flex-1 flex-col gap-6 bg-[#f6fbff] px-6 py-8">
                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <div>
                        <p className="text-xs font-semibold text-sky-600 uppercase">
                            Wisata
                        </p>
                        <h1 className="mt-2 text-2xl font-semibold text-slate-900">
                            Manajemen Produk Tiket
                        </h1>
                        <p className="text-sm text-slate-500">
                            Review tiket mitra, aktifkan/nonaktifkan, dan
                            override kuota.
                        </p>
                    </div>
                    <form
                        className="mt-6 grid gap-3 md:grid-cols-3"
                        onSubmit={(event) => {
                            event.preventDefault();
                            submitFilters(event.currentTarget);
                        }}
                    >
                        <label className="grid gap-1 text-xs font-medium text-slate-600">
                            <span>Pencarian tiket</span>
                            <input
                                name="search"
                                defaultValue={filters.search ?? ''}
                                placeholder="Cari tiket / destinasi / mitra"
                                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                            />
                        </label>
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
                        <div className="flex gap-2">
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
                                onClick={() =>
                                    router.visit('/admin/wisata/tickets/create')
                                }
                            >
                                Tambah Tiket
                            </Button>
                        </div>
                    </form>
                </section>

                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <div className="overflow-hidden rounded-2xl border border-slate-100">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 text-xs text-slate-500 uppercase">
                                <tr>
                                    <th className="px-4 py-3 text-left">
                                        Produk
                                    </th>
                                    <th className="px-4 py-3 text-left">
                                        Destinasi
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
                                    <tr
                                        key={ticket.id}
                                        className="border-t border-slate-100"
                                    >
                                        <td className="px-4 py-3">
                                            <div className="font-semibold text-slate-900">
                                                {ticket.name}
                                            </div>
                                            <div className="text-xs text-slate-500">
                                                {ticket.owner?.name ?? '-'}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            {ticket.destination
                                                ?.destination_name ?? '-'}
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
                                            <div className="flex flex-wrap gap-2">
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
                                                    <span>Override kuota</span>
                                                    <input
                                                        type="number"
                                                        min={0}
                                                        defaultValue={
                                                            ticket.max_quota_override ??
                                                            ''
                                                        }
                                                        placeholder="Override kuota"
                                                        className="w-32 rounded-lg border border-slate-200 px-2 py-1 text-xs"
                                                        onBlur={(event) =>
                                                            handleUpdate(
                                                                ticket.id,
                                                                {
                                                                    max_quota_override:
                                                                        event.target
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
                                                        handleDelete(ticket.id)
                                                    }
                                                >
                                                    Hapus
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {tickets.data.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={6}
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
