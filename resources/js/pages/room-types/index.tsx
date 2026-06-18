import { Head, Link, router } from '@inertiajs/react';
import { BedDouble, Eye, Pencil, Plus, Trash2 } from 'lucide-react';
import Swal from 'sweetalert2';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

type RoomType = {
    id: number;
    hotel_id: number;
    hotel_name: string | null;
    name: string;
    description: string | null;
    max_guest: number | null;
    bed_type: string | null;
    base_price: string;
    strike_price?: string | null;
    total_rooms: number;
    status: 'draft' | 'active' | 'suspended';
    images: Array<{ id: number; url: string }>;
};

type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

type RoomTypesPageProps = {
    roomTypes: {
        data: RoomType[];
        links: PaginationLink[];
    };
    filters: {
        search?: string;
        status?: string;
        hotel_id?: string;
        per_page?: number;
    };
    statusOptions: string[];
    hotelOptions: Array<{ id: number; label: string }>;
    isMitra?: boolean;
    basePath?: string;
};

export default function RoomTypeIndex({
    roomTypes,
    filters,
    statusOptions,
    hotelOptions,
    isMitra = false,
    basePath = '/room-types',
}: RoomTypesPageProps) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: isMitra ? '/mitra/dashboard' : '/dashboard' },
        { title: 'Tipe Kamar', href: basePath },
    ];
    const handleDelete = async (roomTypeId: number) => {
        const result = await Swal.fire({
            title: 'Hapus tipe kamar?',
            text: 'Tipe kamar dan galeri fotonya akan dihapus.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Ya, hapus',
            cancelButtonText: 'Batal',
            confirmButtonColor: '#dc2626',
        });

        if (!result.isConfirmed) {
            return;
        }

        router.delete(`${basePath}/${roomTypeId}`, {
            onSuccess: () => {
                Swal.fire({
                    title: 'Berhasil',
                    text: 'Tipe kamar berhasil dihapus.',
                    icon: 'success',
                    confirmButtonText: 'OK',
                });
            },
            onError: () => {
                Swal.fire({
                    title: 'Gagal',
                    text: 'Tipe kamar gagal dihapus.',
                    icon: 'error',
                    confirmButtonText: 'OK',
                });
            },
        });
    };

    const applyFilters = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        router.get(basePath, Object.fromEntries(form.entries()), {
            preserveState: true,
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Tipe Kamar">
                <link
                    href="https://fonts.bunny.net/css?family=space-grotesk:400,500,600,700|plus-jakarta-sans:400,500,600"
                    rel="stylesheet"
                />
            </Head>
            <div className="relative flex flex-1 flex-col gap-6 overflow-hidden bg-[#f6fbff] px-6 py-8 font-['Plus_Jakarta_Sans'] text-slate-900">
                <section className="relative overflow-hidden rounded-3xl border border-sky-100/80 bg-white/85 p-6 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.55)] backdrop-blur">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="space-y-2">
                            <p className="text-xs font-semibold uppercase text-sky-600">
                                Tipe Kamar & Inventory
                            </p>
                            <h1 className="text-2xl font-semibold text-slate-900 sm:text-3xl">
                                Definisi produk kamar
                            </h1>
                            <p className="text-sm text-slate-600">
                                Kelola tipe kamar, harga, stok, dan galeri foto.
                            </p>
                        </div>
                        <Button
                            asChild
                            className="bg-sky-600 text-white hover:bg-sky-700"
                        >
                            <Link href={`${basePath}/create`}>
                                <Plus className="mr-2 size-4" />
                                Tambah tipe kamar
                            </Link>
                        </Button>
                    </div>
                </section>

                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <form
                        onSubmit={applyFilters}
                        className="grid gap-4 md:grid-cols-5"
                    >
                        <div className="grid gap-2 md:col-span-2">
                            <label className="text-xs font-semibold uppercase text-slate-400">
                                Cari tipe kamar
                            </label>
                            <input
                                name="search"
                                defaultValue={filters.search ?? ''}
                                placeholder="Nama tipe kamar atau bed type"
                                className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs"
                            />
                        </div>
                        <div className="grid gap-2">
                            <label className="text-xs font-semibold uppercase text-slate-400">
                                Status
                            </label>
                            <select
                                name="status"
                                defaultValue={filters.status ?? ''}
                                className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs"
                            >
                                <option value="">Semua</option>
                                {statusOptions.map((status) => (
                                    <option key={status} value={status}>
                                        {status}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="grid gap-2">
                            <label className="text-xs font-semibold uppercase text-slate-400">
                                Hotel
                            </label>
                            <select
                                name="hotel_id"
                                defaultValue={filters.hotel_id ?? ''}
                                className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs"
                            >
                                <option value="">Semua</option>
                                {hotelOptions.map((hotel) => (
                                    <option key={hotel.id} value={hotel.id}>
                                        {hotel.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="grid gap-2">
                            <label className="text-xs font-semibold uppercase text-slate-400">
                                Tampilkan
                            </label>
                            <select
                                name="per_page"
                                defaultValue={filters.per_page ?? 25}
                                className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs"
                            >
                                {[25, 50, 100].map((size) => (
                                    <option key={size} value={size}>
                                        {size} data
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="flex items-end gap-3 md:col-span-2">
                            <Button
                                type="submit"
                                className="bg-sky-600 text-white hover:bg-sky-700"
                            >
                                Terapkan
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => router.get(basePath)}
                            >
                                Reset
                            </Button>
                        </div>
                    </form>
                </section>

                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-left text-sm">
                            <thead className="text-xs uppercase text-slate-400">
                                <tr>
                                    <th className="py-3 pr-4">Tipe Kamar</th>
                                    <th className="py-3 pr-4">Hotel</th>
                                    <th className="py-3 pr-4">Harga</th>
                                    <th className="py-3 pr-4">Stok</th>
                                    <th className="py-3 pr-4">Status</th>
                                    <th className="py-3 pr-4">Galeri</th>
                                    <th className="py-3 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {roomTypes.data.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={7}
                                            className="py-8 text-center text-slate-500"
                                        >
                                            Belum ada tipe kamar.
                                        </td>
                                    </tr>
                                )}
                                {roomTypes.data.map((room) => (
                                    <tr key={room.id}>
                                        <td className="py-4 pr-4">
                                            <div className="flex items-center gap-3">
                                                <div className="flex size-10 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
                                                    <BedDouble className="size-4" />
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-slate-900">
                                                        {room.name}
                                                    </p>
                                                    <p className="text-xs text-slate-500">
                                                        {room.bed_type ?? '-'} ·{' '}
                                                        {room.max_guest
                                                            ? `${room.max_guest} tamu`
                                                            : 'kapasitas belum diisi'}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 pr-4 text-slate-600">
                                            {room.hotel_name ?? '-'}
                                        </td>
                                        <td className="py-4 pr-4 text-slate-600">
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-slate-900">
                                                    Rp {Number(room.base_price).toLocaleString('id-ID')}
                                                </span>
                                                {room.strike_price && Number(room.strike_price) > 0 && (
                                                    <span className="text-xs text-slate-400 line-through">
                                                        Rp {Number(room.strike_price).toLocaleString('id-ID')}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-4 pr-4 text-slate-600">
                                            {room.total_rooms}
                                        </td>
                                        <td className="py-4 pr-4">
                                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                                                {room.status}
                                            </span>
                                        </td>
                                        <td className="py-4 pr-4">
                                            <Badge variant="secondary">
                                                {room.images.length} foto
                                            </Badge>
                                        </td>
                                        <td className="py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    asChild
                                                    className="border-slate-200"
                                                >
                                                    <Link href={`${basePath}/${room.id}`}>
                                                        <Eye className="mr-1 size-3" />
                                                        Detail
                                                    </Link>
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    asChild
                                                    className="border-slate-200"
                                                >
                                                    <Link
                                                        href={`${basePath}/${room.id}/edit`}
                                                    >
                                                        <Pencil className="mr-1 size-3" />
                                                        Edit
                                                    </Link>
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="border-red-200 text-red-600 hover:bg-red-50"
                                                    onClick={() =>
                                                        handleDelete(room.id)
                                                    }
                                                >
                                                    <Trash2 className="mr-1 size-3" />
                                                    Hapus
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
        </AppLayout>
    );
}
