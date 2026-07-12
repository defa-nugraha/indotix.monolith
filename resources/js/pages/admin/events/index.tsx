import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Swal from 'sweetalert2';
import { Filter, RotateCcw, Search } from 'lucide-react';

type EventRow = {
    id: number;
    title: string;
    status: string;
    capacity_total: number;
    capacity_sold: number;
    organizer?: { name?: string | null };
};

type Props = {
    events: { data: EventRow[]; links: Array<{ url: string | null; label: string; active: boolean }> };
    filters: {
        q?: string;
        organizer_id?: string;
        status?: string;
        date_from?: string;
        date_to?: string;
        capacity_state?: string;
    };
    organizerOptions: Array<{ id: number; name: string }>;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Event', href: '/admin/events' },
    { title: 'Manajemen Event', href: '/admin/events' },
];

export default function EventsIndex({ events, filters, organizerOptions }: Props) {
    const handleDelete = async (item: EventRow) => {
        const result = await Swal.fire({
            icon: 'warning',
            title: 'Hapus event?',
            text: `Event "${item.title}" akan dihapus permanen jika belum memiliki booking.`,
            showCancelButton: true,
            confirmButtonText: 'Ya, hapus',
            cancelButtonText: 'Batal',
            confirmButtonColor: '#dc2626',
            reverseButtons: true,
        });

        if (!result.isConfirmed) return;

        router.delete(`/admin/events/${item.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                Swal.fire({
                    icon: 'success',
                    title: 'Event dihapus',
                    text: 'Event berhasil dihapus dari daftar.',
                    timer: 1800,
                    showConfirmButton: false,
                });
            },
            onError: (errors) => {
                const message =
                    Object.values(errors).flat().join('\n') ||
                    'Event tidak dapat dihapus. Periksa apakah event sudah memiliki booking.';

                Swal.fire({
                    icon: 'error',
                    title: 'Gagal menghapus',
                    text: message,
                });
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Manajemen Event" />
            <div className="flex flex-1 flex-col gap-6 bg-[#f6fbff] px-6 py-8">
                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <h1 className="text-2xl font-semibold text-slate-900">Manajemen Event</h1>
                            <p className="text-sm text-slate-500">Approval, status event, dan kontrol kapasitas.</p>
                        </div>
                        <Link href="/admin/events/create">
                            <Button className="bg-sky-600 text-white hover:bg-sky-700">Tambah Event</Button>
                        </Link>
                    </div>
                    <form
                        className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-6"
                        onSubmit={(event) => {
                            event.preventDefault();
                            const data = new FormData(event.currentTarget);
                            router.get('/admin/events', Object.fromEntries(data.entries()), { preserveState: true });
                        }}
                    >
                        <label className="grid gap-1 text-xs font-medium text-slate-600 xl:col-span-2">
                            <span>Pencarian</span>
                            <div className="relative">
                                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                                <input
                                    name="q"
                                    defaultValue={filters.q ?? ''}
                                    placeholder="Cari nama event, lokasi, atau alamat"
                                    className="h-10 w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm"
                                />
                            </div>
                        </label>
                        <label className="grid gap-1 text-xs font-medium text-slate-600">
                            <span>Organizer</span>
                            <select name="organizer_id" defaultValue={filters.organizer_id ?? ''} className="h-10 rounded-lg border border-slate-200 px-3 py-2 text-sm">
                                <option value="">Semua organizer</option>
                                {organizerOptions.map((organizer) => (
                                    <option key={organizer.id} value={organizer.id}>
                                        {organizer.name}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <label className="grid gap-1 text-xs font-medium text-slate-600">
                            <span>Status</span>
                            <select name="status" defaultValue={filters.status ?? ''} className="h-10 rounded-lg border border-slate-200 px-3 py-2 text-sm">
                                <option value="">Semua status</option>
                                <option value="draft">Draft</option>
                                <option value="pending_review">Pending Review</option>
                                <option value="published">Published</option>
                                <option value="postponed">Postponed</option>
                                <option value="cancelled">Cancelled</option>
                                <option value="completed">Completed</option>
                            </select>
                        </label>
                        <label className="grid gap-1 text-xs font-medium text-slate-600">
                            <span>Kapasitas</span>
                            <select name="capacity_state" defaultValue={filters.capacity_state ?? ''} className="h-10 rounded-lg border border-slate-200 px-3 py-2 text-sm">
                                <option value="">Semua kapasitas</option>
                                <option value="available">Masih tersedia</option>
                                <option value="sold_out">Sold out</option>
                                <option value="sales_stopped">Penjualan dihentikan</option>
                            </select>
                        </label>
                        <label className="grid gap-1 text-xs font-medium text-slate-600">
                            <span>Tanggal mulai</span>
                            <input
                                type="date"
                                name="date_from"
                                defaultValue={filters.date_from ?? ''}
                                className="h-10 rounded-lg border border-slate-200 px-3 py-2 text-sm"
                            />
                        </label>
                        <label className="grid gap-1 text-xs font-medium text-slate-600">
                            <span>Tanggal akhir</span>
                            <input
                                type="date"
                                name="date_to"
                                defaultValue={filters.date_to ?? ''}
                                className="h-10 rounded-lg border border-slate-200 px-3 py-2 text-sm"
                            />
                        </label>
                        <div className="flex gap-2 xl:col-span-2">
                            <Button type="submit" className="bg-sky-600 text-white hover:bg-sky-700">
                                <Filter className="mr-2 size-4" />
                                Terapkan
                            </Button>
                            <Button type="button" variant="outline" onClick={() => router.get('/admin/events')}>
                                <RotateCcw className="mr-2 size-4" />
                                Reset
                            </Button>
                        </div>
                    </form>
                </section>

                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <div className="overflow-hidden rounded-2xl border border-slate-100">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                                <tr>
                                    <th className="px-4 py-3 text-left">Event</th>
                                    <th className="px-4 py-3 text-left">EO</th>
                                    <th className="px-4 py-3 text-left">Kapasitas</th>
                                    <th className="px-4 py-3 text-left">Status</th>
                                    <th className="px-4 py-3 text-left">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {events.data.map((item) => (
                                    <tr key={item.id} className="border-t border-slate-100">
                                        <td className="px-4 py-3">
                                            <div className="font-semibold text-slate-900">{item.title}</div>
                                        </td>
                                        <td className="px-4 py-3">{item.organizer?.name ?? '-'}</td>
                                        <td className="px-4 py-3">
                                            {item.capacity_sold}/{item.capacity_total}
                                        </td>
                                        <td className="px-4 py-3">
                                            <Badge className="bg-slate-100 text-slate-600">{item.status}</Badge>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex flex-wrap gap-3">
                                                <Link href={`/admin/events/${item.id}`} className="text-sky-600 hover:underline">
                                                    Detail
                                                </Link>
                                                <Link href={`/admin/events/${item.id}/edit`} className="text-slate-600 hover:underline">
                                                    Edit
                                                </Link>
                                                <button
                                                    type="button"
                                                    className="text-rose-600 hover:underline"
                                                    onClick={() => handleDelete(item)}
                                                >
                                                    Hapus
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {events.data.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-500">
                                            Belum ada event.
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
